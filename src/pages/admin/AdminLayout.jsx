import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Users,
  BarChart3, Settings, LogOut, Menu, X, Bell, Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin',           label: 'Dashboard',   icon: <LayoutDashboard size={18} /> },
  { path: '/admin/orders',    label: 'Orders',      icon: <ShoppingBag size={18} /> },
  { path: '/admin/menu',      label: 'Menu',        icon: <UtensilsCrossed size={18} /> },
  { path: '/admin/customers', label: 'Customers',   icon: <Users size={18} /> },
  { path: '/admin/analytics', label: 'Analytics',   icon: <BarChart3 size={18} /> },
  { path: '/admin/promos',    label: 'Promo Codes', icon: <Tag size={18} /> },
  { path: '/admin/settings',  label: 'Settings',    icon: <Settings size={18} /> },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-krunch-black flex">

      {/* ── SIDEBAR ── */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-krunch-dark border-r border-krunch-border z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-krunch-border">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black">
                <span className="text-krunch-red font-heading font-black text-sm">K</span>
              </div>
              <div>
                <div className="font-heading font-black text-sm text-white leading-none">KRUNCHEEZ</div>
                <div className="text-krunch-gray text-[9px] uppercase tracking-widest">Admin Panel</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-krunch-gray hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navItems.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 font-body font-semibold text-sm ${
                    active
                      ? 'bg-krunch-red text-white shadow-red-glow'
                      : 'text-krunch-gray hover:bg-krunch-card hover:text-white'
                  }`}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-3 py-4 border-t border-krunch-border">
            <div className="flex items-center gap-3 px-4 py-3 bg-krunch-card rounded-xl mb-2">
              <div className="w-8 h-8 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm flex-shrink-0">
                {userData?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-white font-body font-semibold text-xs truncate">{userData?.name || 'Admin'}</p>
                <p className="text-krunch-gray font-body text-[10px] truncate">{userData?.email || ''}</p>
              </div>
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-krunch-gray hover:text-red-400 hover:bg-red-400/10 transition-all font-body text-sm">
              <LogOut size={16} /> Logout
            </button>
            <Link to="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm mt-1">
              ← View Website
            </Link>
          </div>
        </aside>
      </>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-krunch-dark border-b border-krunch-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-krunch-card text-krunch-gray hover:text-white transition-colors">
            <Menu size={18} />
          </button>
          <div className="hidden lg:block">
            <p className="text-white font-heading font-bold text-lg uppercase tracking-wider">
              {navItems.find(n => location.pathname === n.path || (n.path !== '/admin' && location.pathname.startsWith(n.path)))?.label || 'Dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 rounded-xl bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-krunch-red rounded-full text-[9px] text-white font-bold flex items-center justify-center">!</span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm">
              {userData?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
