import { useDispatch, useSelector } from "react-redux";
import { PokemonRoot } from "../../types/pokeTypes/pokemonType";
import { SpeciesRoot } from "../../types/pokeTypes/speciesType";
import getKoreanName from "../../utils/getKoreanName";
import { setCatching } from "../../libs/redux/catchingSlice";
import { RootState } from "../../libs/redux/store";

type PokeData = {
    species: SpeciesRoot;
    pokemon: PokemonRoot;
};

interface ScreenData {
    data: PokeData;
    onCatchPoketMon: () => void;
    setRunAway: (value: boolean) => void;
}

const EncounterPokeScreen = ({
    data,
    onCatchPoketMon,
    setRunAway,
}: ScreenData) => {
    const dispatch = useDispatch();
    const isCatching = useSelector(
        (state: RootState) => state.catching.isCatching
    );

    // 포획률 계산
    const captureRate = data?.species.capture_rate;
    const capturePercent = captureRate
        ? ((captureRate / 255) * 100).toFixed(2)
        : null;

    const handleCatch = () => {
        dispatch(setCatching(true));
        onCatchPoketMon();
    };

    const handleRunway = () => {
        dispatch(setCatching(true));
        setRunAway(true);
    };
    return (
        <div className="absolutes w-full">
            <div className="w-full flex items-center justify-center">
                <div className="max-w-[922px] w-full h-[440px] lg:h-[520px] flex justify-center items-center flex-col">
                    <div className="w-full flex justify-end items-center">
                        <p className=" text-lg">포획률 : {capturePercent}%</p>
                    </div>

                    <div className="h-[320px] lg:h-[400px]  flex items-center ">
                        <img
                            src={
                                data.pokemon.sprites.other.showdown
                                    .front_default
                            }
                            className="h-[200px] "
                        />
                    </div>
                    <div className="w-[100%] h-[100px] mt-[-10px] text-xl bg-SYSTEM-white text-center flex justify-center items-center border border-SYSTEM-black rounded-md md:max-h-[50px]">
                        앗! 야생 {getKoreanName(data.species.names)}
                        (이)가 나타났다!
                    </div>
                </div>
            </div>
            <div className="flex justify-center gap-[30px]">
                <button
                    className="w-[150px] h-[60px] bg-MAIN-gray z-50"
                    onClick={handleCatch}
                    disabled={isCatching}
                >
                    포획하기
                </button>
                <button
                    className="w-[150px] h-[60px] bg-MAIN-gray"
                    onClick={handleRunway}
                >
                    도망가기
                </button>
            </div>
        </div>
    );
};

export default EncounterPokeScreen;
