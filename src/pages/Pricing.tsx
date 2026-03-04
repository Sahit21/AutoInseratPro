import { stripeProducts } from '../stripe-config'
import { ProductCard } from '../components/ProductCard'
import { SubscriptionStatus } from '../components/SubscriptionStatus'
import { useAuth } from '../hooks/useAuth'

export function Pricing() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Get started with AutoInserat Pro and boost your car listings
          </p>
        </div>

        {user && (
          <div className="mt-8 max-w-md mx-auto">
            <SubscriptionStatus />
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-1 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {stripeProducts.map((product) => (
            <ProductCard key={product.priceId} product={product} />
          ))}
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </a>{' '}
              or{' '}
              <a href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                create an account
              </a>{' '}
              to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}