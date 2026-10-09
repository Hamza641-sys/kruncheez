import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Truck, Home, ArrowLeft } from 'lucide-react';
import { listenToOrder } from '../../firebase/orderService';

const steps = [
  { key: 'pending',          label: 'Order Placed',      icon: <Clock size={20} />,        desc: 'Your order has been received' },
  { key: 'confirmed',        label: 'Confirmed',         icon: <CheckCircle size={20} />,   desc: 'Restaurant accepted your order' },
  { key: 'preparing',        label: 'Being Prepared',    icon: <ChefHat size={20} />,       desc: 'Chef is preparing your food 🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: <Truck size={20} />,         desc: 'Your order is on the way! 🛵' },
  { key: 'delivered',        label: 'Delivered',         icon: <Home size={20} />,          desc: 'Enjoy your meal! 🎉' },
];

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenToOrder(orderId, (data) => {
      setOrder(data);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20">
      <div className="w-12 h-12 rounded-full border-2 border-krunch-red border-t-transparent animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20 text-center px-4">
      <div>
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="font-heading font-bold text-2xl text-white uppercase">Order Not Found</h2>
        <Link to="/my-orders" className="btn-primary mt-5 inline-block">My Orders</Link>
      </div>
    </div>
  );

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const isRejected = order.status === 'rejected';

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back */}
        <Link to="/my-orders" className="flex items-center gap-2 text-krunch-gray hover:text-white transition-colors font-body text-sm mb-6">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>

        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-heading font-black text-2xl text-white uppercase">Track Order</h1>
            {isRejected ? (
              <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">Rejected</span>
            ) : order.status === 'delivered' ? (
              <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">✅ Delivered</span>
            ) : (
              <span className="bg-krunch-red/10 border border-krunch-red/30 text-krunch-red text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">● Live</span>
            )}
          </div>
          <p className="text-krunch-gray font-body text-sm">Order #{order.id.slice(0,8).toUpperCase()}</p>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-krunch-border">
            <div>
              <p className="text-krunch-gray font-body text-[10px] uppercase tracking-wider">Items</p>
              <p className="text-white font-body font-semibold text-sm mt-0.5">{order.items?.length} items</p>
            </div>
            <div>
              <p className="text-krunch-gray font-body text-[10px] uppercase tracking-wider">Total</p>
              <p className="text-krunch-red font-heading font-black text-lg mt-0.5">Rs. {order.summary?.total?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-krunch-gray font-body text-[10px] uppercase tracking-wider">Payment</p>
              <p className="text-white font-body font-semibold text-sm mt-0.5 capitalize">{order.paymentMethod === 'cash' ? 'COD' : 'Card'}</p>
            </div>
          </div>
        </div>

        {/* Rejected State */}
        {isRejected ? (
          <div className="card-dark p-8 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="font-heading font-bold text-xl text-white uppercase mb-2">Order Rejected</h3>
            <p className="text-krunch-gray font-body text-sm mb-6">Sorry, we couldn't process your order. Please try again.</p>
            <Link to="/menu" className="btn-primary">Order Again</Link>
          </div>
        ) : (
          /* Tracker Steps */
          <div className="card-dark p-6">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-6">Order Progress</h3>
            <div className="flex flex-col gap-0">
              {steps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isLast = i === steps.length - 1;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Indicator */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCompleted ? '#E31E24' : '#2A2A2A',
                          borderColor: isCompleted ? '#E31E24' : '#2A2A2A',
                          scale: isCurrent ? 1.15 : 1,
                        }}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isCompleted ? 'text-white shadow-red-glow' : 'text-krunch-gray'
                        } ${isCurrent ? 'ring-2 ring-krunch-red/30 ring-offset-2 ring-offset-krunch-card' : ''}`}
                      >
                        {step.icon}
                      </motion.div>
                      {!isLast && (
                        <motion.div
                          initial={false}
                          animate={{ backgroundColor: i < currentStepIndex ? '#E31E24' : '#2A2A2A' }}
                          className="w-0.5 h-12 transition-all duration-700"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`font-heading font-bold text-base uppercase transition-colors ${isCompleted ? 'text-white' : 'text-krunch-gray'}`}>
                        {step.label}
                        {isCurrent && <span className="ml-2 text-krunch-red text-xs normal-case font-body animate-pulse">← Now</span>}
                      </p>
                      <p className={`font-body text-sm mt-0.5 transition-colors ${isCompleted ? 'text-krunch-gray' : 'text-krunch-border'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivered CTA */}
            {order.status === 'delivered' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center"
              >
                <p className="font-heading font-bold text-green-400 text-lg uppercase mb-2">Enjoy your meal! 🎉</p>
                <Link to={`/review/${order.id}`}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-body font-bold text-sm px-4 py-2 rounded-xl transition-all">
                  ⭐ Leave a Review
                </Link>
              </motion.div>
            )}

            {/* Estimated time */}
            {!['delivered','rejected'].includes(order.status) && (
              <div className="mt-6 bg-krunch-black border border-krunch-border rounded-xl p-4 flex items-center gap-3">
                <Clock size={18} className="text-krunch-red flex-shrink-0" />
                <div>
                  <p className="text-white font-body font-semibold text-sm">Estimated Delivery</p>
                  <p className="text-krunch-gray font-body text-xs">30–45 minutes from order placement</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="card-dark p-5 mt-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Order Items</h3>
          <div className="flex flex-col gap-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-krunch-black rounded-lg flex items-center justify-center text-sm">🍴</div>
                  <div>
                    <p className="text-white font-body font-semibold text-sm">{item.name}</p>
                    <p className="text-krunch-gray font-body text-xs">x{item.quantity}</p>
                  </div>
                </div>
                <span className="text-krunch-red font-heading font-bold text-sm">Rs. {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-krunch-border flex justify-between">
              <span className="text-krunch-gray font-body text-sm">Total</span>
              <span className="text-krunch-red font-heading font-black text-xl">Rs. {order.summary?.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
