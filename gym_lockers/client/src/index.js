import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Configure axios to use relative URLs for better compatibility
// This will use the same origin as the frontend (works in both dev and production)
axios.defaults.baseURL = window.location.origin;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 