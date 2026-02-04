import { useState, useEffect } from 'react';

const usePokemon = (pokemonUrl) => {
    const [pokemonData, setPokemonData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPokemon = async () => {
            try {
                const response = await fetch(pokemonUrl);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setPokemonData(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPokemon();
    }, [pokemonUrl]);

    return { pokemonData, loading, error };
};

export default usePokemon;