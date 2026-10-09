import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, resetPassword } from '../../firebase/authService';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(form.email, form.password);
      toast.success('Welcome back! 🎉', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password' :
                  err.code === 'auth/too-many-requests' ? 'Too many attempts. Try later.' : err.message;
      toast.error(msg, { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google! 🎉', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Google login failed. Try again.', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
      toast.success('Reset email sent! Check your inbox.', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
      setForgotMode(false);
    } catch {
      toast.error('Email not found.', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } });
    }
  };

  return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center px-4 py-20">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(227,30,36,0.07)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black">
              <span className="text-krunch-red font-heading font-black text-lg">K</span>
            </div>
            <div className="text-left">
              <div className="font-heading font-black text-xl text-white leading-none">THE <span className="text-krunch-red">KRUNCHEEZ</span></div>
              <div className="text-krunch-gray text-[10px] uppercase tracking-widest">Fast Food • Chinese • BBQ</div>
            </div>
          </Link>
        </div>

        <div className="card-dark p-8">
          {!forgotMode ? (
            <>
              <h2 className="font-heading font-black text-2xl text-white uppercase mb-1">Welcome Back!</h2>
              <p className="text-krunch-gray font-body text-sm mb-6">Login to your account to order & track</p>

              {/* Google Login */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-body font-semibold text-sm py-3 rounded-xl transition-all duration-200 mb-4 disabled:opacity-70"
              >
                {googleLoading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-krunch-border" />
                <span className="text-krunch-gray font-body text-xs">OR</span>
                <div className="flex-1 h-px bg-krunch-border" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                    <input
                      type="email" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl pl-10 pr-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                    <input
                      type={showPass ? 'text' : 'password'} required value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl pl-10 pr-10 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-krunch-gray hover:text-white transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setForgotMode(true)}
                    className="text-krunch-red font-body text-xs hover:text-white transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-red-glow uppercase tracking-wider disabled:opacity-70">
                  {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <><ArrowRight size={16} /> Login</>}
                </button>
              </form>

              <p className="text-center text-krunch-gray font-body text-sm mt-5">
                Don't have an account?{' '}
                <Link to="/signup" className="text-krunch-red hover:text-white font-semibold transition-colors">Sign Up</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-heading font-black text-2xl text-white uppercase mb-1">Reset Password</h2>
              <p className="text-krunch-gray font-body text-sm mb-6">Enter your email — we'll send a reset link</p>
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                  <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl pl-10 pr-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <button type="submit" className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3.5 rounded-xl transition-all uppercase tracking-wider">
                  Send Reset Link
                </button>
                <button type="button" onClick={() => setForgotMode(false)}
                  className="text-krunch-gray hover:text-white font-body text-sm transition-colors text-center">
                  ← Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
