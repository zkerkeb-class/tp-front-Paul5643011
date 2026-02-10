import './App.css'
import { Routes, Route } from 'react-router-dom';
import Pokelist from './components/pokelist'
import PokemonDetail from './pages/PokemonDetail'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Pokelist />} />
      <Route path="/pokemon" element={<PokemonDetail />} />
      <Route path="/pokemon/:id" element={<PokemonDetail />} />
    </Routes>
  )

}

export default App
