import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SharedView from './pages/SharedView';
import SharedManager from './pages/SharedManager';
import Settings from './pages/Settings';
import P2PTransfer from './pages/P2PTransfer';
import Starred from './pages/Starred';
import Recent from './pages/Recent';
import Trash from './pages/Trash';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/share/:token" element={<SharedView />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="shared" element={<SharedManager />} />
              <Route path="transfer" element={<P2PTransfer />} />
              <Route path="settings" element={<Settings />} />
              <Route path="starred" element={<Starred />} />
              <Route path="recent" element={<Recent />} />
              <Route path="trash" element={<Trash />} />
              {/* Add other dashboard routes here */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
