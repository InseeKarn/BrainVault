const express = require('express');
let stripe = null;
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY) stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
} catch (_) {
  // stripe not installed or key missing; will use mock mode
}

const router = express.Router();

// Pricing catalog (example)
const PLANS = [
  { id: 'plan_free', name: 'Free', price: 0, interval: 'month', features: ['10 hint tokens/month', 'Basic stats'] },
  { id: 'plan_pro', name: 'Pro', price: 7.99, interval: 'month', features: ['50 hint tokens/month', 'Advanced stats', 'Detailed solutions'] },
  { id: 'plan_ultra', name: 'Ultra', price: 14.99, interval: 'month', features: ['Unlimited hints (fair use)', 'All analytics', 'Priority support'] }
];

const HINT_PACKS = [
  { id: 'pack_10', name: '10 Hint Tokens', price: 2.99, tokens: 10 },
  { id: 'pack_30', name: '30 Hint Tokens', price: 6.99, tokens: 30 },
  { id: 'pack_100', name: '100 Hint Tokens', price: 19.99, tokens: 100 }
];

// Helper: mock checkout URL
function mockCheckoutUrl(type, id) {
  return `https://checkout.mock/brainvault/${type}/${id}?ref=dev`;
}

// GET /api/billing/catalog
router.get('/catalog', (_req, res) => {
  res.json({ plans: PLANS, hint_packs: HINT_PACKS, currency: 'USD' });
});

// POST /api/billing/create-checkout-session
// Body: { type: 'subscription'|'hints', id: planOrPackId, quantity? }
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { type, id, quantity = 1, success_url, cancel_url } = req.body || {};
    if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

    // If Stripe not configured, return mock URL
    if (!stripe) {
      return res.json({ checkout_url: mockCheckoutUrl(type, id), provider: 'mock' });
    }

    // Build Stripe session
    let lineItems = [];
    if (type === 'hints') {
      const pack = HINT_PACKS.find(p => p.id === id);
      if (!pack) return res.status(404).json({ error: 'Pack not found' });
      lineItems = [{ price_data: { currency: 'usd', product_data: { name: pack.name }, unit_amount: Math.round(pack.price * 100) }, quantity: Math.max(1, parseInt(quantity, 10)) }];
    } else if (type === 'subscription') {
      const plan = PLANS.find(p => p.id === id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      lineItems = [{ price_data: { currency: 'usd', product_data: { name: `${plan.name} (${plan.interval})` }, unit_amount: Math.round(plan.price * 100), recurring: { interval: plan.interval } }, quantity: 1 }];
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: type === 'subscription' ? 'subscription' : 'payment',
      line_items: lineItems,
      success_url: success_url || 'http://localhost:3000/hint_store.html?success=1',
      cancel_url: cancel_url || 'http://localhost:3000/hint_store.html?canceled=1'
    });

    res.json({ checkout_url: session.url, provider: 'stripe' });
  } catch (error) {
    console.error('Stripe session error:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/webhook (placeholder)
router.post('/webhook', (req, res) => {
  // In production, verify signature and process events
  console.log('Received billing webhook (placeholder).');
  res.json({ received: true });
});

// Mock activation of plans for development (requires auth)
const jwt = require('jsonwebtoken');
const state = require('./state');
const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';

router.post('/mock/activate', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const { plan } = req.body || {};
    if (!plan || !['free','pro','ultra','plan_pro','plan_ultra'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const normalized = plan === 'plan_pro' ? 'pro' : plan === 'plan_ultra' ? 'ultra' : plan;
    state.userPlans.set(decoded.id, normalized);
    res.json({ success: true, plan: normalized });
  } catch (e) {
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

module.exports = router;
