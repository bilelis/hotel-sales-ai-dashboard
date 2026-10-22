import React, { useState, useId } from 'react';
import {
  IconUser,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconGoogle,
  IconGithub,
  IconHotel,
} from '../icons';
import { loginAuth, type AuthUser } from '../../api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// 16 Decorative fireflies with randomized positions and animation properties
const FIREFLIES = [
  { top: '14%', left: '18%', size: 5, duration: '5.2s', delay: '0.2s' },
  { top: '22%', left: '42%', size: 7, duration: '6.4s', delay: '1.5s' },
  { top: '35%', left: '12%', size: 4, duration: '4.8s', delay: '0.8s' },
  { top: '48%', left: '38%', size: 6, duration: '7.1s', delay: '2.1s' },
  { top: '60%', left: '25%', size: 5, duration: '5.6s', delay: '1.1s' },
  { top: '28%', left: '65%', size: 8, duration: '6.8s', delay: '2.8s' },
  { top: '42%', left: '55%', size: 4, duration: '4.5s', delay: '0.5s' },
  { top: '75%', left: '16%', size: 6, duration: '5.9s', delay: '1.9s' },
  { top: '82%', left: '48%', size: 5, duration: '6.2s', delay: '3.2s' },
  { top: '18%', left: '78%', size: 6, duration: '5.0s', delay: '0.9s' },
  { top: '68%', left: '72%', size: 7, duration: '7.5s', delay: '1.4s' },
  { top: '52%', left: '85%', size: 4, duration: '4.2s', delay: '2.3s' },
  { top: '88%', left: '80%', size: 6, duration: '6.6s', delay: '0.4s' },
  { top: '10%', left: '50%', size: 5, duration: '5.8s', delay: '1.7s' },
  { top: '30%', left: '28%', size: 7, duration: '6.9s', delay: '2.5s' },
  { top: '78%', left: '35%', size: 4, duration: '4.9s', delay: '1.2s' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onToast }) => {
  const [username, setUsername] = useState('ayari');
  const [email, setEmail] = useState('ayari@grandazur.com');
  const [password, setPassword] = useState('ayari');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const handleFillDemo = () => {
    setUsername('ayari');
    setEmail('ayari@grandazur.com');
    setPassword('ayari');
    setError(null);
    if (onToast) onToast('Demo credentials filled: ayari / ayari', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanUser && !cleanEmail) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginAuth({
        username: cleanUser,
        email: cleanEmail,
        password: cleanPass,
      });

      if (res.success && res.user) {
        if (onToast) onToast(`Welcome back, ${res.user.name}! Access granted.`, 'success');
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials. Please use username: ayari, password: ayari.');
      }
    } catch (err: any) {
      // Direct local fallback validation if network issue occurs
      if (
        (cleanUser.toLowerCase() === 'ayari' || cleanEmail.toLowerCase() === 'ayari@grandazur.com') &&
        cleanPass === 'ayari'
      ) {
        const fallbackUser: AuthUser = {
          username: 'ayari',
          name: 'Ayari',
          email: 'ayari@grandazur.com',
          role: 'General Manager',
          avatar: 'GM',
        };
        if (onToast) onToast('Welcome back, Ayari! Access granted.', 'success');
        onLoginSuccess(fallbackUser);
      } else {
        setError('Invalid credentials. Please use username: ayari, password: ayari.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthDemo = (provider: 'Google' | 'GitHub') => {
    if (onToast) {
      onToast(`${provider} OAuth integration ready. For this demo, please use username: ayari / password: ayari.`, 'info');
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex bg-[#090d16] text-white selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Background radial vignette & luxury glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 18% 45%, rgba(245, 158, 11, 0.09) 0%, transparent 55%),
            radial-gradient(circle at 82% 50%, rgba(245, 158, 11, 0.05) 0%, transparent 45%),
            var(--bg-base)
          `,
        }}
      />

      {/* Faint vertical light strip at the far left edge */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[2px] pointer-events-none opacity-80"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--brand-primary) 30%, var(--brand-primary) 70%, transparent)',
          boxShadow: '0 0 16px var(--brand-primary-glow)',
        }}
      />

      {/* Main 2-Column Split Layout */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between">
        
        {/* ==============================================================
            LEFT SCENE (Decorative Floor Lamp, Cone of Light, Plant & Fireflies)
            Visible on Desktop (>= 900px), subtle ambient backdrop on mobile
            ============================================================== */}
        <section
          aria-label="Decorative Scene"
          className="hidden lg:flex w-full lg:w-1/2 h-screen relative flex-col justify-between p-12 lg:p-16 overflow-hidden select-none"
        >
          {/* Top-Left Tagline */}
          <div className="relative z-20 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IconHotel size={18} />
              </span>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">
                Grand Azur Palace Resort & Spa
              </span>
            </div>

            <p className="text-slate-300 font-serif italic text-3xl xl:text-4xl font-light tracking-wide">
              Bright Ideas
            </p>
            <h2 className="text-5xl xl:text-6xl font-black text-white tracking-tight mt-1">
              Start <span style={{ color: 'var(--brand-primary)' }}>Here</span>
            </h2>
            <div
              className="h-[2px] mt-3 rounded-full"
              style={{
                width: '60px',
                backgroundColor: 'var(--brand-primary)',
                boxShadow: '0 0 10px var(--brand-primary-glow)',
              }}
            />
          </div>

          {/* 16 Floating Fireflies */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {FIREFLIES.map((ff, idx) => (
              <span
                key={idx}
                className="firefly absolute rounded-full"
                style={{
                  top: ff.top,
                  left: ff.left,
                  width: `${ff.size}px`,
                  height: `${ff.size}px`,
                  backgroundColor: 'var(--brand-primary)',
                  boxShadow: `0 0 8px 1px var(--brand-primary), 0 0 16px var(--brand-primary-glow)`,
                  animation: `firefly-float ${ff.duration} ease-in-out infinite`,
                  animationDelay: ff.delay,
                }}
              />
            ))}
          </div>

          {/* Artistic Floor Lamp, Ambient Light Cone & Plant Illustration */}
          <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none">
            <svg
              className="w-full h-full max-h-[85vh] overflow-visible"
              viewBox="0 0 700 800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Light Cone Radial/Linear Gradients */}
                <linearGradient id="lampConeGrad" x1="430" y1="210" x2="430" y2="760" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="var(--brand-primary)" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="var(--brand-primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
                </linearGradient>

                {/* Floor Warm Reflection Gradient */}
                <radialGradient id="floorReflection" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="var(--brand-primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
                </radialGradient>

                {/* Blur filter for soft volumetric light edges */}
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="24" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="coneBlur" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
              </defs>

              {/* Glossy Floor Horizon Line & Warm Reflection */}
              <ellipse cx="430" cy="740" rx="240" ry="45" fill="url(#floorReflection)" />
              <line x1="60" y1="740" x2="640" y2="740" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="1" />

              {/* Volumetric Light Cone from Floor Lamp */}
              <polygon
                points="420,210 440,210 640,740 220,740"
                fill="url(#lampConeGrad)"
                filter="url(#coneBlur)"
                className="lamp-glow"
                style={{ animation: 'lamp-pulse 5s ease-in-out infinite' }}
              />

              {/* Modern Black Dome Floor Lamp Architecture */}
              <g className="lamp-structure">
                {/* Lamp Base Plate */}
                <ellipse cx="500" cy="740" rx="42" ry="7" fill="#0b0f19" stroke="#1e293b" strokeWidth="2" />
                
                {/* Curved Metallic Pole */}
                <path
                  d="M500 740 L500 360 C500 240, 470 190, 430 190"
                  stroke="#111827"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M501 740 L501 360 C501 240, 471 190, 431 190"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />

                {/* Lamp Dome Shade */}
                <path
                  d="M380 210 C380 170, 480 170, 480 210 Z"
                  fill="#0b0f19"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                {/* Shade Golden Rim highlight */}
                <ellipse cx="430" cy="210" rx="50" ry="6" fill="#1e293b" stroke="var(--brand-primary)" strokeWidth="1.5" />
                {/* Bulb glowing center */}
                <circle cx="430" cy="212" r="10" fill="#ffffff" filter="url(#softGlow)" />
                <circle cx="430" cy="212" r="6" fill="var(--brand-primary)" />

                {/* Hanging Pull-cord with brass finial */}
                <line x1="465" y1="212" x2="465" y2="280" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <ellipse cx="465" cy="284" rx="3" ry="5" fill="var(--brand-primary)" />
              </g>

              {/* Leafy Plant in White Ceramic Pot (Bottom Left) */}
              <g className="potted-plant" transform="translate(130, 520)">
                {/* White Modern Fluted Pot */}
                <path
                  d="M70 170 L80 220 L130 220 L140 170 Z"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />
                <ellipse cx="105" cy="170" rx="35" ry="6" fill="#0f172a" />
                <ellipse cx="105" cy="220" rx="25" ry="4" fill="rgba(0,0,0,0.4)" />

                {/* Lush Tropical Leaves */}
                <path
                  d="M105 170 Q70 110, 40 120 C35 150, 75 165, 105 170 Z"
                  fill="#10b981"
                  stroke="#065f46"
                  strokeWidth="1.5"
                />
                <path
                  d="M105 170 Q105 75, 80 60 C65 100, 95 145, 105 170 Z"
                  fill="#059669"
                  stroke="#064e3b"
                  strokeWidth="1.5"
                />
                <path
                  d="M105 170 Q145 90, 175 100 C175 130, 135 155, 105 170 Z"
                  fill="#34d399"
                  stroke="#047857"
                  strokeWidth="1.5"
                />
                <path
                  d="M105 170 Q115 110, 140 125 C135 155, 115 165, 105 170 Z"
                  fill="#10b981"
                  stroke="#065f46"
                  strokeWidth="1.5"
                />
                <path
                  d="M105 170 Q90 130, 60 145 C65 165, 95 170, 105 170 Z"
                  fill="#047857"
                  stroke="#064e3b"
                  strokeWidth="1"
                />
              </g>
            </svg>
          </div>

          {/* Bottom Left Status/Security Footer */}
          <div className="relative z-20 text-xs text-slate-500 font-mono flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Grand Azur PMS • 256-Bit TLS Encryption</span>
          </div>
        </section>

        {/* ==============================================================
            RIGHT SECTION (Glass Login Card)
            Vertically centered on desktop, responsive padded on mobile
            ============================================================== */}
        <main className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 z-20">
          <div
            className="w-full max-w-[560px] relative animate-fade-in"
            style={{
              padding: 'clamp(28px, 5vw, 48px)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: `
                0 25px 60px -15px rgba(0, 0, 0, 0.85),
                0 -1px 20px var(--brand-primary-glow),
                0 1px 20px var(--brand-primary-glow)
              `,
            }}
          >
            {/* Header / Brand Title */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white tracking-tight leading-[1.05]">
                Welcome<br />
                <span style={{ color: 'var(--brand-primary)' }}>Back</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] font-normal">
                Enter your details to access your account
              </p>

              {/* Demo Credentials Helper Pill */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Demo Credentials: <b>ayari</b> / <b>ayari</b></span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white font-bold transition text-[11px]"
                >
                  Quick Fill
                </button>
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 animate-fade-in"
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Field 1: Username */}
              <div className="relative">
                <label htmlFor={usernameId} className="sr-only">
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-[var(--text-muted)] pointer-events-none">
                    <IconUser size={20} />
                  </span>
                  <input
                    id={usernameId}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Username (e.g. ayari)"
                    autoComplete="username"
                    required
                    className="w-full h-14 pl-14 pr-5 rounded-full text-sm text-white placeholder-[var(--text-muted)] font-medium transition focus:outline-none"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid var(--glass-border)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-primary-glow)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div className="relative">
                <label htmlFor={emailId} className="sr-only">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-[var(--text-muted)] pointer-events-none">
                    <IconMail size={20} />
                  </span>
                  <input
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Email Address (e.g. ayari@grandazur.com)"
                    autoComplete="email"
                    className="w-full h-14 pl-14 pr-5 rounded-full text-sm text-white placeholder-[var(--text-muted)] font-medium transition focus:outline-none"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid var(--glass-border)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-primary-glow)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Field 3: Password */}
              <div className="relative">
                <label htmlFor={passwordId} className="sr-only">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-[var(--text-muted)] pointer-events-none">
                    <IconLock size={20} />
                  </span>
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Password (e.g. ayari)"
                    autoComplete="current-password"
                    required
                    className="w-full h-14 pl-14 pr-12 rounded-full text-sm text-white placeholder-[var(--text-muted)] font-medium transition focus:outline-none"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid var(--glass-border)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-primary-glow)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    aria-pressed={showPassword}
                    className="absolute right-4 text-[var(--text-muted)] hover:text-white transition p-1.5 focus:outline-none"
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onToast) onToast('Password reset link sent to registered email address.', 'info');
                  }}
                  className="text-xs font-semibold hover:underline transition"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary "Sign In" Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-on-primary)',
                    boxShadow: '0 4px 20px var(--brand-primary-glow)',
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <IconArrowRight size={20} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider: OR CONTINUE WITH */}
              <div className="relative flex items-center justify-center my-6">
                <div className="flex-grow border-t border-slate-700/60" />
                <span className="flex-shrink mx-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  OR CONTINUE WITH
                </span>
                <div className="flex-grow border-t border-slate-700/60" />
              </div>

              {/* Social Login Outlined Pill Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthDemo('Google')}
                  className="h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2.5 transition border border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-500 text-white cursor-pointer"
                >
                  <IconGoogle size={18} />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthDemo('GitHub')}
                  className="h-12 rounded-full text-xs font-bold flex items-center justify-center gap-2.5 transition border border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-500 text-white cursor-pointer"
                >
                  <IconGithub size={18} />
                  <span>GitHub</span>
                </button>
              </div>

              {/* Create Account Link */}
              <p className="text-center text-xs text-[var(--text-muted)] pt-3">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (onToast) onToast('Registration portal: please contact Resort Front Desk administration.', 'info');
                  }}
                  className="font-bold hover:underline transition ml-1"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Create account
                </button>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
