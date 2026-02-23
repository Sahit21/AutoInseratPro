import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const Pricing: React.FC = () => {
  // In a real app, these would be your actual Stripe Payment Link URLs
  // Configure them in Stripe to redirect to: https://your-app.com/signup?plan=NAME
  const STRIPE_LINKS = {
    starter: 'https://buy.stripe.com/test_starter', 
    pro: 'https://buy.stripe.com/test_pro',
    business: 'https://buy.stripe.com/test_business'
  };

  // For the demo, we simulate the redirect that Stripe would do
  const getSimulatedLink = (plan: string) => `/signup?plan=${plan}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Preise & Pläne
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Wählen Sie das passende Paket für Ihr Autohaus.
          </p>
          <div className="mt-4">
             <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
               Bereits einen Account? Hier einloggen
             </Link>
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
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Bis zu 10 Inserate/Monat</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Standard Support</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-lg">
               <a 
                 href={getSimulatedLink('starter')}
                 className="block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
               >
                 Jetzt starten
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
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Unbegrenzte Inserate</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">AI Bildoptimierung (Showroom)</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Priorisierter Support</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-lg">
               <a 
                 href={getSimulatedLink('pro')}
                 className="block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
               >
                 Jetzt starten
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
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Alles aus Pro</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">API Zugriff</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span className="ml-3 text-base text-gray-500">Account Manager</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 rounded-b-lg">
               <a 
                 href={getSimulatedLink('business')}
                 className="block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
               >
                 Jetzt starten
               </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
