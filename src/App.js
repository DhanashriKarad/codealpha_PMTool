import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext'; // Make sure this import is correct
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import AddMembers from './pages/AddMembers';

function App() {
  return (
    <SocketProvider> {/* This must wrap everything */}
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/project/:id" 
            element={
              <PrivateRoute>
                <Project />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/project/:id/members" 
            element={
              <PrivateRoute>
                <AddMembers />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;