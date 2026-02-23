import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const plan = searchParams.get('plan');
  // In a real app, you might verify a session_id from Stripe here
  const hasPreselectedPlan = !!plan;

  useEffect(() => {
    if (plan) {
      // Optional: You could fetch plan details here to display "You selected Pro Plan"
    }
  }, [plan]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
            // Store the selected plan in metadata so the backend trigger can use it
            // (Note: The SQL trigger needs to be updated to read this if we want auto-activation without webhook)
            selected_plan: plan 
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // If successful, we redirect to login or dashboard
      // Since we want "Immediate Access", we rely on the session being created.
      // Supabase auto-signs in on signup if email confirmation is disabled, 
      // or requires confirmation if enabled.
      // Assuming email confirmation is OFF for this demo or we handle the "Check email" state.
      
      // For this demo, we assume auto-login.
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">AI</div>
          
          {hasPreselectedPlan ? (
             <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                <h3 className="text-green-800 font-semibold">Zahlung erfolgreich!</h3>
                <p className="text-green-700 text-sm mt-1">
                    Bitte erstellen Sie jetzt Ihren Account, um den <strong>{plan?.toUpperCase()}</strong> Plan zu aktivieren.
                </p>
             </div>
          ) : null}

          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Account erstellen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Starten Sie mit AutoInserat Pro.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <Input
                label="Email Adresse"
                id="email-address"
                name="email"
                type="email"
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
                autoComplete="new-password"
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
              {hasPreselectedPlan ? 'Account erstellen & Loslegen' : 'Registrieren'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Bereits einen Account? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Anmelden
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
