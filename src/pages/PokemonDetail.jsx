import { useEffect, useState } from "react";
import { useSearchParams, Link, useParams, useLocation } from "react-router-dom";
import PokeCard from "../components/pokeCard";
import { useNavigate } from "react-router-dom";

const PokemonDetail = () => {
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const location = useLocation();
    const initialData = location.state?.pokeData;
    const url = searchParams.get('url');
    const fetchUrl = id ? `https://pokeapi.co/api/v2/pokemon/${id}` : url;
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [edited, setEdited] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (initialData) return; // déjà fourni via navigate state, pas de fetch
        if (!fetchUrl) return;
        setLoading(true);
        fetch(fetchUrl)
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch((err) => console.error("Erreur fetch détail Pokémon:", err))
        .finally(() => setLoading(false));
    }, [id, url, initialData]);

    useEffect(() => {
        // if there is a modified version in localStorage, use it
        if (!id) return;
        const modified = localStorage.getItem('modifiedPokemons');
        if (modified) {
            const map = JSON.parse(modified);
            if (map[id]) setData(map[id]);
        }
    }, [id]);

    if (!id && !url) return (
        <div style={{ padding: 20 }}>
        <Link to="/">← Retour</Link>
        <p>Aucun Pokémon sélectionné.</p>
        </div>
    );

    if (loading || !data) return (
        <div style={{ padding: 20 }}>
        <Link to="/">← Retour</Link>
        <div style={{ marginTop: 10 }}>Chargement...</div>
        </div>
    );

    return (
        <div style={{ padding: 20 }}>
            <Link to="/">← Retour</Link>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <div style={{ flex: '0 0 360px' }}>
                    <PokeCard pokemon={{ url: fetchUrl }} pokeData={data} disableNavigation={true} />
                </div>
                <div style={{ flex: 1 }}>
                    {!isEditing ? (
                        <div>
                            <h2>{data.name}</h2>
                            <p>Height: {data.height ? data.height : 'N/A'}</p>
                            <p>Weight: {data.weight ? data.weight : 'N/A'}</p>
                            <div style={{ marginTop: 8 }}>
                                <button onClick={() => { setIsEditing(true); setEdited({ name: data.name, height: data.height, weight: data.weight, sprites: data.sprites }); }}>✏️ Modifier</button>
                                <button style={{ marginLeft: 8 }} onClick={() => setShowConfirmDelete(true)}>🗑️ Supprimer</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3>Modifier le Pokémon</h3>
                            <div>
                                <label>Nom</label>
                                <input value={edited.name} onChange={(e) => setEdited(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                                <label>Height</label>
                                <input value={edited.height || ''} onChange={(e) => setEdited(prev => ({ ...prev, height: e.target.value }))} />
                            </div>
                            <div>
                                <label>Weight</label>
                                <input value={edited.weight || ''} onChange={(e) => setEdited(prev => ({ ...prev, weight: e.target.value }))} />
                            </div>
                            <div>
                                <label>Sprite URL</label>
                                <input value={edited.sprites?.other?.['official-artwork']?.front_default || edited.sprites?.front_default || ''} onChange={(e) => setEdited(prev => ({ ...prev, sprites: { other: { 'official-artwork': { front_default: e.target.value } }, front_default: e.target.value } }))} />
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <button onClick={() => {
                                    // save to localStorage modifiedPokemons
                                    const raw = localStorage.getItem('modifiedPokemons');
                                    const map = raw ? JSON.parse(raw) : {};
                                    map[id] = { ...data, ...edited };
                                    localStorage.setItem('modifiedPokemons', JSON.stringify(map));
                                    setData(map[id]);
                                    setIsEditing(false);
                                }}>💾 Enregistrer</button>
                                <button style={{ marginLeft: 8 }} onClick={() => { setIsEditing(false); setEdited(null); }}>Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showConfirmDelete && (
                <div className="modal-overlay" onClick={() => setShowConfirmDelete(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirmer la suppression</h3>
                        <p>Voulez-vous vraiment supprimer ce Pokémon ? Cette action est locale.</p>
                        <div style={{ marginTop: 12 }}>
                            <button onClick={() => {
                                // add to deleted list
                                const raw = localStorage.getItem('deletedPokemons');
                                const arr = raw ? JSON.parse(raw) : [];
                                if (!arr.includes(parseInt(id))) arr.push(parseInt(id));
                                localStorage.setItem('deletedPokemons', JSON.stringify(arr));
                                navigate('/');
                            }}>Supprimer</button>
                            <button style={{ marginLeft: 8 }} onClick={() => setShowConfirmDelete(false)}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PokemonDetail;
