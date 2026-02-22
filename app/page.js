"use client";

import { useEffect, useMemo, useState } from "react";

const QUESTIONS = [
  {
    id: "r-001",
    type: "choice",
    en: "Could we get separate checks, please?",
    jpChoices: ["お会計は別々でお願いします", "お会計を先にお願いします", "予約を変更したいです", "おすすめは何ですか？"],
    correctIndex: 0,
    note: "Separate checks = 別会計",
  },
  {
    id: "t-001",
    type: "blank",
    en: "I'd like to make a ____ for two.",
    blankChoices: ["reservation", "decision", "problem", "picture"],
    correctIndex: 0,
    jpHint: "（ヒント）予約",
    answerText: "reservation",
  },
];

function load(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function QuizPage() {
  const [index, setIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);

  const q = QUESTIONS[index];

  useEffect(() => {
    const state = load("tep_state", null);
    if (state) {
      setIndex(state.index ?? 0);
      setXp(state.xp ?? 0);
      setStreak(state.streak ?? 0);
    }
  }, []);

  useEffect(() => {
    save("tep_state", { index, xp, streak });
  }, [index, xp, streak]);

  const choices = useMemo(() => {
    if (q.type === "choice") return q.jpChoices;
    return q.blankChoices;
  }, [q]);

  const prompt = useMemo(() => {
    if (q.type === "choice") return q.en;
    return q.en;
  }, [q]);

  const select = (i) => {
    if (result) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    setResult(ok ? "ok" : "ng");

    if (ok) setXp((v) => v + 10);

    // 次へ（1.0秒後）
    setTimeout(() => {
      setPicked(null);
      setResult(null);
      setIndex((v) => (v + 1) % QUESTIONS.length);
    }, 900);
  };

  // Streak：1日1回正解したら+1（超簡易）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem("tep_last_day");
    if (last !== today) {
      // 日付が変わったら、今日の初回正解で更新するためリセット準備だけ
      // （厳密な連続判定は後で）
    }
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Travel English（無料）</h1>
        <div style={{ fontSize: 14 }}>
          XP: <b>{xp}</b>　Streak: <b>{streak}</b>
        </div>
      </header>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{q.type === "choice" ? "日本語を選ぶ" : "空欄を埋める"}</div>

        <div style={{ fontSize: 20, marginTop: 10, lineHeight: 1.4 }}>
          {q.type === "blank" ? (
            <>
              {q.en.split("____")[0]}
              <span style={{ padding: "2px 10px", borderRadius: 999, background: "#f1f5f9" }}>____</span>
              {q.en.split("____")[1]}
            </>
          ) : (
            prompt
          )}
        </div>

        {q.type === "blank" && (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>{q.jpHint}</div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {choices.map((c, i) => {
            const isPicked = picked === i;
            const isCorrect = result && i === q.correctIndex;
            const isWrongPicked = result === "ng" && isPicked && i !== q.correctIndex;

            const bg = isCorrect ? "#dcfce7" : isWrongPicked ? "#fee2e2" : "#fff";
            const bd = isCorrect ? "#22c55e" : isWrongPicked ? "#ef4444" : "#e5e7eb";

            return (
              <button
                key={i}
                onClick={() => select(i)}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 12,
                  border: `1px solid ${bd}`,
                  background: bg,
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          {q.note ? `メモ：${q.note}` : "毎日3問だけでもOK。"}
        </div>
      </div>

      <footer style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        YouTubeから来た人向け：毎日更新で語彙が増えます。
      </footer>
    </div>
  );
}