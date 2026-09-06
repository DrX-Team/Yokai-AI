import { useState } from 'react';
import { supabase } from './lib/supabase';

function Mascot({small = false}) { return <div className={`mascot ${small ? 'small' : ''}`}><i className="horn left-1"/><i className="horn right-1"/><b className="eye left-2.5"/><b className="eye right-2.5"/><span className="smile"/></div>; }
function Glass({children, className = ''}) { return <section className={`glass ${className}`}>{children}</section>; }
function Button({children, className = '', disabled = false}) { return <button type="submit" disabled={disabled} className={`primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>{children}</button>; }

function Field({label, placeholder, type = 'text', value, onChange}) {
  return <label className="mb-4 block text-xs font-semibold">{label}<div className="mt-2 rounded-xl border border-white/80 bg-white/40 px-4 py-3"><input required type={type} placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-transparent outline-none placeholder:text-slate-400" /></div></label>;
}

export default function ConnectedAuth({mode, setMode, enter}) {
  const forgot = mode === 'forgot';
  const [form, setForm] = useState({name: '', email: '', password: '', confirmPassword: ''});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const update = field => event => setForm({...form, [field]: event.target.value});
  const googleSignIn = async () => {
    setMessage('');
    if (!supabase) { setMessage('Connect your Supabase project with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.'); return; }
    const {error} = await supabase.auth.signInWithOAuth({provider: 'google', options: {redirectTo: window.location.origin}});
    if (error) setMessage(error.message);
  };
  const submit = async event => {
    event.preventDefault();
    setMessage('');
    if (!supabase) { setMessage('Connect your Supabase project with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setMessage('Enter a valid email address.'); return; }
    if (!forgot && form.password.length < 6) { setMessage('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && form.password !== form.confirmPassword) { setMessage('Passwords do not match.'); return; }
    setBusy(true);
    try {
      let result;
      if (forgot) result = await supabase.auth.resetPasswordForEmail(form.email, {redirectTo: window.location.origin});
      else if (mode === 'signup') result = await supabase.auth.signUp({email: form.email, password: form.password, options: {data: {full_name: form.name}}});
      else result = await supabase.auth.signInWithPassword({email: form.email, password: form.password});
      if (result.error) { setMessage(result.error.message); return; }
      if (forgot) { setMessage('Check your email for a password reset link.'); return; }
      if (mode === 'signup' && !result.data.session) { setMessage('Check your email to confirm your account.'); return; }
      enter(result.data.session);
    } catch { setMessage('Unable to reach Supabase. Check your connection and try again.'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen p-5"><div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-6xl items-center gap-10 lg:grid-cols-2"><div className="hidden text-center lg:block"><Mascot/><h1 className="mt-8 font-hand text-5xl font-normal">{forgot?'Forgot your password?':mode==='signup'?"Let’s create your Yokai space! ✨":'Welcome back! 👋'}</h1><p className="mt-2 text-slate-500">{forgot?'No worries. Yokai will help you get back in. ✨':mode==='signup'?'One place for all your documents and AI-powered edits.':'Let’s get back to your documents.'}</p></div><Glass className="mx-auto w-full max-w-md rounded-[30px] p-8"><form onSubmit={submit}><div className="mb-6 flex items-center gap-3 lg:hidden"><Mascot small/><b className="font-hand text-3xl">Yokai <em className="text-violet-600">AI</em></b></div><p className="eyebrow">YOUR DOCUMENT ASSISTANT</p><h2 className="font-hand text-4xl font-normal">{forgot?'Reset your password':mode==='signup'?'Create your account':'Sign in to Yokai AI'}</h2><p className="mb-6 text-sm text-slate-500">{forgot?'Enter your email and we’ll send a reset link.':mode==='signup'?'Start filling documents with AI magic.':'Continue your document journey. ✨'}</p>{mode==='signup'&&<Field label="Full Name" placeholder="Your name" value={form.name} onChange={update('name')}/>}<Field label="Email" placeholder="you@example.com" type="email" value={form.email} onChange={update('email')}/>{!forgot&&<><Field label="Password" placeholder="Enter your password" type="password" value={form.password} onChange={update('password')}/>{mode==='signup'&&<Field label="Confirm Password" placeholder="Re-enter your password" type="password" value={form.confirmPassword} onChange={update('confirmPassword')}/>}</>}{mode==='signup'&&<label className="my-4 block text-xs"><input type="checkbox" required /> I agree to the Terms of Service and Privacy Policy</label>}{message&&<p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}<Button className="w-full">{busy?'Please wait...':forgot?'Send Reset Link →':mode==='signup'?'Create Account ✨':'Sign In →'}</Button>{mode==='signin'&&<button type="button" onClick={()=>setMode('forgot')} className="mt-4 block w-full text-xs text-violet-600">Forgot password?</button>}{!forgot&&<><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-violet-900/10"/>or continue with<span className="h-px flex-1 bg-violet-900/10"/></div><button type="button" className="secondary w-full rounded-xl py-3">G &nbsp; Continue with Google</button></>}<p className="mt-7 text-center text-xs text-slate-500">{forgot?<button type="button" onClick={()=>setMode('signin')} className="text-violet-600">← Back to Sign In</button>:mode==='signin'?<>Don’t have an account? <button type="button" onClick={()=>setMode('signup')} className="text-violet-600">Create one →</button></>:<>Already have an account? <button type="button" onClick={()=>setMode('signin')} className="text-violet-600">Sign in →</button></>}</p></form></Glass></div></div>;
}