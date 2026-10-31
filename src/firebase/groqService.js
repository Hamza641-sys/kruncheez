// ── Groq AI Service ─────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3.8-27b'; // Working model

// ── Restaurant Context ───────────────────────────────────────────────────────
export const getRestaurantContext = (menuItems = [], orders = [], expenses = [], salaries = []) => {
  const menuSummary = menuItems.length > 0
    ? menuItems.slice(0, 50).map(i => `${i.name} (Rs.${i.price}, ${i.category})`).join(', ')
    : 'Burgers, BBQ, Pizza, Chinese, Wraps, Pasta, Starters, Fried Chicken, Soup, Platters';

  return `
You are KrunchBot - the official AI assistant for "The KrunchEez" restaurant in Peshawar, Pakistan.

RESTAURANT INFO:
- Name: The KrunchEez
- Location: Peshawar, Pakistan
- Specialties: Fast Food, Chinese, BBQ
- Website: kruncheez-pos.web.app
- Services: Dine-in, Home Delivery, Self Pickup
- Delivery Time: 30-45 minutes
- All food is 100% Halal
- Opening Hours: Daily (check website for exact hours)

MENU (sample): ${menuSummary}

ORDERING:
- Online order: kruncheez-pos.web.app/menu
- Dine-in: Scan QR code on table
- Promo codes available for discounts
- Loyalty card: 10 visits = 10% discount
- Custom Deal: Pick any 2+ items = 10% off

RULES:
- Answer in the same language the customer uses (Urdu/Roman Urdu/English)
- Be friendly, helpful and concise
- If you don't know something specific, say "Please contact us directly"
- Never make up prices - use menu data provided
- Always encourage ordering!
- Keep responses short (2-3 sentences max for simple questions)
`;
};

// ── Admin Context ────────────────────────────────────────────────────────────
export const getAdminContext = (data = {}) => {
  const { orders = [], expenses = [], salaries = [], staff = [], suppliers = [] } = data;

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt?.toDate?.()?.toISOString?.()?.startsWith(today) || o.createdAt?.startsWith?.(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSalaries = salaries.reduce((s, s2) => s + (s2.paid || 0), 0);

  return `
You are KrunchAdmin AI - the intelligent business assistant for The KrunchEez restaurant admin panel.

CURRENT BUSINESS DATA:
- Today's Orders: ${todayOrders.length} orders
- Today's Revenue: Rs. ${todayRevenue.toLocaleString()}
- Pending Orders: ${pendingOrders}
- Total Staff: ${staff.length}
- Total Expenses Recorded: Rs. ${totalExpenses.toLocaleString()}
- Total Salaries Paid: Rs. ${totalSalaries.toLocaleString()}

TOP MENU ITEMS (by order frequency):
${getTopItems(orders)}

RULES:
- You are speaking to the restaurant owner/manager
- Answer in Urdu or English based on question language
- Give specific numbers from the data when available
- Be analytical and business-focused
- Suggest improvements when relevant
- Keep answers concise but informative
`;
};

const getTopItems = (orders) => {
  const itemCount = {};
  orders.forEach(o => {
    (o.items || []).forEach(i => {
      itemCount[i.name] = (itemCount[i.name] || 0) + (i.quantity || 1);
    });
  });
  return Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}: ${count} times`)
    .join(', ') || 'No data yet';
};

// ── Main Groq API Call ───────────────────────────────────────────────────────
export const askGroq = async (messages, systemPrompt) => {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    mode: 'cors',
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
  return data.choices?.[0]?.message?.content || 'Sorry, no response received. Please try again.';
};

// ── Order Assistant (Rule-based + AI) ───────────────────────────────────────
export const getOrderSuggestions = (cartItems = [], allMenuItems = []) => {
  if (cartItems.length === 0) return [];

  const suggestions = [];
  const cartNames = cartItems.map(i => i.name?.toLowerCase());
  const cartCategories = cartItems.map(i => i.category);
  const cartTotal = cartItems.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);

  // Rule 1: Burger without drink
  if (cartCategories.includes('burgers') && !cartCategories.includes('drinks')) {
    const drinks = allMenuItems.filter(i => i.category === 'deals' && i.name?.toLowerCase().includes('drink'));
    if (drinks.length === 0) {
      suggestions.push({
        type: 'combo',
        message: '🥤 Having a burger? Add a drink to complete your meal!',
        icon: '🥤',
      });
    }
  }

  // Rule 2: BBQ without raita/salad
  if (cartCategories.includes('bbq')) {
    const hasRaita = cartNames.some(n => n.includes('raita'));
    const hasSalad = cartNames.some(n => n.includes('salad'));
    if (!hasRaita && !hasSalad) {
      suggestions.push({
        type: 'addon',
        message: '🥗 BBQ pairs perfectly with Raita + Salad! (Rs. 200)',
        icon: '🥗',
      });
    }
  }

  // Rule 3: Near free delivery threshold
  const deliveryThreshold = 500;
  if (cartTotal > 0 && cartTotal < deliveryThreshold) {
    const remaining = deliveryThreshold - cartTotal;
    suggestions.push({
      type: 'delivery',
      message: `🚚 Add just Rs. ${remaining} more to get FREE delivery!`,
      icon: '🚚',
    });
  }

  // Rule 4: Single item - suggest custom deal
  if (cartItems.length === 1) {
    suggestions.push({
      type: 'deal',
      message: '✨ Add one more item - unlock 10% OFF with Custom Deal!',
      icon: '✨',
    });
  }

  // Rule 5: Platter for large orders
  const totalQty = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  if (totalQty >= 3 && !cartCategories.includes('platter')) {
    suggestions.push({
      type: 'platter',
      message: '🥘 Ordering for a group? Check out our Platters for better value!',
      icon: '🥘',
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
};
