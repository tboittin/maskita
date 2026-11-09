/**
 * MSK-004 — Point d'entrée de la page ner.html (détection avancée).
 * Même application que index.html, avec la détection avancée proposée.
 */
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../layer-order.css';
import '@khaleeno/maskita-design-system/style.css';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<App detectionAvancee />);
