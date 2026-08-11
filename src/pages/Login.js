import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// 1chatting — Admin Login (light theme)
// Canvas: near-white cool lavender. Ink: deep plum-black (not pure black).
// Accents: saturated coral + indigo-violet + a mint third note for variety.
// Signature: a contained "message bubble" cluster — bounded to its own box
// so it never collides with copy (fixes the overlap from the dark version).
// ---------------------------------------------------------------------------

const RESEND_SECONDS = 45;

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  const otp = otpDigits.join('');

  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const triggerSendOtp = async () => {
    setLoading(true);
    try {
      await sendOtp(mobile);
      toast.success('OTP sent successfully (Mock: 123456)');
      setStep(2);
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    triggerSendOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOtp(mobile, otp);
      if (!res.error && res.token) {
        const userData = {
          token: res.token,
          username: res.username,
          profile: res.profile || {},
        };
        login(userData);
        toast.success('Logged in successfully');
        navigate('/');
      } else {
        toast.error(res.message || 'Invalid OTP');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[idx] = '';
      setOtpDigits(next);
      return;
    }
    const chars = clean.split('');
    const next = [...otpDigits];
    let cursor = idx;
    for (const ch of chars) {
      if (cursor > 5) break;
      next[cursor] = ch;
      cursor += 1;
    }
    setOtpDigits(next);
    const focusIdx = Math.min(cursor, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF9FD] text-[#221C35] font-[Inter]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap');

        @keyframes floatY {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,-16px,0) rotate(3deg); }
        }
        @keyframes floatYSlow {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,14px,0) rotate(-2deg); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(255,106,77,0.28); }
          70% { box-shadow: 0 0 0 16px rgba(255,106,77,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,106,77,0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to { background-position: 60px 60px; }
        }
        .brand-grid {
          background-image: radial-gradient(rgba(108,76,224,0.10) 1px, transparent 1px);
          background-size: 26px 26px;
          animation: gridDrift 16s linear infinite;
        }
        .bubble { animation: floatY 7s ease-in-out infinite; }
        .bubble-slow { animation: floatYSlow 9s ease-in-out infinite; }
        .logo-pulse { animation: pulseRing 2.6s ease-out infinite; }
        .panel-in { animation: fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .digit-in { animation: popIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .bubble, .bubble-slow, .logo-pulse, .brand-grid, .panel-in, .digit-in {
            animation: none !important;
          }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* Brand panel — desktop only, condensed strip on mobile */}
      {/* ------------------------------------------------------------- */}
      <div className="relative hidden md:flex md:w-1/2 overflow-hidden bg-gradient-to-br from-[#F1EDFC] to-[#FAF9FD] border-r border-[#EBE7F7]">
        <div className="absolute inset-0 brand-grid" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="logo-pulse relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6A4D] to-[#6C4CE0] flex items-center justify-center font-[Sora] font-extrabold text-lg text-white">
              1
            </div>
            <span className="font-[Sora] font-bold text-xl tracking-tight">1chatting</span>
          </div>

          {/* text + decorative cluster live in their own columns so they can never overlap */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-8 xl:gap-6">
            <div className="max-w-[19rem]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#E45A3C] font-bold mb-4">
                Admin Console
              </p>
              <h1 className="font-[Sora] font-extrabold text-4xl xl:text-[2.5rem] leading-[1.12] mb-5 text-[#1A1530]">
                Every conversation,<br />under one roof.
              </h1>
              <p className="text-[#5F5877] text-sm leading-relaxed">
                Sign in to moderate rooms, manage users, and keep 1chatting
                running smoothly — verified by a one-time code sent straight
                to your phone.
              </p>
            </div>

            {/* bounded bubble cluster: fixed box, bubbles positioned only within it */}
            <div className="relative w-full h-40 xl:w-40 xl:h-48 shrink-0">
              <div className="bubble absolute top-0 right-6 xl:right-2 w-14 h-14 rounded-2xl rounded-bl-sm bg-[#FF6A4D] shadow-[0_16px_34px_-12px_rgba(255,106,77,0.55)]" />
              <div className="bubble-slow absolute top-10 right-24 xl:right-0 xl:top-16 w-9 h-9 rounded-xl rounded-br-sm bg-[#6C4CE0] shadow-[0_16px_34px_-12px_rgba(108,76,224,0.5)]" style={{ animationDelay: '0.4s' }} />
              <div className="bubble absolute bottom-2 right-2 xl:right-10 xl:bottom-0 w-11 h-11 rounded-xl rounded-bl-sm bg-[#23C9A7] shadow-[0_16px_34px_-12px_rgba(35,201,167,0.45)]" style={{ animationDelay: '1s' }} />
            </div>
          </div>

          <p className="text-xs text-[#8E86A6]">
            © {new Date().getFullYear()} 1chatting. Internal use only.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Form panel */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10 sm:px-10 bg-[#FAF9FD]">
        {/* mobile brand strip */}
        <div className="md:hidden flex items-center gap-3 mb-10 justify-center w-full max-w-[400px]">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6A4D] to-[#6C4CE0] flex items-center justify-center font-[Sora] font-extrabold text-sm text-white">
            1
          </div>
          <span className="font-[Sora] font-bold text-3xl tracking-tight">1chatting</span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-[#8E86A6] border border-[#E6E2F3] rounded-full px-2.5 py-1">
            Admin
          </span>
        </div>

        <div key={step} className="panel-in w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="font-[Sora] font-bold text-2xl mb-1.5 text-[#1A1530]">
              {step === 1 ? 'Welcome back' : 'Verify your number'}
            </h2>
            <p className="text-sm text-[#6B6380]">
              {step === 1
                ? 'Enter your registered mobile number to receive a login code.'
                : (
                  <>Code sent to <span className="text-[#1A1530] font-medium">{mobile}</span></>
                )}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="mobile" className="block text-xs font-semibold uppercase tracking-wide text-[#6B6380] mb-2">
                  Phone number
                </label>
                <div className="relative group">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8E86A6] group-focus-within:text-[#E45A3C] transition-colors text-sm">
                    +91
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-14 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500 outline-none transition-all duration-200  focus:ring-2 focus:ring-[#FF6A4D]/12 shadow-[0_1px_2px_rgba(34,28,53,0.04)]"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !mobile}
                className="group relative w-full py-3.5 px-4 rounded-xl bg-blue-500 text-white font-[Sora] font-bold text-sm tracking-wide overflow-hidden transition-all duration-200 hover:from-[#F04B32] hover:to-[#D6361F] hover:shadow-[0_10px_28px_-8px_rgba(198,48,28,0.55)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {loading ? 'Sending code…' : 'Send OTP'}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="digit-in w-11 sm:w-12 h-13 sm:h-14 py-3 rounded-xl bg-white border border-[#E4E0F2] text-center text-lg font-[JetBrainsMono] font-semibold text-[#221C35] outline-none transition-all duration-200 focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 shadow-[0_1px_2px_rgba(34,28,53,0.04)]"
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      required
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#9A93B0]">Mock code for testing: 123456</p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6C4CE0] to-[#5A3DD1] text-white font-[Sora] font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-[0_10px_28px_-8px_rgba(90,61,209,0.5)] active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {loading ? 'Verifying…' : 'Verify & login'}
                </span>
              </button>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  className="text-[#6B6380] hover:text-[#221C35] font-medium transition-colors"
                >
                  ← Change number
                </button>

                <button
                  type="button"
                  disabled={resendIn > 0 || loading}
                  onClick={triggerSendOtp}
                  className="text-[#E45A3C] hover:text-[#C94A2E] font-semibold transition-colors disabled:text-[#B4AECB] disabled:cursor-not-allowed"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-12 text-xs text-[#9A93B0] text-center">
          Trouble signing in? Contact your workspace owner.
        </p>
      </div>
    </div>
  );
}

export default Login;