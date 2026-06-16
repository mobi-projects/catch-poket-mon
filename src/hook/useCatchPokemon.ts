import { useState } from "react";
import { useMutation } from "react-query";
import { postData } from "../libs/axios/dataAPI";
import { SpeciesRoot } from "../types/pokeTypes/speciesType";
import { PokemonRoot } from "../types/pokeTypes/pokemonType";
import getKoreanName from "../utils/getKoreanName";

export interface PokeData {
    species: SpeciesRoot;
    pokemon: PokemonRoot;
}

const useCatchPokemon = (data: PokeData | undefined | null) => {
    const [catchResult, setCatchResult] = useState<boolean | null>(null);
    const { mutate } = useMutation(postData, {
        onSuccess: () => {
            setCatchResult(true);
        },
        onError: () => {
            setCatchResult(false);
        },
    });

    // 포획 버튼 클릭 이벤트
    const onCatchPoketMon = () => {
        if (!data) {
            return;
        }
        const isSuccess =
            data.species.capture_rate &&
            Math.random() < data.species.capture_rate / 255;
        if (isSuccess) {
            const typesName = (data.pokemon.types ?? []).map(
                (type) => type.type.name
            );
            const koreanName = getKoreanName(data.species.names);
            if (data.pokemon.id && typesName && koreanName) {
                const postPokeData = {
                    poke_id: data.pokemon.id,
                    type: typesName,
                    name: koreanName,
                    url: data.pokemon.sprites?.other?.showdown?.front_default,
                    background: data.species.color.name,
                };
                mutate(postPokeData);
            }
        } else {
            setCatchResult(false);
        }
    };
    return { catchResult, onCatchPoketMon };
};
export default useCatchPokemon;
