import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./registerServiceWorker";

// Proteção adicional contra inspeção de código
if (import.meta.env.PROD) {
  // Desabilitar console em produção
  console.log = function() {};
  console.warn = function() {};
  console.error = function() {};
  console.info = function() {};
  console.debug = function() {};
  
  // Limpar objetos globais que podem expor informações
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  
  // Detectar se DevTools está aberto
  const detectDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      window.location.reload();
    }
  };
  
  setInterval(detectDevTools, 1000);
}

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD) {
  registerServiceWorker();
}
