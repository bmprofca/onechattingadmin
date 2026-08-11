import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
<<<<<<< HEAD
import App from './App';
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import store from './store';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const GOOGLE_CLIENT_ID = "124604231994-dtnflivbu049428d1cg9ngfuhgq38efs.apps.googleusercontent.com";
=======

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import SubscriptionPacks from './pages/SubscriptionPacks';
import CustomPricing from './pages/CustomPricing';
import AllSubscriptions from './pages/AllSubscriptions';
import UserTransactionHistory from './component/Modals/UserTransactionHistory';
>>>>>>> 962a69ede8c64156e6e1174651a3c12c0e6cf412

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
<<<<<<< HEAD
  <Provider store={store}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </Provider>
);
=======
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/users/:username" element={<UserDetails />} />
      <Route path="/users/:username/transactions" element={<UserTransactionHistory />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:project_id" element={<ProjectDetails />} />
      <Route path="/subscriptions" element={<AllSubscriptions />} />
      <Route path="/subscription-packs" element={<SubscriptionPacks />} />
      <Route path="/custom-pricing" element={<CustomPricing />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);
>>>>>>> 962a69ede8c64156e6e1174651a3c12c0e6cf412
