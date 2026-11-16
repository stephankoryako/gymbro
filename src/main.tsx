import { createRoot } from 'react-dom/client';
import { App } from './App';
import { tg } from './tg';
import { initStore } from './store';
import { loadExercises } from './data/exercises';
import './styles.css';

tg.ready();

const root = createRoot(document.getElementById('root')!);
root.render(<div className="empty-state" style={{ paddingTop: '40vh' }}>Загрузка…</div>);

Promise.all([loadExercises(), initStore()])
  .then(() => root.render(<App />))
  .catch((e) => {
    console.error(e);
    root.render(<div className="empty-state">Ошибка загрузки: {String(e)}</div>);
  });
