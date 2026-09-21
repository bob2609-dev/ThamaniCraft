import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Procurement from './pages/Procurement';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import usePermissions from './hooks/usePermissions';

function App() {
  const { isAuthenticated } = usePermissions();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected Routes */}
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="production" element={<Production />} />
        <Route path="sales" element={<Sales />} />
        <Route path="procurement" element={<Procurement />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
