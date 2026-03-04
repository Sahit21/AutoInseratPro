import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StripeProduct } from '../stripe-config'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface ProductCardProps {
  product: StripeProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login?redirect=/pricing')
      return
    }

    // Use direct Payment Link if configured
    if (product.paymentLink) {
      const url = new URL(product.paymentLink)
      if (user.email) {
        url.searchParams.set('prefilled_email', user.email)
      }
      window.location.href = url.toString()
      return
    }

    // Fall back to Edge Function checkout
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
          mode: product.mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Purchase error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="text-3xl font-bold text-blue-600 mb-4">
          €{product.price.toFixed(2)}
          {product.mode === 'subscription' && <span className="text-lg text-gray-500">/month</span>}
        </div>
      </div>
      
      <div className="mb-6">
        <ul className="space-y-2">
          {product.description.split('\n').map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={handlePurchase}
        disabled={loading || !user}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : !user ? (
          'Sign in to Purchase'
        ) : (
          `Subscribe for €${product.price.toFixed(2)}/month`
        )}
      </button>
    </div>
  )
}