import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGate } from './components/AuthGate';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Paywall } from './pages/Paywall';
import { Pricing } from './pages/Pricing';
import { MainApp } from './components/MainApp';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route
            path="/"
            element={
              <AuthGate>
                <MainApp />
              </AuthGate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
