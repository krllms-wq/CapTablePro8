// src/pages/Login2.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login2() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safe = (fn: () => Promise<void>) => async () => {
    setErr(null); setMsg(null); setLoading(true);
    try { await fn(); } catch (e:any) { setErr(String(e?.message || e)); }
    finally { setLoading(false); }
  };

  const signUp = safe(async () => {
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    if (error) setErr(error.message); else setMsg('Аккаунт создан. Теперь нажми «Войти паролем».');
  });

  const signIn = safe(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    if (error) setErr(error.message); else { setMsg('Успех! Переходим на главную…'); window.location.href = '/'; }
  });

  const magic = safe(async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: 'https://captablepro8.pages.dev' }
    });
    if (error) setErr(error.message); else setMsg('Письмо отправлено. Проверь почту.');
  });

  return (
    <div style={{maxWidth: 420, margin: '48px auto', fontFamily: 'system-ui, sans-serif'}}
         onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
      <h1 style={{marginBottom: 16}}>Вход (login2)</h1>

      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@domain.com"
        style={{width:'100%', padding:12, margin:'6px 0 12px', border:'1px solid #ccc', borderRadius:8}}
      />

      <label>Пароль</label>
      <input
        type="password"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        placeholder="Пароль"
        style={{width:'100%', padding:12, margin:'6px 0 12px', border:'1px solid #ccc', borderRadius:8}}
      />

      <div style={{display:'grid', gap:8, marginTop:8}}>
        <button type="button" onClick={signUp}  disabled={!email || !pwd || loading} style={{padding:12, borderRadius:8}}>
          Зарегистрироваться (пароль)
        </button>
        <button type="button" onClick={signIn} disabled={!email || !pwd || loading} style={{padding:12, borderRadius:8}}>
          Войти паролем
        </button>
        <button type="button" onClick={magic}  disabled={!email || loading}       style={{padding:12, borderRadius:8}}>
          Отправить magic‑link
        </button>
      </div>

      {msg && <p style={{color:'#0a7a28', marginTop:12}}>{msg}</p>}
      {err && <p style={{color:'#c20d0d', marginTop:12}}>{err}</p>}
    </div>
  );
}
