
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Mail, Phone, Loader2, Lock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from "sonner";
import "sonner/dist/styles.css";
import { useAuth } from "@/contexts/AuthContext";
import {
  signInWithEmail,
  signUpWithEmail,
  sendPhoneOtp,
  confirmPhoneOtp,
  resetRecaptcha,
} from "@/firebase/authApi";
import MagneticButton from "@/components/MagneticButton";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [method, setMethod] = useState("email"); // email | phone
  const panelRef = useRef(null);

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const [busy, setBusy] = useState(false);


  useEffect(() => {
    if (user && !loading) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Cinematic stagger reveal
  useEffect(() => {
    if (!panelRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-anim='stagger']", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
      });
    }, panelRef);
    return () => ctx.revert();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      toast.success("Welcome to NetNest");
    } catch (err) {
      if (
        mode === "login" &&
        (err?.code === "auth/invalid-credential" ||
         err?.code === "auth/wrong-password" ||
         err?.code === "auth/user-not-found" ||
         err?.code === "auth/invalid-email")
      ) {
        toast.error("Email or password wrong");
      } else {
        toast.error(err?.message?.replace("Firebase: ", "") || "Authentication failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await sendPhoneOtp(phone.trim());
      setConfirmation(result);
      toast.success("OTP sent");
    } catch (err) {
      resetRecaptcha();
      toast.error(err?.message?.replace("Firebase: ", "") || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    try {
      await confirmPhoneOtp(confirmation, otp.trim());
      toast.success("Signed in");
    } catch (err) {
      toast.error(err?.message?.replace("Firebase: ", "") || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] relative overflow-hidden px-4">
      {/* Background glow + texture */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#DC143C]/10 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#DC143C]/[0.07] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div
        ref={panelRef}
        data-testid="auth-panel"
        className="relative w-full max-w-md backdrop-blur-3xl bg-[#1A1A1A]/40 border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.6)] rounded-2xl p-8"
      >
        <div data-anim="stagger" className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#DC143C] shadow-[0_0_10px_rgba(220,20,60,0.7)]" />
          <span className="text-xs uppercase tracking-[0.3em] text-[#8A8A8E]">
            NetNest &middot; Premium Tasks
          </span>
        </div>
        <h1
          data-anim="stagger"
          className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tighter text-white mb-2"
        >
          {mode === "login" ? "Welcome back." : "Create account."}
        </h1>
        <p data-anim="stagger" className="text-[#8A8A8E] mb-8">
          {mode === "login"
            ? "Sign in to orchestrate your day."
            : "Build your first list in seconds."}
        </p>

        {/* Mode tabs */}
        <div data-anim="stagger" className="flex gap-2 mb-6 bg-white/[0.03] p-1 rounded-full">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              data-testid={`tab-${m}`}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-[#DC143C] text-white shadow-[0_0_18px_rgba(220,20,60,0.45)]"
                  : "text-[#8A8A8E] hover:text-white"
              }`}
            >
              {m === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Method tabs */}
        <div data-anim="stagger" className="flex gap-4 mb-6 border-b border-white/5">
          {[
            { id: "email", label: "Email", Icon: Mail },
            { id: "phone", label: "Phone OTP", Icon: Phone },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                setMethod(id);
                setConfirmation(null);
              }}
              data-testid={`method-${id}`}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wide transition-colors relative ${
                method === id ? "text-white" : "text-[#555] hover:text-[#8A8A8E]"
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
              {method === id && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#DC143C] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Email form */}
        {method === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3" data-anim="stagger">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                data-testid="email-input"
                className="w-full bg-[#1A1A1A]/60 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                data-testid="password-input"
                className="w-full bg-[#1A1A1A]/60 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <MagneticButton
              type="submit"
              disabled={busy}
              data-testid="email-submit-btn"
              className="w-full bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(220,20,60,0.5)] flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === "login" ? "Sign In" : "Create Account"}
              <ChevronRight size={16} />
            </MagneticButton>
          </form>
        )}

        {/* Phone form */}
        {method === "phone" && (
          <div className="space-y-3" data-anim="stagger">
            {!confirmation ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15555550123 (E.164 format)"
                    data-testid="phone-input"
                    className="w-full bg-[#1A1A1A]/60 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none"
                  />
                </div>
                <MagneticButton
                  type="submit"
                  disabled={busy}
                  data-testid="send-otp-btn"
                  className="w-full bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(220,20,60,0.5)] flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                  Send OTP
                </MagneticButton>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  data-testid="otp-input"
                  className="w-full bg-[#1A1A1A]/60 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-[0.4em] text-lg placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none"
                />
                <MagneticButton
                  type="submit"
                  disabled={busy}
                  data-testid="verify-otp-btn"
                  className="w-full bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(220,20,60,0.5)] flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                  Verify & Sign In
                </MagneticButton>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmation(null);
                    resetRecaptcha();
                  }}
                  className="w-full text-xs text-[#8A8A8E] hover:text-white py-2"
                >
                  Use a different number
                </button>
              </form>
            )}
            <p className="text-xs text-[#555] text-center mt-2">
              Phone Auth requires Blaze plan + Phone provider enabled.
            </p>
          </div>
        )}

        {/* Invisible reCAPTCHA target */}
        <div id="recaptcha-container" />
      </div>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-[#555] tracking-wide">
        &copy; {new Date().getFullYear()} NetNest. All rights reserved.
      </footer>
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
