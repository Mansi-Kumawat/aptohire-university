import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './app/Providers';
import { ErrorBoundary } from './app/ErrorBoundary';
import { Router } from './app/router';
import './styles/tokens.css';
import './styles/globals.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource/jetbrains-mono/400.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Providers><ErrorBoundary><BrowserRouter><Router /></BrowserRouter></ErrorBoundary></Providers></React.StrictMode>
);
