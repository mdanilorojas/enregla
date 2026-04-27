import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { NetworkMapPlayground } from './features/network-playground/NetworkMapPlayground';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkMapPlayground />
    <Toaster position="top-right" />
  </StrictMode>,
);
