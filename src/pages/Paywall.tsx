import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const Paywall: React.FC = () => {
  const { signOut, userAccess } = useAuth();
  const navigate = useNavigate();

  // In a real app, these would be links to Stripe Customer Portal or Checkout
  // that redirect back to the app after success.
  const STRIPE_LINKS = {
    starter: 'https://buy.stripe.com/test_starter', 
    pro: 'https://buy.stripe.com/test_pro',
    business: 'https://buy.stripe.com/test_business'
  };

  // Simulate redirect
  const getSimulatedLink = (plan: string) => `/signup?plan=${plan}`; // For existing users, this flow might need adjustment (e.g. /settings/billing)

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Abo abgelaufen oder nicht aktiv
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Bitte wählen Sie einen Plan, um fortzufahren.
          </p>
          <div className="mt-4">
             <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 underline">Abmelden</button>
          </div>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {/* Starter Plan */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white flex flex-col">
            <div className="p-6 flex-1">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Starter</h2>
              <p className="mt-4 text-sm text-gray-500">Für kleine Händler.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">29€</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <a 
                href={getSimulatedLink('starter')}
                className="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Plan wählen
              </a>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border border-blue-200 ring-2 ring-blue-500 rounded-lg shadow-sm divide-y divide-gray-200 bg-white relative flex flex-col">
             <div className="absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Beliebt
             </div>
            <div className="p-6 flex-1">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
              <p className="mt-4 text-sm text-gray-500">Für professionelle Autohäuser.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">79€</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <a 
                href={getSimulatedLink('pro')}
                className="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Plan wählen
              </a>
            </div>
          </div>

          {/* Business Plan */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white flex flex-col">
            <div className="p-6 flex-1">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Business</h2>
              <p className="mt-4 text-sm text-gray-500">Für große Autohaus-Gruppen.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">199€</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <a 
                href={getSimulatedLink('business')}
                className="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Plan wählen
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
