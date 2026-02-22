"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";

const questions = [
  {
    prompt: "I'd like to make a reservation.",
    choices: ["予約したいです", "注文したいです", "支払います", "帰ります"],
    answer: 0
  }
];

export default function QuizPage() {
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (!session) {
    return <div style={{ padding: 40 }}><a href="/login">Login required</a></div>;
  }

  const q = questions[current];

  const answer = (index) => {
    if (index === q.answer) setScore(score + 10);
    setCurrent((current + 1) % questions.length);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>{q.prompt}</h2>
      <p>XP: {score}</p>
      {q.choices.map((c, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.95 }}
          onClick={() => answer(i)}
          style={{ display: "block", margin: "10px 0", padding: 10 }}
        >
          {c}
        </motion.button>
      ))}
    </div>
  );
}