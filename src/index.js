import ReactDOM from 'react-dom/client';
import './index.css';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import SubscriptionPacks from './pages/SubscriptionPacks';
import CustomPricing from './pages/CustomPricing';
import AllSubscriptions from './pages/AllSubscriptions';
import UserTransactionHistory from "./component/Modals/UserTransactionHistory";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import store from './store';
const GOOGLE_CLIENT_ID = "124604231994-dtnflivbu049428d1cg9ngfuhgq38efs.apps.googleusercontent.com";



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/:username" element={<UserDetails />} />
          <Route path="/admin/users/:username/transactions" element={<UserTransactionHistory />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/projects/:project_id" element={<ProjectDetails />} />
          <Route path="/admin/subscriptions" element={<AllSubscriptions />} />
          <Route path="/admin/subscription-packs" element={<SubscriptionPacks />} />
          <Route path="/admin/custom-pricing" element={<CustomPricing />} />
          {/* Fallback to dashboard for any unknown route */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </Provider>
);