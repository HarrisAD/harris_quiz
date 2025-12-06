import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home';
import { AdminHome } from './components/admin/AdminHome';
import { AdminGame } from './components/admin/AdminGame';
import { QuizCreator } from './components/admin/QuizCreator';
import { JoinGame } from './components/player/JoinGame';
import { PlayerGame } from './components/player/PlayerGame';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/create" element={<QuizCreator />} />
        <Route path="/admin/:sessionCode" element={<AdminGame />} />
        <Route path="/play" element={<JoinGame />} />
        <Route path="/play/:sessionCode" element={<PlayerGame />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
