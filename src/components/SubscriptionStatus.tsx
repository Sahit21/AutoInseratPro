import { useSubscription } from '../hooks/useSubscription'

export function SubscriptionStatus() {
  const { subscription, loading, error, isActive, isPastDue, isCanceled, isTrialing, getSubscriptionPlanName } = useSubscription()

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-4 w-4"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">Failed to load subscription status</p>
          </div>
        </div>
      </div>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">No active subscription</p>
          </div>
        </div>
      </div>
    )
  }

  const planName = getSubscriptionPlanName()
  
  let statusColor = 'gray'
  let statusText = subscription.subscription_status

  if (isActive) {
    statusColor = 'green'
    statusText = 'Active'
  } else if (isTrialing) {
    statusColor = 'blue'
    statusText = 'Trial'
  } else if (isPastDue) {
    statusColor = 'yellow'
    statusText = 'Past Due'
  } else if (isCanceled) {
    statusColor = 'red'
    statusText = 'Canceled'
  }

  return (
    <div className={`bg-${statusColor}-50 border border-${statusColor}-200 rounded-lg p-4`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`h-3 w-3 rounded-full bg-${statusColor}-400`}></div>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium text-${statusColor}-800`}>
              {planName || 'Subscription'}
            </p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
              {statusText}
            </span>
          </div>
          {subscription.current_period_end && (
            <p className={`text-xs text-${statusColor}-600 mt-1`}>
              {isCanceled ? 'Canceled' : 'Renews'} on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}