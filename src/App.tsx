import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Nav } from './components/common';
import { RestTimer } from './components/RestTimer';
import { Home } from './pages/Home';
import { WorkoutPage } from './pages/Workout';
import { Catalog, ExerciseDetail } from './pages/Catalog';
import { ProgramDetail, ProgramEditor, Programs } from './pages/Programs';
import { ExerciseProgress, Stats } from './pages/Stats';
import { History, WorkoutView } from './pages/History';
import { Settings } from './pages/Settings';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/exercise/:id" element={<ExerciseDetail />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/program/:id" element={<ProgramDetail />} />
          <Route path="/program-edit/:id" element={<ProgramEditor />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/stats/exercise/:id" element={<ExerciseProgress />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<WorkoutView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <RestTimer />
      <Nav />
    </HashRouter>
  );
}
