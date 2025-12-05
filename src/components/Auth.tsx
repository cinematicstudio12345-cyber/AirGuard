import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, createUserProfile } from '../services/firebase';
import { User } from '../types';

interface AuthProps {
  onLogin: (u: User) => void; // Kept for immediate UI update, though App.tsx listener handles state
}

const AuthScreen: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'REGISTER') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create Firestore Profile
        await createUserProfile(userCredential.user.uid, { name, email });
        
        // UI update handled by onAuthStateChanged in App.tsx
      } 
      else if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, email, password);
      } 
      else if (mode === 'FORGOT') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Password reset email sent! Check your inbox.");
      }
    } catch (err: any) {
      console.error(err);
      let msg = "An error occurred.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.code === 'auth/user-not-found') msg = "User not found.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background Animation */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
       </div>

       <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          
          <h1 className="text-3xl font-black text-center text-white mb-2 tracking-tight">
            {mode === 'LOGIN' ? 'Welcome Back' : mode === 'REGISTER' ? 'Join AirGuard' : 'Reset Password'}
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            {mode === 'LOGIN' ? 'Monitor your environment in real-time.' : mode === 'REGISTER' ? 'Create an account to start tracking.' : 'Enter your email to receive a reset link.'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'FORGOT' && (
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg border border-green-500/20">
                <ShieldCheck size={16} />
                {successMsg}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {mode === 'LOGIN' ? 'Sign In' : mode === 'REGISTER' ? 'Create Account' : 'Send Link'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
             {mode === 'LOGIN' ? (
               <>
                 <button onClick={() => { setMode('FORGOT'); setError(null); }} className="text-cyan-400 hover:underline">Forgot Password?</button>
                 <div className="mt-4">
                   Don't have an account? <button onClick={() => { setMode('REGISTER'); setError(null); }} className="text-white font-bold hover:underline">Sign Up</button>
                 </div>
               </>
             ) : (
               <div className="mt-4">
                 Already have an account? <button onClick={() => { setMode('LOGIN'); setError(null); }} className="text-white font-bold hover:underline">Sign In</button>
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default AuthScreen;