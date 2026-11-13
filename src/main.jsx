import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'aos/dist/aos.css';
import 'swiper/css/bundle';
import './assets/css/all.min.css';
import './assets/css/magnific-popup.css';
import './assets/css/admin/tabler-icons.min.css';
import './index.css';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
