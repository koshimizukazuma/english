"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const signIn = async () => {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + "/quiz" }
    });
    setSent(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        style={{ padding: 10 }}
      />
      <button onClick={signIn}>Send Magic Link</button>
      {sent && <p>Check your email!</p>}
    </div>
  );
}