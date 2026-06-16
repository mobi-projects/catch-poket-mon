import { Name } from "../types/pokeTypes/speciesType";

/**
 * PokeAPI species.names 배열에서 한글 이름을 안전하게 추출한다.
 * 배열 인덱스(names[2])는 포켓몬마다 순서/길이가 달라 신뢰할 수 없으므로
 * language.name === "ko" 로 찾고, 없으면 영어 → 첫 항목 순으로 폴백한다.
 */
const getKoreanName = (names?: Name[]): string => {
    if (!names || names.length === 0) return "";
    const ko = names.find((n) => n.language?.name === "ko");
    const en = names.find((n) => n.language?.name === "en");
    return ko?.name ?? en?.name ?? names[0]?.name ?? "";
};

export default getKoreanName;
