import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Subscriptions from './pages/Subscriptions';
import PlatformLogs from './pages/PlatformLogs';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="logs" element={<PlatformLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
