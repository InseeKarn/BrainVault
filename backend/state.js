// Shared in-memory state across modules
const state = {
  userPlans: new Map(), // userId -> 'free' | 'pro' | 'ultra'
};

module.exports = state;