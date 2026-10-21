import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/bodoni-moda';
import '@fontsource-variable/bodoni-moda/wght-italic.css';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/app.css';
import App from './App.jsx';
import gsap from 'gsap';

// Si la pestaña estuvo en segundo plano, las animaciones saltan a su estado final
// en vez de quedar congeladas a mitad (el contenido nunca debe quedar oculto).
gsap.ticker.lagSmoothing(0);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
