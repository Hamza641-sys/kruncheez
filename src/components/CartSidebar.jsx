import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const categoryEmoji = {
  burgers: '🍔', bbq: '🔥', wraps: '🌯', pizza: '🍕',
  chinese: '🍜', pasta: '🍝', starters: '🍗', sandwich: '🥪',
  chicken: '🍗', soup: '🍲', platter: '🥘', deals: '🏷️',
};

const CartSidebar = () => {
  const {
    cartItems, removeFromCart, updateQuantity, clearCart,
    cartSubtotal, deliveryFee, cartTotal, isCartOpen, setIsCartOpen,
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-krunch-dark border-l border-krunch-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-krunch-border">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-krunch-red" />
                <h2 className="font-heading font-bold text-xl text-white uppercase tracking-wider">Your Order</h2>
                {cartItems.length > 0 && (
                  <span className="bg-krunch-red text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-krunch-gray hover:text-krunch-red text-xs font-body uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="text-6xl">🛒</div>
                  <div>
                    <p className="font-heading font-bold text-xl text-white">Your cart is empty</p>
                    <p className="text-krunch-gray font-body text-sm mt-1">Add some delicious items to get started!</p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary text-sm mt-2"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 bg-krunch-card border border-krunch-border rounded-xl p-3 group"
                      >
                        {/* Emoji */}
                        <div className="w-12 h-12 rounded-lg bg-krunch-black flex items-center justify-center text-2xl flex-shrink-0">
                          {categoryEmoji[item.category] || '🍴'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-white text-sm leading-tight truncate">
                            {item.name}
                          </p>
                          <p className="text-krunch-red font-heading font-bold text-base">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red transition-all"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center font-bold text-white text-sm font-body">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-krunch-red flex items-center justify-center text-white hover:bg-krunch-darkred transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-krunch-gray hover:text-krunch-red transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer / Summary */}
            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t border-krunch-border bg-krunch-black">
                {/* Price breakdown */}
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between text-krunch-gray font-body text-sm">
                    <span>Subtotal</span>
                    <span className="text-white">Rs. {cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-krunch-gray font-body text-sm">
                    <span>Delivery Fee</span>
                    <span className="text-green-400 font-semibold">Rs. {deliveryFee}</span>
                  </div>
                  <div className="h-px bg-krunch-border my-1" />
                  <div className="flex justify-between font-heading font-bold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-krunch-red">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-base py-4 rounded-xl transition-all duration-200 shadow-red-glow uppercase tracking-wider"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </Link>

                {/* Payment icons */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="text-krunch-gray text-xs font-body">🔒 Secure & Safe Payment</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    <span className="text-xs bg-krunch-card border border-krunch-border px-2 py-1 rounded text-krunch-gray">VISA</span>
                    <span className="text-xs bg-krunch-card border border-krunch-border px-2 py-1 rounded text-krunch-gray">MC</span>
                    <span className="text-xs bg-krunch-card border border-krunch-border px-2 py-1 rounded text-krunch-gray">JCB</span>
                  </div>
                  <span className="text-xs bg-krunch-card border border-krunch-border px-2 py-1 rounded text-krunch-gray">Cash on Delivery</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
