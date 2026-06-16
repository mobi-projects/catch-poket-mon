import { useState } from "react";
import {
  PokeDetails,
  usePokeDataInfinite,
} from "../../hook/usePokedexInfinity";
import { getPokemon, getPokemonSpecies } from "../../libs/axios/pokeAPI";
import {
  PokedexConvertType,
  PokemonData,
} from "../../types/pokeTypes/pokemonData";
import LoadingPage from "../commons/loadingPage";
import PokemonCard from "../commons/pokemonCard";
import Overlay from "../commons/overlay";
import PoketMonDetailPage from "../../pages/poketMonDetailPage";
import convertToPokemon from "../../utils/pokedexConvertToPokemon";
import getKoreanName from "../../utils/getKoreanName";
import { useInView } from "react-intersection-observer";

const PokemonInfiniteList = () => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = usePokeDataInfinite({
    getPokemonSpecies: getPokemonSpecies,
    getPokemon: getPokemon,
  });
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonData | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const toggleOverlay = () => setIsOpen(!isOpen);

  const handlePokeClick = (pokeDetail: PokeDetails) => {
    const poke = convertToPokemon(pokeDetail);
    setSelectedPokemon(poke);
    toggleOverlay();
  };

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView: boolean) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });
  if (status === "loading") return <LoadingPage />;
  if (status === "error" && error instanceof Error)
    return <div>Error: {error.message}</div>;
  return (
    <div>
      <h1 className="text-lg p-4">포켓몬 도감</h1>
      <div>
        <div className="w-full min-h-[500px] grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.pages.map((page, pageIndex) => (
            <div key={pageIndex} className="contents">
              {page?.map((poke, idx) => {
                const isLastElement =
                  pageIndex === data.pages.length - 1 &&
                  idx === page.length - 1;
                return (
                  <div
                    key={idx}
                    className="flex justify-center items-center"
                    ref={isLastElement ? ref : null}
                  >
                    <PokemonCard
                      key={poke.pokemon.id}
                      poke_id={poke.pokemon.id}
                      name={getKoreanName(poke.species.names)}
                      type={(poke.pokemon.types ?? []).map(
                        (typeInfo) => typeInfo.type.name as PokedexConvertType,
                      )}
                      url={
                        poke?.pokemon.sprites?.other?.showdown?.front_default
                      }
                      onClick={() => handlePokeClick(poke)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div>{isFetchingNextPage && <LoadingPage />}</div>
        {isOpen && (
          <Overlay
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            widthCss={"max-w-3xl"}
            heightCss={"h-1/2"}
          >
            {selectedPokemon && <PoketMonDetailPage poke={selectedPokemon} />}
          </Overlay>
        )}
      </div>
    </div>
  );
};
export default PokemonInfiniteList;
