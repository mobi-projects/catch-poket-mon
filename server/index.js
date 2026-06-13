require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require("multer");

const {
  PORT = 3300,
  MONGODB_URI,
  JWT_SECRET = "dev-secret-change-me",
  CLIENT_ORIGIN = "https://catch-poket-mon.vercel.app",
} = process.env;

// 페이지당 포켓몬 수 (프론트는 page 1~3을 요청 → 3 * 10 = 30마리, "최대 30마리"와 일치)
const PAGE_SIZE = 10;

/* ------------------------------- DB 모델 ------------------------------- */
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    nickName: { type: String, default: "" },
    profileUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const pokeSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true }, // userId
    pokeId: { type: Number, required: true },
    type: { type: [String], default: [] },
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    background: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Poke = mongoose.model("Poke", pokeSchema);

/* ------------------------------- 앱 설정 ------------------------------- */
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/* ------------------------------- 토큰 유틸 ------------------------------- */
const signAccessToken = (user) =>
  jwt.sign({ sub: user.userId }, JWT_SECRET, { expiresIn: "7d" });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user.userId, t: "refresh" }, JWT_SECRET, { expiresIn: "30d" });

// 인증 미들웨어: Authorization: Bearer <token>
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "토큰이 없습니다." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

const router = express.Router();

/* --------------------------------- 회원 --------------------------------- */
// 회원가입: { userId, password, data: { nickName } }
router.post("/user/sign-up", async (req, res) => {
  try {
    const { userId, password, data } = req.body || {};
    if (!userId || !password)
      return res.status(400).json({ message: "userId와 password는 필수입니다." });

    const exists = await User.findOne({ userId });
    if (exists) return res.status(409).json({ message: "이미 존재하는 아이디입니다." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      userId,
      passwordHash,
      nickName: data?.nickName || "",
    });
    return res.status(201).json({ userId: user.userId, nickName: user.nickName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 로그인: { userId, password } → { token, userId, nickName, profileUrl }
router.post("/user/sign-in", async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    const user = await User.findOne({ userId });
    if (!user) return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

    const token = signAccessToken(user);
    res.cookie("refreshToken", signRefreshToken(user), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      token,
      userId: user.userId,
      nickName: user.nickName,
      profileUrl: user.profileUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 로그아웃
router.post("/user/sign-out", (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none" });
  return res.status(200).json({ message: "로그아웃 되었습니다." });
});

// 리프레시: 쿠키의 refreshToken → 새 access token { token }
router.get("/user/refresh", async (req, res) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (!rt) return res.status(401).json({ message: "리프레시 토큰이 없습니다." });
    const payload = jwt.verify(rt, JWT_SECRET);
    const user = await User.findOne({ userId: payload.sub });
    if (!user) return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    return res.status(200).json({ token: signAccessToken(user) });
  } catch {
    return res.status(401).json({ message: "유효하지 않은 리프레시 토큰입니다." });
  }
});

// 닉네임 수정: { data: { nickName } }
router.patch("/user/update/info", auth, async (req, res) => {
  try {
    const nickName = req.body?.data?.nickName;
    const user = await User.findOneAndUpdate(
      { userId: req.userId },
      { ...(nickName !== undefined ? { nickName } : {}) },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    return res.status(200).json({ userId: user.userId, nickName: user.nickName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 프로필 이미지 수정: multipart(image) → { profileUrl }
// (무료/간단 구현: 이미지를 base64 data URL로 DB에 저장. 추후 Cloudinary 등으로 교체 가능)
router.patch("/user/update/profileUrl", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "이미지가 없습니다." });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const user = await User.findOneAndUpdate(
      { userId: req.userId },
      { profileUrl: dataUrl },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    return res.status(200).json({ profileUrl: user.profileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

/* ------------------------------ 포켓몬 데이터 ------------------------------ */
// 포획/저장: { pokeId, type, name, url, background }
router.post("/data/poke", auth, async (req, res) => {
  try {
    const { pokeId, type, name, url, background } = req.body || {};
    const poke = await Poke.create({
      owner: req.userId,
      pokeId,
      type: Array.isArray(type) ? type : [],
      name,
      url,
      background,
    });
    return res.status(201).json(serializePoke(poke));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 조회: ?page=N → 배열 반환 (프론트는 poke_id 스네이크로 읽음)
router.get("/data/poke", auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pokes = await Poke.find({ owner: req.userId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);
    return res.status(200).json(pokes.map(serializePoke));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 놓아주기(삭제): /data/poke/:id
router.delete("/data/poke/:id", auth, async (req, res) => {
  try {
    const deleted = await Poke.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!deleted) return res.status(404).json({ message: "포켓몬을 찾을 수 없습니다." });
    return res.status(200).json({ id: String(deleted._id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 프론트 계약에 맞춰 직렬화: pokeId(저장) → poke_id(응답)
function serializePoke(doc) {
  return {
    id: String(doc._id),
    poke_id: doc.pokeId,
    type: doc.type,
    name: doc.name,
    url: doc.url,
    background: doc.background,
  };
}

app.get("/", (req, res) => res.json({ ok: true, service: "catch-poket-mon-server" }));
app.use("/api", router);

/* --------------------------------- 시작 --------------------------------- */
async function start() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI 환경변수가 필요합니다.");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB 연결 성공");
  app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
}
start();
