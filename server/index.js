const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security: Environment-based CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI API Proxy Server is running' });
});

// AI API proxy endpoint (using Groq - free and fast!)
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt, maxTokens = 4096 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Try Groq first (free and fast)
    // Security: Use backend-specific env vars (not REACT_APP_)
    const groqKey = process.env.GROQ_API_KEY || process.env.REACT_APP_GROQ_API_KEY;

    if (groqKey) {
      console.log('🚀 Forwarding request to Groq API (free)...');

      // Truncate prompt if too long (Groq free tier limit: ~8000 tokens input)
      let truncatedPrompt = prompt;
      const maxChars = 25000; // Roughly 8000 tokens
      if (prompt.length > maxChars) {
        console.log(`⚠️ Prompt too long (${prompt.length} chars), truncating to ${maxChars} chars...`);
        truncatedPrompt = prompt.substring(0, maxChars) + '\n\n[Note: Document was truncated due to length. Analysis based on first portion.]';
      }

      try {
        // Add timeout controller (60 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: truncatedPrompt
            }],
            max_tokens: maxTokens,
            temperature: 0.7
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Groq API response received');
          const text = data.choices[0]?.message?.content || '';
          return res.json({ text });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('❌ Groq API Error:', response.status, errorData);
          return res.status(response.status).json({
            error: errorData.error?.message || 'Groq API request failed'
          });
        }
      } catch (groqError) {
        console.log('❌ Groq API Exception:', groqError);
        
        // Check if it's a rate limit or timeout
        if (groqError.name === 'AbortError') {
          return res.status(408).json({
            error: 'Request timeout. The AI service took too long to respond. Please try again with a smaller document.'
          });
        }
        
        return res.status(500).json({
          error: 'Failed to connect to Groq API. This could be due to rate limiting or network issues. Please wait a moment and try again.'
        });
      }
    }

    // Fallback to Claude if Groq fails or no key
    // Security: Use backend-specific env vars (not REACT_APP_)
    const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_API_KEY;

    if (!claudeKey) {
      return res.status(500).json({
        error: 'No AI API key configured. Please add REACT_APP_GROQ_API_KEY (free at console.groq.com) or REACT_APP_ANTHROPIC_API_KEY to your .env file.'
      });
    }

    console.log('🔑 Forwarding request to Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API Error:', error);
      const errorMessage = error.error?.message || error.message || 'AI API request failed';
      return res.status(response.status).json({ error: errorMessage });
    }

    const data = await response.json();
    console.log('✅ Claude API response received');

    // Extract text from Claude's response format
    const text = data.content[0]?.text || '';

    res.json({ text });

  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ── Stripe ────────────────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Create Stripe checkout session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured on the server.' });

  const { priceId, userId, email } = req.body;
  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'priceId, userId, and email are required.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/?payment=cancelled`,
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Open Stripe customer portal (manage subscription / cancel)
app.post('/api/stripe/create-portal-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured on the server.' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    // Look up the Stripe customer ID from your database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !data?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found for this user.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook — update user subscription status in Supabase
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured.' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        if (userId && customerId) {
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            subscription_plan: 'pro',
            subscription_status: 'active',
          }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .single();
        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: sub.status === 'active' ? 'active' : 'inactive',
          }).eq('id', profile.id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .single();
        if (profile) {
          await supabase.from('profiles').update({
            subscription_plan: 'free',
            subscription_status: 'inactive',
          }).eq('id', profile.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Stripe integration: ${stripe ? 'enabled' : 'disabled (no STRIPE_SECRET_KEY)'}\n`);
});
