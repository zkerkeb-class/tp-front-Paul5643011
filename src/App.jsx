import { useEffect } from 'react';
import './App.css'
import Pokelist from './components/pokelist'
import { Link, useNavigate } from 'react-router'

function App() {
  const navigate = useNavigate();
  console.log(navigate);

  useEffect(() => {
    console.log("App component mounted");

    // setTimeout(() =>
      // redirectToDetails()
      // , 5000);

  }, []);

  const redirectToDetails = () => {
    navigate('/pokemonDetails');
  }

  return (
    <div>

      <Link to="/pokemonDetails">Voir les détails du Pokémon</Link>
      <Pokelist></Pokelist>
    </div>
  )

}

export default App
