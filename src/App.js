import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import SubscriptionPacks from './pages/SubscriptionPacks';
import CustomPricing from './pages/CustomPricing';
import AllSubscriptions from './pages/AllSubscriptions';
import UserTransactionHistory from './component/Modals/UserTransactionHistory';
import AiProviders from './pages/AiProviders';
import MainLayout from './component/layout/MainLayout';
import ProtectedRoute from './component/ProtectedRoute';
import AiModelPricing from './pages/AiModelPricing';
import QrCodes from './pages/QrCodes';
import TechProvider from './pages/TechProvider';

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path='/' element={<Dashboard />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/users' element={<Users />} />
          <Route path='/users/:username' element={<UserDetails />} />
          <Route path='/users/:username/transactions' element={<UserTransactionHistory />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/projects/:project_id' element={<ProjectDetails />} />
          <Route path='/qr-codes' element={<QrCodes />} />
          <Route path='/tech-provider' element={<TechProvider />} />
          <Route path='/subscriptions' element={<AllSubscriptions />} />
          <Route path='/subscription-packs' element={<SubscriptionPacks />} />
          <Route path='/custom-pricing' element={<CustomPricing />} />
          <Route path='/ai-providers' element={<AiProviders />} />
          <Route path='/ai-pricing' element={<AiModelPricing />} />
          <Route path='*' element={<Dashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
