import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PokeCard.css";

const PokeCard = ({ pokemon, isBestPokemon = false, pokeData = null, disableNavigation = false, displayName = null }) => {
    const [pokeState, setPokeState] = useState(pokeData || {});
    const [soundPlaying, setSoundPlaying] = useState(false);
    const [totalStats, setTotalStats] = useState(() => {
        if (pokeData && pokeData.stats) return pokeData.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
        return 0;
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (pokeData) {
            setPokeState(pokeData);
            const stats = pokeData.stats ? pokeData.stats.reduce((sum, stat) => sum + stat.base_stat, 0) : 0;
            setTotalStats(stats);
            console.log("Détails du Pokémon (fournis):", pokeData);
            return;
        }
        if (!pokemon?.url) return;
        fetch(pokemon.url)
            .then((response) => response.json())
            .then((data) => {
                setPokeState(data);
                const stats = data.stats ? data.stats.reduce((sum, stat) => sum + stat.base_stat, 0) : 0;
                setTotalStats(stats);
                console.log("Détails du Pokémon reçus:", data);
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération des détails du Pokémon:", error);
            });
    }, [pokemon, pokeData]);

    const pokemonImage = pokeState.sprites?.other["official-artwork"]?.front_default || pokeState.sprites?.front_default;
    const pokemonSound = pokeState.cries?.latest || pokeState.cries?.legacy;
    const pokeId = pokeState.id;

    const playSound = () => {
        if (pokemonSound) {
            setSoundPlaying(true);
            const audio = new Audio(pokemonSound);
            audio.onended = () => setSoundPlaying(false);
            audio.play().catch(() => setSoundPlaying(false));
        }
    };

    const renderStatBar = (stat) => {
        const maxValue = 150;
        const percentage = (stat.base_stat / maxValue) * 100;
        return (
            <div key={stat.stat.name} className="stat-bar-container">
                <span className="stat-name">{stat.stat.name.replace('-', ' ')}</span>
                <div className="stat-bar">
                    <div 
                        className="stat-fill" 
                        style={{ 
                            width: `${Math.min(percentage, 100)}%`,
                            background: getStatColor(percentage)
                        }}
                    >
                        <span className="stat-value">{stat.base_stat}</span>
                    </div>
                </div>
            </div>
        );
    };

    const getStatColor = (percentage) => {
        if (percentage < 33) return 'linear-gradient(90deg, #ff6b6b, #ff8e8e)';
        if (percentage < 66) return 'linear-gradient(90deg, #ffd93d, #ffed4e)';
        return 'linear-gradient(90deg, #6bcf7f, #7ee8a8)';
    };

    const handleNavigate = () => {
        if (disableNavigation) return;
        if (pokeId) {
            navigate(`/pokemon/${pokeId}`, { state: { pokeData: pokeState } });
        } else if (pokemon?.url) {
            navigate(`/pokemon?url=${encodeURIComponent(pokemon.url)}`);
        }
    }; 

    return (
        <div 
            className={`pokemon-card ${isBestPokemon ? 'best-pokemon' : ''}`}
            onClick={handleNavigate}
            role={disableNavigation ? undefined : "button"}
            tabIndex={disableNavigation ? -1 : 0}
            onKeyDown={(e) => { if (!disableNavigation && e.key === 'Enter') handleNavigate(); }}
            style={{ cursor: disableNavigation ? 'default' : 'pointer' }}
        >
            {isBestPokemon && (
                <>
                    <div className="sparkles"></div>
                    <div className="trophy">👑</div>
                </>
            )} 
            
            <div className="pokemon-image-container">
                {pokemonImage ? (
                    <img src={pokemonImage} alt={pokeState.name} className="pokemon-image" />
                ) : (
                    <div className="pokemon-image-placeholder">Image en cours...</div>
                )}
            </div>

            <div className="pokemon-info">
                <div className="pokemon-header">
                    <h3 className="pokemon-name">{displayName || pokeState.name}</h3>
                    <p className="pokemon-id">#{pokeId?.toString().padStart(3, '0')}</p>
                </div>

                {pokeState.types && (
                    <div className="pokemon-types">
                        {pokeState.types.map((type, index) => (
                            <span key={index} className={`type type-${type.type.name}`}>
                                {type.type.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="pokemon-dimensions">
                    <div className="dimension">
                        <span className="label">📏</span>
                        <span className="value">{pokeState.height ? (pokeState.height * 0.1).toFixed(1) : 'N/A'} m</span>
                    </div>
                    <div className="dimension">
                        <span className="label">⚖️</span>
                        <span className="value">{pokeState.weight ? (pokeState.weight * 0.1).toFixed(1) : 'N/A'} kg</span>
                    </div>
                </div>

                {pokeState.stats && pokeState.stats.length > 0 && (
                    <div className="pokemon-stats-detailed">
                        <div className="stats-title">Stats</div>
                        {pokeState.stats.slice(0, 6).map(stat => renderStatBar(stat))}
                        <div className="total-stats">
                            <strong>Total: {totalStats}</strong>
                        </div>
                    </div>
                )}

                <button 
                    className={`sound-button ${soundPlaying ? 'playing' : ''}`}
                    onClick={(e) => { e.stopPropagation(); playSound(); }}
                    disabled={!pokemonSound || soundPlaying}
                >
                    {soundPlaying ? '🔊 Écoute...' : '🔉 Cri du Pokémon'}
                </button>
            </div>
        </div>
    );
}

export default PokeCard;