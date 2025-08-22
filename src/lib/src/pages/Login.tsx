import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) return <p>Проверь почту: мы отправили ссылку для входа</p>;

  return (
    <div style={{maxWidth: 360, margin: '40px auto'}}>
      <h1>Вход</h1>
      <input
        placeholder="email@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{width:'100%', padding:12, margin:'12px 0'}}
      />
      <button onClick={sendLink} style={{padding:12, width:'100%'}}>Войти</button>
      {error && <p style={{color:'crimson'}}>{error}</p>}
    </div>
  );
}
