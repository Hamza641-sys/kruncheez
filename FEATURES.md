# THE KRUNCHEEZ — Complete Website & System Features
## Website: kruncheez-pos.web.app

---

## 🌐 PUBLIC WEBSITE (Customers ke liye)

### 1. Home Page
- Restaurant ka full branded landing page
- Hero banner with food slideshow
- Popular items showcase
- Special deals & offers section
- Customer testimonials
- Call to action buttons

### 2. Menu Page
- Poora menu online — categories ke saath
- Search karo koi bhi item
- Real-time Firestore se load hota hai
- Add to cart directly from menu
- Table QR scan se dine-in order

### 3. Offers Page
- Saare combo deals ek jagah
- Price + savings clearly dikhta hai
- Direct cart mein add

### 4. About Us Page
- Restaurant ki story
- Stats (customers, items, locations)
- Values & team section

### 5. Locations Page
- Saari branches ka address
- Phone numbers
- Opening/closing hours
- Google Maps embed

### 6. Contact Page
- Contact form — message Firestore mein save hoti hai
- Admin ko WhatsApp notification milta hai
- Phone numbers, address, hours
- Social media links

---

## 🛒 ORDERING SYSTEM

### 7. Cart System
- Items add/remove karo
- Quantity control
- Real-time price calculation
- Cart sidebar slide-in
- localStorage mein save (page refresh pe bhi rahta hai)

### 8. Checkout Page
- 3 order types: Home Delivery / Self Pickup / Dine-In
- Customer details form
- Saved addresses quick select
- Area/sector dropdown
- Promo code apply
- Loyalty card apply (10% discount)
- Cash on Delivery / Card payment
- Special instructions
- Order summary with all discounts
- Admin ko WhatsApp notification on new order

### 9. Order Tracking
- Real-time order status track karo
- Live step tracker: Pending → Confirmed → Preparing → Out for Delivery → Delivered
- Har status update pe dikhta hai

---

## 👤 CUSTOMER PORTAL (Account wale customers)

### 10. Customer Dashboard
- Welcome banner with name
- Total orders, loyalty points, total spent, saved addresses stats
- Quick actions (Order, My Orders, Loyalty, Profile)
- Recent 3 orders ka status
- Loyalty points progress bar

### 11. My Orders
- Puri order history
- Status filter tabs (All/Pending/Delivered etc.)
- Track any order
- Review button for delivered orders

### 12. Saved Addresses
- Multiple addresses save karo (Home, Work, etc.)
- Edit/delete addresses
- Default address set karo
- Checkout mein auto-fill

### 13. Loyalty Points System
- Har Rs.10 kharch pe 1 point milta hai
- 8 reward tiers (Free Drink → Free Platter)
- Points se rewards redeem karo
- Progress bar next reward ke liye

### 14. Loyalty Card (Digital)
- Physical card ka digital version
- 10 visits = 10% discount
- Bronze / Silver / Gold tier system
- QR code wali digital card
- Download karo PNG mein
- Share karo

### 15. Reviews
- 1-5 star overall rating
- 4 aspect ratings (Food/Delivery/Packaging/Value)
- Quick tags
- Comment
- Har order ka sirf ek review (duplicate prevention)

### 16. Profile Page
- Name aur phone update karo
- Account info

### 17. Login / Signup
- Email + password registration
- Google account se login
- Forgot password (email reset)
- Phone number required at signup

---

## 🖥️ ADMIN PANEL (Restaurant Management)

### 18. Admin Dashboard
- Today's orders aur revenue
- Total customers count
- Order status breakdown
- Pending orders queue (Accept/Reject)
- Recent orders list

### 19. Orders Management
- Saare orders real-time
- Filter: status + order type (Dine-in/Delivery/Pickup)
- Search by name, phone, order ID, table
- Customer badge: 🆕 New / ⭐ Regular / 👑 VIP
- Status update buttons (→ Next step)
- Order detail modal
- Customer ko WhatsApp status update milta hai

### 20. POS / Billing System (Walk-in customers)
- Direct order entry from admin
- Menu items grid with images
- Cart + quantity control
- Customer name + table number
- Discount % apply karo
- Cash / Card payment
- Order Firestore mein save hota hai
- Thermal receipt print (browser se)

### 21. Menu Management
- Menu items add/edit/delete
- Category management
- Image URL + preview
- Price, description, badge
- Item availability toggle (Live/Off)
- Real-time Firestore update

### 22. Sales + Reports
- Revenue vs Expenses comparison
- Period filter: Today/Week/Month/Year/All Time
- Net Profit / Loss clearly dikhta hai
- 3 expense types alag alag:
  - 🚚 Supplier payments
  - 👥 Staff salary
  - 📝 Daily expenses
- Revenue bar chart (last 7 days)
- Top selling items
- Order status breakdown
- Payment method stats
- Export Full Report as CSV

### 23. Analytics
- Total revenue, orders, customers
- Revenue chart (last 7 days)
- Top 5 selling items
- Order status breakdown
- Avg order value, delivery rate

### 24. Daily Expenses
- Daily kharcha record karo
- 13 categories (Milk, Masala, Gas, Electricity, etc.)
- Period filter
- Category-wise breakdown
- CSV export

### 25. Suppliers Management
- Supplier profiles add karo
- Payment record karo
- Payment history tab
- Total paid per supplier track

### 26. Staff Management
- Staff profiles (name, role, salary, joining date)
- Monthly salary pay karo
- Fine aur bonus system
- Net salary auto-calculate
- Staff reports (misconduct, warning, absent, late)
- Salary Reports alag track hota hai

### 27. Customer Management
- Saare registered customers
- Search by name/email/phone
- Total orders aur spending per customer
- Make Admin / Remove Admin
- Customer detail modal

### 28. Promo Codes
- Discount codes banao
- % ya flat discount
- Min order amount set karo
- Max uses limit
- Expiry date
- Copy to clipboard

### 29. QR Code System (Advanced Dine-In Ordering)
- **Har table ka apna unique QR code** generate hota hai
- Admin panel se jitne chahein tables banao (Table 1, 2, 3...)
- **Customer QR scan kare → seedha us table ka menu khul jata hai**
- Customer apne phone se order karta hai — waiter ki zaroorat nahi
- Order seedha kitchen aur admin ko milta hai **table number ke saath**
- Table status real-time dikhta hai: ✅ Free / 🔴 Occupied
- **QR Cards print karo** — branded design ke saath (restaurant name, table number, QR)
- Single table ya saare tables ek saath print
- QR image PNG mein download karo
- Laminate karke table pe rakh do — ek baar setup, hamesha ke liye kaam kare

**Yeh system kya solve karta hai:**
- Waiter ko baar baar order lene nahi aana padta
- Customer directly apne phone se order karta hai
- Galat order ki problem khatam (customer khud select karta hai)
- Rush hours mein fast service
- Paper menu ki zaroorat khatam

### 30. Loyalty Cards (Admin)
- Customer ko card issue karo
- Manually visit/stamp add karo
- Card active/inactive toggle
- Print physical cards (front + back design)
- Bronze / Silver / Gold tier

### 31. Admin Settings
- Restaurant name, address, phones update karo
- Opening/closing hours
- Delivery fee, minimum order
- WhatsApp / Email notification toggle
- Accepting orders toggle (pause/resume)
- **Change Password** (secure reauth)
- **Change Email** (secure reauth)
- Firestore mein permanently save hota hai

### 32. Notification Panel (Bell 🔔)
- Real-time new order notifications
- Unread badge count
- Pending orders alert banner
- Mark all read
- Click → Orders page pe jao

### 33. Kitchen Screen
- Separate screen for kitchen staff
- Active orders display
- Status update from kitchen

---

## ⚙️ TECHNICAL FEATURES

### Security
- Admin-only protected routes
- Customer-only protected routes
- Firestore security rules (koi bhi data chura nahi sakta)
- Firebase Authentication

### Performance
- PWA (Progressive Web App) — phone mein install ho sakta hai
- Fast loading with code splitting
- Images CDN se load hoti hain

### Real-time
- Orders real-time update hote hain (page refresh ki zaroorat nahi)
- Notification bell real-time
- Kitchen screen real-time

### Notifications
- New order → Admin ko WhatsApp message
- Order status change → Customer ko WhatsApp message
- Contact form → Admin ko WhatsApp message

### Database
- Firebase Firestore (Google ka database)
- 100% free for small/medium restaurant
- Automatic backup
- 99.9% uptime guarantee

---

## 💰 COST SUMMARY

| Item | Cost |
|------|------|
| Public Website (6 pages) | Rs. 15,000 |
| Online Ordering System | Rs. 20,000 |
| Customer Portal & Loyalty | Rs. 18,000 |
| Admin Panel — Core | Rs. 22,000 |
| Reports & Finance System | Rs. 25,000 |
| QR Dine-In, Promos, Kitchen | Rs. 20,000 |
| Technical Infrastructure | Rs. 10,000 |
| **Total Project Value** | **Rs. 1,30,000** |
| **Full Payment Discount** | **- Rs. 20,000** |
| **✅ Final Price (One-Time)** | **Rs. 1,10,000** |

### 🏦 Installment Option
| Installment | When | Amount |
|-------------|------|--------|
| 1st | Agreement / Meeting | Rs. 40,000 |
| 2nd | Domain Setup + Handover | Rs. 40,000 |
| 3rd | After 1 Month Running | Rs. 30,000 |
| **Total** | | **Rs. 1,10,000** |

### 🔧 Running Costs (After Launch)
| Item | Cost |
|------|------|
| Firebase Database | **FREE forever** |
| Firebase Hosting | **FREE forever** |
| Current URL (kruncheez-pos.web.app) | **FREE forever** |
| Custom Domain (e.g. kruncheez.pk) | ~Rs. 2,000–5,000/year |
| Monthly Maintenance (optional) | Rs. 5,000/month |

**Firebase bilkul free hai — sirf ek baar developer ko pay karo, phir koi monthly charges nahi!**

---

## 🌐 Live Website
**https://kruncheez-pos.web.app**

---
*Developed by: Hamza | Full Stack Restaurant Management System*
*Tech Stack: React.js, Firebase, Tailwind CSS, Framer Motion*
