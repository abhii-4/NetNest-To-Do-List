import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Mail, Loader2, Lock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from "sonner";
import "sonner/dist/styles.css";
import { useAuth } from "@/contexts/AuthContext";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from "@/firebase/authApi";
import MagneticButton from "@/components/MagneticButton";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const panelRef = useRef(null);

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

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

  // Dynamically initialize and render Google reCAPTCHA v2 checkbox
  useEffect(() => {
    let interval = null;
    const initRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.render) {
        try {
          const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
          window.grecaptcha.render("email-recaptcha", {
            sitekey: siteKey,
            callback: (token) => {
              setRecaptchaToken(token);
            },
            "expired-callback": () => {
              setRecaptchaToken(null);
            },
          });
          clearInterval(interval);
        } catch (e) {
          console.error("reCAPTCHA rendering issue:", e);
          clearInterval(interval);
        }
      }
    };
    interval = setInterval(initRecaptcha, 300);
    return () => {
      clearInterval(interval);
      const container = document.getElementById("email-recaptcha");
      if (container) container.innerHTML = "";
      setRecaptchaToken(null);
    };
  }, []);

  // Reset reCAPTCHA checkbox state when switching between Login and Sign Up modes
  useEffect(() => {
    if (window.grecaptcha && window.grecaptcha.reset) {
      try {
        window.grecaptcha.reset();
        setRecaptchaToken(null);
      } catch (e) {
        /* noop */
      }
    }
  }, [mode]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast.error("Please solve the reCAPTCHA first.");
      return;
    }
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
      // Reset reCAPTCHA on failure
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        setRecaptchaToken(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome to NetNest");
    } catch (err) {
      console.error("Google login error:", err);
      toast.error(err?.message?.replace("Firebase: ", "") || "Google login failed");
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

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4" data-anim="stagger">
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

          {/* Google reCAPTCHA v2 Checkbox Container */}
          <div className="flex justify-center py-2" data-anim="stagger">
            <div id="email-recaptcha" data-testid="recaptcha-container" />
          </div>

          <MagneticButton
            type="submit"
            disabled={busy || !recaptchaToken}
            data-testid="email-submit-btn"
            className="w-full bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(220,20,60,0.5)] flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {mode === "login" ? "Sign In" : "Create Account"}
            <ChevronRight size={16} />
          </MagneticButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6" data-anim="stagger">
          <span className="h-[1px] flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-[#555]">or</span>
          <span className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Google Sign-In Button */}
        <div data-anim="stagger">
          <MagneticButton
            type="button"
            onClick={handleGoogleSubmit}
            disabled={busy}
            data-testid="google-signin-btn"
            className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_24px_rgba(255,255,255,0.05)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.57 14.97 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.82 2.96C6.22 7.54 8.89 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.96h3.82c2.23-2.05 3.61-5.07 3.61-8.64z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 10.46a7.16 7.16 0 010 3.08l-3.82 2.96A11.96 11.96 0 011 12c0-1.57.3-3.07.82-4.46l3.5 2.92z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.82-2.96c-1.1.74-2.52 1.18-4.14 1.18-3.11 0-5.78-2.5-6.68-5.42L1.5 15.8C3.4 19.65 7.35 22 12 23z"
              />
            </svg>
            Continue with Google
          </MagneticButton>
        </div>
      </div>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-[#555] tracking-wide">
        &copy; {new Date().getFullYear()} NetNest. All rights reserved.
      </footer>
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
