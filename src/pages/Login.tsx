import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsDemo } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Demo Login Bypass
    if (email.toLowerCase() === 'test' && password === '123456') {
        loginAsDemo();
        navigate(from, { replace: true });
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">AI</div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AutoInserat Pro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Melden Sie sich an, um fortzufahren.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <Input
                label="Email Adresse / Benutzername"
                id="email-address"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Passwort"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full justify-center py-3"
              isLoading={loading}
            >
              Anmelden
            </Button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-gray-600">Noch keinen Account? </span>
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Jetzt registrieren
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
