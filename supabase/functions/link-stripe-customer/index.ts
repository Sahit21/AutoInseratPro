import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'AutoInseratPro', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Verify user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user || !user.email) {
      return Response.json({ error: 'User not found' }, { status: 401, headers: corsHeaders });
    }

    // Check if user is already linked
    const { data: existing } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      console.info(`User ${user.id} already linked to customer ${existing.customer_id}`);
      return Response.json({ linked: true, already_linked: true }, { headers: corsHeaders });
    }

    // Search Stripe for customers with this email
    const customers = await stripe.customers.search({
      query: `email:'${user.email}'`,
      limit: 5,
    });

    if (customers.data.length === 0) {
      console.info(`No Stripe customer found for email: ${user.email}`);
      return Response.json({ linked: false }, { headers: corsHeaders });
    }

    // Find customer with an active subscription
    let linkedCustomerId: string | null = null;

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      if (subscriptions.data.length > 0) {
        linkedCustomerId = customer.id;

        // Link customer to Supabase user
        const { error: linkError } = await supabase.from('stripe_customers').upsert(
          { user_id: user.id, customer_id: customer.id },
          { onConflict: 'customer_id' },
        );

        if (linkError) {
          console.error('Failed to link customer:', linkError);
          continue;
        }

        // Sync subscription into DB
        const subscription = subscriptions.data[0];
        const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
          {
            customer_id: customer.id,
            subscription_id: subscription.id,
            price_id: subscription.items.data[0].price.id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status,
            ...(subscription.default_payment_method &&
            typeof subscription.default_payment_method !== 'string'
              ? {
                  payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
                  payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
                }
              : {}),
          },
          { onConflict: 'customer_id' },
        );

        if (subError) {
          console.error('Failed to sync subscription:', subError);
        }

        console.info(
          `Linked customer ${customer.id} to user ${user.id} with subscription ${subscription.status}`,
        );
        break;
      }
    }

    if (!linkedCustomerId) {
      console.info(`No active subscription found for email: ${user.email}`);
      return Response.json({ linked: false }, { headers: corsHeaders });
    }

    return Response.json({ linked: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error linking customer:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
