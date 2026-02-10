import { useState, useEffect } from "react";
import PokeCard from "../pokeCard";
import "./PokeList.css";
import { useNavigate } from "react-router-dom";

const PokeList = () => {
    const [pokemons, setPokemons] = useState([]);
    const [pokemonDetails, setPokemonDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [pokemonStats, setPokemonStats] = useState({});
    const [bestPokemonId, setBestPokemonId] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [availableTypes, setAvailableTypes] = useState([]);
    const [page, setPage] = useState(1);
    const limit = 20;
    const [totalCount, setTotalCount] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [pokemonNames, setPokemonNames] = useState({});
    const [availableLanguages, setAvailableLanguages] = useState(new Set(['en', 'fr', 'ja', 'zh-Hans'])); // start with known languages, will be updated as we fetch details
    const [searchQuery, setSearchQuery] = useState("");
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pokemonFavorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [sortBy, setSortBy] = useState('none');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [customPokemons, setCustomPokemons] = useState(() => {
        const saved = localStorage.getItem('customPokemons');
        return saved ? JSON.parse(saved) : [];
    });
    const [deletedPokemons, setDeletedPokemons] = useState(() => {
        const saved = localStorage.getItem('deletedPokemons');
        return saved ? JSON.parse(saved) : [];
    });
    const [modifiedPokemons, setModifiedPokemons] = useState(() => {
        const saved = localStorage.getItem('modifiedPokemons');
        return saved ? JSON.parse(saved) : {};
    });
    const [allPokemons, setAllPokemons] = useState([]);
    const [loadingAllDetails, setLoadingAllDetails] = useState(false);
    const navigate = useNavigate();

    const typeEmojis = {
        normal: '⚪',
        fire: '🔥',
        water: '💧',
        electric: '⚡',
        grass: '🌿',
        ice: '❄️',
        fighting: '👊',
        poison: '☠️',
        ground: '⛰️',
        flying: '🦅',
        psychic: '🧠',
        bug: '🐛',
        rock: '🪨',
        ghost: '👻',
        dragon: '🐉',
        dark: '🌑',
        steel: '⚙️',
        fairy: '✨'
    };

    const getLocalizedName = (pokemon) => {
        const pokeId = typeof pokemon === 'number' ? pokemon : (pokemon.id ? String(pokemon.id) : (pokemon.url ? pokemon.url.split('/').filter(x => x).pop() : ''));
        // If backend document with localized names
        if (pokemon && pokemon.name && typeof pokemon.name === 'object') {
            return pokemon.name[selectedLanguage] || pokemon.name.english || Object.values(pokemon.name)[0] || 'Pokémon';
        }
        if (pokemonNames[pokeId] && pokemonNames[pokeId][selectedLanguage]) {
            return pokemonNames[pokeId][selectedLanguage];
        }
        return pokemon.name || 'Pokémon';
    };

    const getPokeId = (pokemon) => {
        if (!pokemon) return '';
        if (pokemon.id) return String(pokemon.id);
        if (pokemon.url) return pokemon.url.split('/').filter(x => x).pop();
        return '';
    };

    const transformBackendToPokeAPI = (doc) => {
        if (!doc) return null;
        const stats = [];
        if (doc.base) {
            // map known base fields to stat names similar to PokeAPI
            if (typeof doc.base.HP === 'number') stats.push({ stat: { name: 'hp' }, base_stat: doc.base.HP });
            if (typeof doc.base.Attack === 'number') stats.push({ stat: { name: 'attack' }, base_stat: doc.base.Attack });
            if (typeof doc.base.Defense === 'number') stats.push({ stat: { name: 'defense' }, base_stat: doc.base.Defense });
            if (typeof doc.base.SpecialAttack === 'number') stats.push({ stat: { name: 'special-attack' }, base_stat: doc.base.SpecialAttack });
            if (typeof doc.base.SpecialDefense === 'number') stats.push({ stat: { name: 'special-defense' }, base_stat: doc.base.SpecialDefense });
            if (typeof doc.base.Speed === 'number') stats.push({ stat: { name: 'speed' }, base_stat: doc.base.Speed });
        }
        const types = (doc.type || []).map(t => ({ type: { name: t } }));
        return {
            id: doc.id,
            name: doc.name && (doc.name.english || doc.name.french || Object.values(doc.name)[0]) || doc.name,
            sprites: { other: { 'official-artwork': { front_default: doc.image } }, front_default: doc.image },
            types,
            stats,
            height: doc.height,
            weight: doc.weight
        };
    };

    // Sauvegarder les favoris dans localStorage
    useEffect(() => {
        localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem('customPokemons', JSON.stringify(customPokemons));
    }, [customPokemons]);

    useEffect(() => {
        localStorage.setItem('deletedPokemons', JSON.stringify(deletedPokemons));
    }, [deletedPokemons]);

    useEffect(() => {
        localStorage.setItem('modifiedPokemons', JSON.stringify(modifiedPokemons));
    }, [modifiedPokemons]);

    useEffect(() => {
        setLoading(true);
        // Fetch paginated pokemons from backend
        fetch(`http://localhost:3000/pokemons?page=${page}&limit=${limit}`)
            .then((response) => response.json())
            .then((data) => {
                // backend returns { results, totalCount, page, totalPages }
                const results = data.results || data;
                setPokemons(results);
                if (typeof data.totalCount === 'number') setTotalCount(data.totalCount);

                const statsMap = {};
                const detailsMap = {};
                const typesSet = new Set();
                let maxStats = 0;
                let maxId = null;

                results.forEach(doc => {
                    const id = String(doc.id);
                    const totalStats = doc.base ? Object.values(doc.base).reduce((s, v) => s + (v || 0), 0) : 0;
                    const types = doc.type || [];
                    const stats = doc.base ? [
                        ...(typeof doc.base.HP === 'number' ? [{ stat: { name: 'hp' }, base_stat: doc.base.HP }] : []),
                        ...(typeof doc.base.Attack === 'number' ? [{ stat: { name: 'attack' }, base_stat: doc.base.Attack }] : []),
                        ...(typeof doc.base.Defense === 'number' ? [{ stat: { name: 'defense' }, base_stat: doc.base.Defense }] : []),
                        ...(typeof doc.base.SpecialAttack === 'number' ? [{ stat: { name: 'special-attack' }, base_stat: doc.base.SpecialAttack }] : []),
                        ...(typeof doc.base.SpecialDefense === 'number' ? [{ stat: { name: 'special-defense' }, base_stat: doc.base.SpecialDefense }] : []),
                        ...(typeof doc.base.Speed === 'number' ? [{ stat: { name: 'speed' }, base_stat: doc.base.Speed }] : []),
                    ] : [];

                    statsMap[id] = totalStats;
                    detailsMap[id] = { totalStats, types, stats };
                    types.forEach(t => typesSet.add(t));

                    if (totalStats > maxStats) { maxStats = totalStats; maxId = parseInt(id, 10); }
                });

                setPokemonStats(statsMap);
                setPokemonDetails(detailsMap);
                setBestPokemonId(maxId);
                setAvailableTypes(Array.from(typesSet).sort());
                setLoading(false);
            })
            .catch((error) => {
                console.error("Erreur:", error);
                setLoading(false);
            });
    }, [page]);

    // --- Fetch full list and then fetch details in background (batched) ---
    useEffect(() => {
        let cancelled = false;
        // first fetch the full list (names + urls)
        fetch(`https://pokeapi.co/api/v2/pokemon?limit=200000&offset=0`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                if (data && Array.isArray(data.results)) {
                    setAllPokemons(data.results);
                    if (typeof data.count === 'number') setTotalCount(data.count);

                    // fetch details in batches to populate types, stats and localized names
                    const urls = data.results.map(p => p.url);
                    const batchSize = 50;
                    setLoadingAllDetails(true);

                    const fetchBatch = async (start) => {
                        const slice = urls.slice(start, start + batchSize);
                        if (slice.length === 0) return;
                        try {
                            const promises = slice.map(url => fetch(url).then(r => r.json()).catch(() => null));
                            const results = await Promise.all(promises);
                            // update maps
                            setPokemonStats(prev => {
                                const next = { ...prev };
                                results.forEach(pokeData => {
                                    if (!pokeData) return;
                                    const total = pokeData.stats ? pokeData.stats.reduce((s, st) => s + st.base_stat, 0) : 0;
                                    next[pokeData.id] = total;
                                });
                                return next;
                            });
                            setPokemonDetails(prev => {
                                const next = { ...prev };
                                results.forEach(pokeData => {
                                    if (!pokeData) return;
                                    next[pokeData.id] = {
                                        totalStats: pokeData.stats ? pokeData.stats.reduce((s, st) => s + st.base_stat, 0) : 0,
                                        types: pokeData.types ? pokeData.types.map(t => t.type.name) : [],
                                        stats: pokeData.stats || []
                                    };
                                });
                                return next;
                            });

                            // fetch species names for localization (in parallel for this batch)
                            const speciesPromises = results.map(pokeData => {
                                if (!pokeData) return Promise.resolve(null);
                                return fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeData.id}/`).then(r => r.json()).catch(() => null);
                            });
                            const speciesResults = await Promise.all(speciesPromises);
                            setPokemonNames(prev => {
                                const next = { ...prev };
                                speciesResults.forEach(speciesData => {
                                    if (!speciesData) return;
                                    const namesMap = {};
                                    speciesData.names.forEach(n => { namesMap[n.language.name] = n.name; });
                                    next[speciesData.id] = namesMap;
                                });
                                return next;
                            });

                            // update available types progressively
                            setAvailableTypes(prev => {
                                const set = new Set(prev);
                                results.forEach(pokeData => {
                                    if (!pokeData) return;
                                    pokeData.types.forEach(t => set.add(t.type.name));
                                });
                                return Array.from(set).sort();
                            });
                        } catch (e) {
                            console.error('Batch fetch error', e);
                        }

                        // next batch
                        if (start + batchSize < urls.length && !cancelled) {
                            // small delay to be polite
                            setTimeout(() => fetchBatch(start + batchSize), 200);
                        } else {
                            setLoadingAllDetails(false);
                        }
                    };

                    // start batches
                    fetchBatch(0);
                }
            })
            .catch(err => {
                if (!cancelled) console.error('Erreur fetching all pokemons', err);
            });

        return () => { cancelled = true; };
    }, []);

    const toggleFavorite = (pokeId) => {
        setFavorites(prev => 
            prev.includes(pokeId) 
                ? prev.filter(id => id !== pokeId)
                : [...prev, pokeId]
        );
    };

    const triggerConfetti = () => {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1000);
    };

    const openDetails = (pokemon) => {
        setSelectedPokemon(pokemon);
        setShowDetails(true);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">
                    <div className="loading-text">Chargement des pokémons...</div>
                    <div className="pokeball-loader"></div>
                </div>
            </div>
        )
    }

    // Apply filters on the full list when available, otherwise on the current page list
    const baseList = allPokemons.length ? allPokemons : pokemons;
    let filteredPokemons = baseList.filter(pokemon => {
        const pokeId = pokemon.url.split('/').filter(x => x).pop();
        const details = pokemonDetails[pokeId];
        const localizedName = (pokemonNames[pokeId] && pokemonNames[pokeId][selectedLanguage])
            ? pokemonNames[pokeId][selectedLanguage]
            : (pokemon.name || '');

        const matchesType = !selectedType || (details && details.types.includes(selectedType));

        // Search should match regardless of currently selected language:
        const q = searchQuery.trim().toLowerCase();
        let matchesSearch = true;
        if (q) {
            matchesSearch = false;
            // match by numeric id
            if (pokeId === q) matchesSearch = true;
            // match by API name
            if (!matchesSearch && (pokemon.name || '').toLowerCase().includes(q)) matchesSearch = true;
            // match any localized name available for this pokemon
            if (!matchesSearch && pokemonNames[pokeId]) {
                matchesSearch = Object.values(pokemonNames[pokeId]).some(nameVal => nameVal && nameVal.toLowerCase().includes(q));
            }
            // fallback: match localizedName for current language
            if (!matchesSearch && localizedName && localizedName.toLowerCase().includes(q)) matchesSearch = true;
        }

        const isFavorite = favorites.includes(parseInt(pokeId));
        const matchesFavorites = !showFavoritesOnly || isFavorite;

        return matchesType && matchesSearch && matchesFavorites;
    });

    // Tri
    if (sortBy === 'stats-asc') {
        filteredPokemons = [...filteredPokemons].sort((a, b) => {
            const idA = a.url.split('/').filter(x => x).pop();
            const idB = b.url.split('/').filter(x => x).pop();
            return pokemonStats[idA] - pokemonStats[idB];
        });
    } else if (sortBy === 'stats-desc') {
        filteredPokemons = [...filteredPokemons].sort((a, b) => {
            const idA = a.url.split('/').filter(x => x).pop();
            const idB = b.url.split('/').filter(x => x).pop();
            return pokemonStats[idB] - pokemonStats[idA];
        });
    } else if (sortBy === 'name') {
        filteredPokemons = [...filteredPokemons].sort((a, b) => getLocalizedName(a).localeCompare(getLocalizedName(b)));
    }

    // Pagination on the filtered list
    const startIndex = (page - 1) * limit;
    const paginatedPokemons = filteredPokemons.slice(startIndex, startIndex + limit);

    return (
        <div className={`pokelist-container ${confetti ? 'confetti-active' : ''}`}>
            {confetti && (
                <div className="confetti">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="confetti-piece"></div>
                    ))}
                </div>
            )}

            <div className="header-section">
                <h1 className="main-title">🔴 POKÉDEX ULTIMATE 🔴</h1>
            </div>

            <div className="controls-section">
                <div className="search-container">
                    <input 
                        type="text"
                        placeholder="🔍 Recherche un pokémon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="action-buttons">
                        <button 
                            className={`action-btn favorites-btn ${showFavoritesOnly ? 'active' : ''}`}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        >
                            ❤️ Favoris ({favorites.length})
                        </button>
                        <button className="action-btn add-btn" onClick={() => setShowAddModal(true)}>➕ Ajouter</button>
                        <select 
                            className="language-select"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                        >
                            {Array.from(availableLanguages).includes('en') && <option value="en">English</option>}
                            {Array.from(availableLanguages).includes('fr') && <option value="fr">Français</option>}
                            {Array.from(availableLanguages).includes('ja') && <option value="ja">日本語</option>}
                            {Array.from(availableLanguages).includes('zh-Hans') && <option value="zh-Hans">中文 (简体)</option>}
                        </select>
                        <select 
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="none">Tri par défaut</option>
                            <option value="stats-asc">Stats ⬆️</option>
                            <option value="stats-desc">Stats ⬇️</option>
                            <option value="name">Nom (A-Z)</option>
                        </select>
                    </div>
                    <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                        <button className="action-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀ Précédent</button>
                        <div>Page <strong>{page}</strong>{totalCount ? ` / ${Math.ceil(totalCount / limit)}` : ''}</div>
                        <button className="action-btn" onClick={() => setPage(p => p + 1)} disabled={totalCount ? page >= Math.ceil(totalCount / limit) : false}>Suivant ▶</button>
                    </div>
            </div>

            <div className="filter-section">
                <div className="filters-label">Filtrer par type:</div>
                <div className="filters-container">
                    <button 
                        className={`filter-btn ${selectedType === null ? 'active' : ''}`}
                        onClick={() => setSelectedType(null)}
                    >
                        Tous
                    </button>
                    {availableTypes.map((type) => (
                        <button 
                            key={type}
                            className={`filter-btn type-${type} ${selectedType === type ? 'active' : ''}`}
                            onClick={() => setSelectedType(type)}
                        >
                            <span className="type-emoji">{typeEmojis[type] || '🔹'}</span>
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            
                    <div className="results-info">
                        Affichage: <strong>{paginatedPokemons.length}</strong> pokémon{filteredPokemons.length !== 1 ? 's' : ''} {selectedType && `de type ${selectedType}`} {showFavoritesOnly && '(favoris uniquement)'}
                    </div>

            <div className="pokemon-grid">
                {/** Custom pokemons first */}
                                {customPokemons.filter(p => !deletedPokemons.includes(p.id)).map((custom, idx) => (
                    <div key={`custom-${custom.id}`} className="pokemon-card-wrapper" style={{ '--card-index': idx }}>
                        <div className={`favorite-badge ${favorites.includes(custom.id) ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(custom.id); }}>
                            {favorites.includes(custom.id) ? '❤️' : '🤍'}
                        </div>
                        <PokeCard pokemon={{}} pokeData={custom} displayName={custom.name} />
                    </div>
                ))}

                {paginatedPokemons.filter(p => {
                    const pokeId = p.url.split('/').filter(x => x).pop();
                    return !deletedPokemons.includes(parseInt(pokeId));
                }).map((pokemon, index) => {
                    const pokeId = pokemon.url.split('/').filter(x => x).pop();
                    const isBest = parseInt(pokeId) === bestPokemonId;
                    const isFav = favorites.includes(parseInt(pokeId));
                    const modified = modifiedPokemons[pokeId];
                    const displayName = getLocalizedName(pokemon);
                    
                    return (
                        <div 
                            key={index} 
                            className="pokemon-card-wrapper"
                            style={{ '--card-index': index }}
                            onClick={() => openDetails(pokemon)}
                        >
                            <div 
                                className={`favorite-badge ${isFav ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(parseInt(pokeId));
                                }}
                            >
                                {isFav ? '❤️' : '🤍'}
                            </div>
                            <PokeCard 
                                pokemon={pokemon}
                                isBestPokemon={isBest}
                                pokeData={modified}
                                displayName={displayName}
                                onBestPokemonClick={() => {
                                    if (isBest) triggerConfetti();
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {showDetails && selectedPokemon && (
                <DetailModal 
                    pokemon={selectedPokemon}
                    details={pokemonDetails}
                    onClose={() => setShowDetails(false)}
                    isFavorite={favorites.includes(parseInt(selectedPokemon.url.split('/').filter(x => x).pop()))}
                    onToggleFavorite={(pokeId) => toggleFavorite(pokeId)}
                />
            )}

            {showAddModal && (
                <AddModal 
                    onClose={() => setShowAddModal(false)}
                    onSave={(newPokemon) => {
                        const id = Date.now();
                        const pk = { ...newPokemon, id };
                        setCustomPokemons(prev => [pk, ...prev]);
                        setShowAddModal(false);
                        navigate(`/pokemon/${id}`, { state: { pokeData: pk } });
                    }}
                />
            )}
        </div>
    );
};

const DetailModal = ({ pokemon, details, onClose, isFavorite, onToggleFavorite }) => {
    const [pokemonData, setPokemonData] = useState(null);

    useEffect(() => {
        fetch(pokemon.url)
            .then(res => res.json())
            .then(data => setPokemonData(data));
    }, [pokemon]);

    if (!pokemonData) return null;

    const pokeId = pokemon.url.split('/').filter(x => x).pop();
    const abilities = pokemonData.abilities || [];
    const moves = pokemonData.moves?.slice(0, 4) || [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <div className="modal-image-container">
                        <img 
                            src={pokemonData.sprites?.other["official-artwork"]?.front_default || pokemonData.sprites?.front_default}
                            alt={pokemonData.name}
                            className="modal-image"
                        />
                    </div>
                    <div className="modal-info">
                        <h2>{pokemonData.name}</h2>
                        <p className="modal-id">#{pokeId?.toString().padStart(3, '0')}</p>
                        <button 
                            className={`modal-favorite ${isFavorite ? 'active' : ''}`}
                            onClick={() => onToggleFavorite(parseInt(pokeId))}
                        >
                            {isFavorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3>Stats Complètes</h3>
                        <div className="full-stats">
                            {pokemonData.stats.map((stat, idx) => (
                                <div key={idx} className="full-stat-row">
                                    <span className="stat-label">{stat.stat.name}</span>
                                    <div className="full-stat-bar">
                                        <div 
                                            className="full-stat-fill"
                                            style={{ width: `${Math.min((stat.base_stat / 150) * 100, 100)}%` }}
                                        >
                                            {stat.base_stat}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {abilities.length > 0 && (
                        <div className="modal-section">
                            <h3>Capacités</h3>
                            <div className="abilities-list">
                                {abilities.map((ability, idx) => (
                                    <span key={idx} className="ability-tag">
                                        {ability.ability.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {moves.length > 0 && (
                        <div className="modal-section">
                            <h3>Attaques</h3>
                            <div className="moves-list">
                                {moves.map((move, idx) => (
                                    <span key={idx} className="move-tag">
                                        {move.move.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PokeList;

const AddModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [sprite, setSprite] = useState('');
    const [type1, setType1] = useState('');

    const handleSave = () => {
        if (!name) return;
        const data = {
            name,
            height: height ? parseFloat(height) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
            sprites: { other: { "official-artwork": { front_default: sprite } }, front_default: sprite },
            types: type1 ? [{ type: { name: type1 } }] : [],
            stats: []
        };
        onSave(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h3>Ajouter un nouveau Pokémon</h3>
                <div className="form-row">
                    <label>Nom</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Height (m)</label>
                    <input value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Weight (kg)</label>
                    <input value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Sprite URL</label>
                    <input value={sprite} onChange={(e) => setSprite(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Type principal</label>
                    <input value={type1} onChange={(e) => setType1(e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button onClick={handleSave} className="action-btn">Enregistrer</button>
                    <button onClick={onClose} className="action-btn">Annuler</button>
                </div>
            </div>
        </div>
    );
};
