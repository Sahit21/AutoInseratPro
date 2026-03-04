import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getProductByPriceId } from '../stripe-config'

export interface UserSubscription {
  customer_id: string
  subscription_id: string | null
  subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const linkedRef = useRef(false)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      linkedRef.current = false
      return
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle()

        if (error) throw error

        if (data) {
          setSubscription(data)
          return
        }

        // No subscription in DB yet — try to link via Stripe (for external Payment Links)
        if (!linkedRef.current) {
          linkedRef.current = true

          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return

          try {
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-stripe-customer`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              },
            )

            const result = await res.json()

            if (result.linked) {
              // Refetch after linking
              const { data: newData } = await supabase
                .from('stripe_user_subscriptions')
                .select('*')
                .maybeSingle()
              setSubscription(newData ?? null)
              return
            }
          } catch (linkErr) {
            console.error('Error linking Stripe customer:', linkErr)
          }
        }

        setSubscription(null)
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const getSubscriptionPlanName = () => {
    if (!subscription?.price_id) return null
    const product = getProductByPriceId(subscription.price_id)
    return product?.name || null
  }

  const isActive = subscription?.subscription_status === 'active'
  const isPastDue = subscription?.subscription_status === 'past_due'
  const isCanceled = subscription?.subscription_status === 'canceled'
  const isTrialing = subscription?.subscription_status === 'trialing'

  return {
    subscription,
    loading,
    error,
    isActive,
    isPastDue,
    isCanceled,
    isTrialing,
    getSubscriptionPlanName,
  }
}
