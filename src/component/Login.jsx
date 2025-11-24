import React, { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [linkSent, setLinkSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page reload
    setErrorMsg(null);

    if (!email) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Set this to your game URL if needed, e.g., window.location.origin
          emailRedirectTo: window.location.origin, 
        },
      });

      if (error) throw error;

      // Instead of onLogin(), we show the "Check Email" success state
      setLinkSent(true);
    } catch (error) {
      setErrorMsg(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // VIEW: Success / Check Email State
  if (linkSent) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono px-4">
        <div className="bg-slate-800 p-8 rounded-xl w-full max-w-sm shadow-2xl text-center border border-slate-700">
          <div className="flex justify-center mb-4">
            {/* Mail Icon */}
            <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Check your inbox!</h2>
          <p className="text-slate-400 mb-6">
            We sent a magic login link to <span className="text-yellow-400 font-bold">{email}</span>.
          </p>
          <button
            onClick={() => setLinkSent(false)}
            className="text-sm text-slate-500 hover:text-white underline transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // VIEW: Login Form
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono px-4">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-sm shadow-2xl border border-slate-700">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Login to Play</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your email for a magic link</p>
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm flex items-center gap-2">
             <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="player@example.com"
              className="w-full p-3 rounded bg-slate-900 border border-slate-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all text-white placeholder-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`w-full p-3 rounded font-bold transition-all duration-200 flex items-center justify-center gap-2
              ${loading 
                ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                : "bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20 transform hover:-translate-y-0.5"
              }`}
            disabled={loading}
          >
            {loading ? (
              <>
                {/* Loading Spinner SVG */}
                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Link...
              </>
            ) : (
              "Get Magic Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}