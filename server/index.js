const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
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

// ── Razorpay ─────────────────────────────────────────────────────────────────
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const getSupabase = () => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
};

// Create a Razorpay subscription
app.post('/api/razorpay/create-subscription', async (req, res) => {
  if (!razorpay) return res.status(500).json({ error: 'Razorpay is not configured on the server.' });

  const { planId, userId, email } = req.body;
  if (!planId || !userId || !email) {
    return res.status(400).json({ error: 'planId, userId, and email are required.' });
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles (1 year for monthly, 12 years for annual — Razorpay handles this)
      notes: { userId, email },
    });

    res.json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay create-subscription error:', err);
    res.status(500).json({ error: err.error?.description || err.message });
  }
});

// Verify payment signature and activate Pro in database
app.post('/api/razorpay/verify-payment', async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, userId } = req.body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !userId) {
    return res.status(400).json({ error: 'Missing required payment verification fields.' });
  }

  // Verify signature
  const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature. Payment could not be verified.' });
  }

  // Update user to Pro in Supabase
  try {
    const supabase = getSupabase();
    await supabase.from('profiles').update({
      subscription_plan: 'pro',
      subscription_status: 'active',
      razorpay_subscription_id,
    }).eq('id', userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Supabase update error after payment:', err);
    res.status(500).json({ error: 'Payment verified but failed to activate subscription. Contact support.' });
  }
});

// Razorpay webhook — handle subscription lifecycle events
app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = JSON.parse(req.body.toString());
  const supabase = getSupabase();

  try {
    const subscriptionId = event.payload?.subscription?.entity?.id;
    if (!subscriptionId) return res.json({ received: true });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (!profile) return res.json({ received: true });

    switch (event.event) {
      case 'subscription.activated':
        await supabase.from('profiles').update({
          subscription_plan: 'pro',
          subscription_status: 'active',
        }).eq('id', profile.id);
        break;

      case 'subscription.cancelled':
      case 'subscription.completed':
        await supabase.from('profiles').update({
          subscription_plan: 'free',
          subscription_status: 'inactive',
        }).eq('id', profile.id);
        break;

      case 'subscription.charged':
        await supabase.from('profiles').update({
          subscription_status: 'active',
        }).eq('id', profile.id);
        break;
    }
  } catch (err) {
    console.error('Razorpay webhook handler error:', err);
  }

  res.json({ received: true });
});

// Open billing management (Razorpay doesn't have a hosted portal, so we link to support/cancel page)
app.post('/api/razorpay/portal', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('razorpay_subscription_id')
      .eq('id', userId)
      .single();

    if (!data?.razorpay_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    // Link to Razorpay's subscription management page
    res.json({ url: `https://dashboard.razorpay.com` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Razorpay integration: ${razorpay ? 'enabled' : 'disabled (add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)'}\n`);
});
