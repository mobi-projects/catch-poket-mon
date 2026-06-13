# catch-poket-mon 백엔드 서버

기존 팀원 서버(`pokeserver.soljk.com:3300`)를 대체하는 Express 서버입니다.
프론트엔드의 REST 계약과 1:1로 맞춰져 있어, **프론트는 환경변수 `VITE_APP_URL`만 바꾸면** 됩니다.

## 구현된 API (`baseURL` = `https://<배포주소>/api`)

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/user/sign-up` | - | 회원가입 `{userId, password, data:{nickName}}` |
| POST | `/user/sign-in` | - | 로그인 → `{token, userId, nickName, profileUrl}` |
| POST | `/user/sign-out` | - | 로그아웃 (refresh 쿠키 삭제) |
| GET | `/user/refresh` | 쿠키 | 새 access token `{token}` |
| PATCH | `/user/update/info` | ✅ | 닉네임 수정 `{data:{nickName}}` |
| PATCH | `/user/update/profileUrl` | ✅ | 프로필 이미지(multipart `image`) → `{profileUrl}` |
| POST | `/data/poke` | ✅ | 포켓몬 저장 `{pokeId, type, name, url, background}` |
| GET | `/data/poke?page=N` | ✅ | 포켓몬 조회 (페이지당 10마리, `poke_id` 포함 배열) |
| DELETE | `/data/poke/:id` | ✅ | 포켓몬 삭제 |

인증: `Authorization: Bearer <token>` (JWT).

---

## 1. MongoDB Atlas 무료 DB 만들기 (M0)

1. https://www.mongodb.com/cloud/atlas 가입 → **무료 M0 클러스터** 생성
2. **Database Access**: DB 사용자 생성 (username/password 기억)
3. **Network Access**: `0.0.0.0/0` 추가 (어디서나 접속 허용 — 무료 호스팅 IP가 유동적이라 필요)
4. **Connect → Drivers**: 연결 문자열 복사
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/catchpoketmon?...`

## 2. 로컬 실행 (선택)

```bash
cd server
cp .env.example .env   # .env 열어서 MONGODB_URI, JWT_SECRET 채우기
npm install
npm run dev            # http://localhost:3300
```

## 3. Render 무료 배포

> 이 `server/` 폴더가 별도 깃 저장소(또는 현재 저장소의 서브디렉터리)에 올라가 있어야 합니다.

1. https://render.com 가입 → **New → Web Service**
2. 깃 저장소 연결
3. 설정:
   - **Root Directory**: `server` (모노레포인 경우)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. **Environment** 탭에서 변수 추가:
   - `MONGODB_URI` = Atlas 연결 문자열
   - `JWT_SECRET` = 긴 랜덤 문자열
   - `CLIENT_ORIGIN` = `https://catch-poket-mon.vercel.app`
   - (`PORT`는 Render가 자동 주입하므로 설정 불필요)
5. 배포 완료 후 주소 확인: `https://catch-poket-mon-server.onrender.com`
   - 브라우저로 열어 `{"ok":true,...}` 나오면 성공

> ⚠️ Render 무료 플랜은 15분 미사용 시 잠들어, 첫 요청이 ~50초 걸릴 수 있습니다.

## 4. 프론트엔드 연결

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**:

```
VITE_APP_URL = https://catch-poket-mon-server.onrender.com/api
VITE_APP_POKE_BASE_URL = https://pokeapi.co/api/v2
```

> `/api` 까지 포함해야 합니다 (프론트는 `${VITE_APP_URL}/user/sign-in` 식으로 호출).

저장 후 **Redeploy** (Vite 환경변수는 빌드 타임 주입이라 재배포 필수).

## 참고

- 프로필 이미지는 간단하게 base64 data URL로 DB에 저장합니다. 트래픽이 커지면 Cloudinary(무료 티어) 등으로 교체하세요.
- 페이지당 10마리 × 프론트가 1~3페이지 요청 = 최대 30마리 (UI의 "최대 30마리"와 일치).
