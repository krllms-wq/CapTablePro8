// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const magicLink = async () => {
    setErr(null); setMsg(null); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'https://captablepro8.pages.dev' // редирект назад на сайт
      }
    });
    setLoading(false);
    if (error) setErr(error.message);
    else { setSent(true); setMsg('Письмо отправлено. Проверь почту (включая Spam/Promotions).'); }
  };

  const signUpWithPassword = async () => {
    setErr(null); setMsg(null); setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setLoading(false);
    if (error) setErr(error.message);
    else setMsg('Аккаунт создан. Теперь нажми «Войти паролем».');
  };

  const signInWithPassword = async () => {
    setErr(null); setMsg(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) setErr(error.message);
    else window.location.href = '/'; // после входа на главную/дешборд
  };

  return (
    // ВАЖНО: запрещаем submit формы, чтобы не было 405 от Pages
    <form onSubmit={(e) => e.preventDefault()} style={{maxWidth: 420, margin: '48px auto', fontFamily: 'system-ui, sans-serif'}}>
      <h1 style={{marginBottom: 16}}>Вход</h1>

      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@domain.com"
        style={{width:'100%', padding:12, margin:'6px 0 12px', border:'1px solid #ccc', borderRadius:8}}
      />

      {/* Кнопка magic-link */}
      <button
        type="button"               // ← чтобы не было submit
        onClick={magicLink}
        disabled={!email || loading}
        style={{padding:12, width:'100%', borderRadius:8}}
      >
        Отправить magic‑link на e‑mail
      </button>

      {sent && <p style={{marginTop:8}}>Мы отправили письмо со ссылкой для входа.</p>}

      <hr style={{margin:'24px 0'}}/>

      {/* Парольный вход (временный/тестовый) */}
      <label>Пароль</label>
      <input
        type="password"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        placeholder="Придумай пароль"
        style={{width:'100%', padding:12, margin:'6px 0 12px', border:'1px solid #ccc', borderRadius:8}}
      />
      <div style={{display:'grid', gap:8}}>
        <button
          type="button"             // ← чтобы не было submit
          onClick={signUpWithPassword}
          disabled={!email || !pwd || loading}
          style={{padding:12, borderRadius:8}}
        >
          Зарегистрироваться (создать аккаунт)
        </button>
        <button
          type="button"             // ← чтобы не было submit
          onClick={signInWithPassword}
          disabled={!email || !pwd || loading}
          style={{padding:12, borderRadius:8}}
        >
          Войти паролем
        </button>
      </div>

      {msg && <p style={{color:'#0a7a28', marginTop:12}}>{msg}</p>}
      {err && <p style={{color:'#c20d0d', marginTop:12}}>{err}</p>}
    </form>
  );
}
