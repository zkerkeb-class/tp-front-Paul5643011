import {Link, useParams} from 'react-router';
import usePokemon from '../hook/usePokemon';

const PokemonDetails = () => { 
    const {url} = useParams(); 
    const {pokemonData, loading, error} = usePokemon(decodeURIComponent(url));
    console.log('pokemonData details', pokemonData);


    if (loading) {
        return <p>Chargement des détails du Pokémon...</p>;
    }
    
    return (
        <div>
            <h1>Détails du Pokémon {pokemonData.name}</h1>
            <p>Ici seront affichés les détails du Pokémon sélectionné.</p>
            <Link to="/">Retour à la liste des Pokémon</Link>
        </div>
    );
};

export default PokemonDetails;