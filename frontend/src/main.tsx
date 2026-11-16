import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('elemen #root tidak ditemukan di index.html');
}

// Router dipasang di sini (bukan di App) supaya uji bisa memakai MemoryRouter.
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
