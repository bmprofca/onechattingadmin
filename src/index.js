import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

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

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
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
