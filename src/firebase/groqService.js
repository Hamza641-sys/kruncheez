// ── Groq AI Service ─────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-8b-8192';

// ── Restaurant Context ───────────────────────────────────────────────────────
export const getRestaurantContext = (menuItems = []) => {
  const menuSummary = menuItems.length > 0
    ? menuItems.slice(0, 50).map(i => `${i.name} (Rs.${i.price}, ${i.category})`).join(', ')
    : 'Burgers, BBQ, Pizza, Chinese, Wraps';

  return `You are KrunchBot - the official AI assistant for "The KrunchEez" restaurant in Rawalpindi, Pakistan.

RESTAURANT INFO:
- Name: The KrunchEez
- Location: Rawalpindi, Pakistan
- Specialties: Fast Food, Chinese, BBQ
- Website: kruncheez-pos.web.app
- Services: Dine-in, Home Delivery, Self Pickup
- Delivery Time: 30-45 minutes
- All food is 100% Halal
- Opening Hours: 11am - 2am Daily

MENU (sample): ${menuSummary}

ORDERING:
- Online order: kruncheez-pos.web.app/menu
- Dine-in: Scan QR code on table
- Promo codes available for discounts
- Loyalty card: 10% discount on Custom Deal

RULES:
- Answer in the same language the customer uses (Urdu/Roman Urdu/English)
- Be friendly, helpful and concise
- Never make up prices - use menu data provided
- Always encourage ordering!
- Keep responses short (2-3 sentences max)`;
};

// ── Admin Context ────────────────────────────────────────────────────────────
export const getAdminContext = (data = {}) => {
  const { orders = [], expenses = [], salaries = [], staff = [] } = data;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSalaries = salaries.reduce((s, s2) => s + (Number(s2.paid) || 0), 0);

  return `You are KrunchAdmin AI - the business assistant for The KrunchEez restaurant admin panel.

CURRENT DATA:
- Pending Orders: ${pendingOrders}
- Total Staff: ${staff.length}
- Total Expenses Recorded: Rs. ${totalExpenses.toLocaleString()}
- Total Salaries Paid: Rs. ${totalSalaries.toLocaleString()}

RULES:
- You are speaking to the restaurant owner/manager
- Answer in Urdu or English based on question language
- Be analytical and business-focused
- Keep answers concise`;
};

// ── Main Groq API Call ───────────────────────────────────────────────────────
export const askGroq = async (messages, systemPrompt) => {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to .env');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, no response. Please try again.';
};

// ── Order Suggestions (Rule-based) ───────────────────────────────────────────
export const getOrderSuggestions = (cartItems = [], allMenuItems = []) => {
  if (cartItems.length === 0) return [];
  const suggestions = [];
  const cartCategories = cartItems.map(i => i.category);
  const cartTotal = cartItems.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);

  if (cartCategories.includes('burgers') && !cartCategories.includes('drinks')) {
    suggestions.push({ type: 'combo', message: '🥤 Add a drink to complete your burger meal!', icon: '🥤' });
  }

  const deliveryThreshold = 500;
  if (cartTotal > 0 && cartTotal < deliveryThreshold) {
    suggestions.push({ type: 'delivery', message: `🚚 Add Rs. ${deliveryThreshold - cartTotal} more for FREE delivery!`, icon: '🚚' });
  }

  if (cartItems.length === 1) {
    suggestions.push({ type: 'deal', message: '✨ Add one more item to unlock 10% OFF Custom Deal!', icon: '✨' });
  }

  return suggestions.slice(0, 3);
};
