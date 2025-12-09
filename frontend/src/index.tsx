import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import App from './App';
import { initializeAIBridges } from './agents/services';

// 初始化 AI Bridges
initializeAIBridges();

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
