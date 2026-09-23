import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import RecipeEditor from './pages/RecipeEditor';
import Assets from './pages/Assets';
import Production from './pages/Production';
import WorkOrder from './pages/WorkOrder';
import Sales from './pages/Sales';
import OrderEntry from './pages/OrderEntry';
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
        <Route path="recipes/new" element={<RecipeEditor key="new" />} />
        <Route path="recipes/:id/edit" element={<RecipeEditor />} />
        <Route path="production" element={<Production />} />
        <Route path="production/new" element={<WorkOrder key="new" />} />
        <Route path="production/:id" element={<WorkOrder />} />
        <Route path="assets" element={<Assets />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<OrderEntry key="new" />} />
        <Route path="sales/:id" element={<OrderEntry />} />
        <Route path="procurement" element={<Procurement />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
