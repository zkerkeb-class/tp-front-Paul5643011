import { useState, useEffect } from "react";
import PokeCard from "../pokeCard";

import './index.css';

const PokeList = () => {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://pokeapi.co/api/v2/pokemon?limit=30")
            .then((response) => response.json())
            .then((data) => {
                console.log("Données reçues:", data);
                setPokemons(data.results);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Erreur:", error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p>Chargement...</p>
    }

    return (
        <div  className="poke-list-container">
            <h2>Liste des Pokémon</h2>
            <ul className="poke-list">
                {pokemons.map((pokemon, index) => (
                    <PokeCard key={index} pokemon={pokemon} />
                ))}
            </ul>
        </div>
    );
};

export default PokeList;
