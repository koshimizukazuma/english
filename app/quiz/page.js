"use client";

import { useEffect, useMemo, useState } from "react";

const CATEGORIES = {
  restaurant: "🍽 レストラン",
  airport: "✈ 空港",
  hotel: "🏨 ホテル",
  sightseeing: "🗺 観光",
  transport: "🚕 移動",
};

// Built-in questions (sample). Add more via CSV on the top page.
const BUILTIN = [
  // --- Restaurant ---
  { id: "r-001", cat: "restaurant", type: "choice", en: "Could we get separate checks, please?",
    choices: ["お会計は別々でお願いします", "おすすめは何ですか？", "水をください", "禁煙席はありますか？"], answer: 0, note: "Separate checks = 別会計" },
  { id: "r-002", cat: "restaurant", type: "blank", en: "I'd like to make a ____ for two.",
    choices: ["reservation", "decision", "problem", "picture"], answer: 0, note: "make a reservation = 予約する" },
  { id: "r-003", cat: "restaurant", type: "choice", en: "Could you recommend something?",
    choices: ["何かおすすめはありますか？", "お会計お願いします", "席を変えたいです", "持ち帰りできますか？"], answer: 0, note: "" },

  // --- Airport ---
  { id: "a-001", cat: "airport", type: "choice", en: "Where is the check-in counter for ANA?",
    choices: ["ANAのチェックインカウンターはどこですか？", "搭乗口はどこですか？", "荷物を受け取りたいです", "両替はどこですか？"], answer: 0, note: "" },
  { id: "a-002", cat: "airport", type: "blank", en: "My flight has been ____.",
    choices: ["delayed", "delicious", "decided", "delivered"], answer: 0, note: "delayed = 遅延" },
  { id: "a-003", cat: "airport", type: "choice", en: "Do I need to take my laptop out?",
    choices: ["ノートPCは取り出す必要がありますか？", "荷物を預けたいです", "搭乗券をなくしました", "ゲートが変更になりました"], answer: 0, note: "" },

  // --- Hotel ---
  { id: "h-001", cat: "hotel", type: "choice", en: "I'd like to check in.",
    choices: ["チェックインしたいです", "チェックアウトしたいです", "部屋を変えたいです", "タオルをください"], answer: 0, note: "" },
  { id: "h-002", cat: "hotel", type: "blank", en: "Could I get an extra ____?",
    choices: ["towel", "tower", "toilet", "token"], answer: 0, note: "extra towel = 追加のタオル" },
  { id: "h-003", cat: "hotel", type: "choice", en: "The air conditioner isn't working.",
    choices: ["エアコンが動きません", "鍵が見つかりません", "Wi‑Fiが遅いです", "静かな部屋がいいです"], answer: 0, note: "" },

  // --- Sightseeing ---
  { id: "s-001", cat: "sightseeing", type: "choice", en: "How long does it take to get there?",
    choices: ["そこまでどのくらいかかりますか？", "いくらですか？", "写真を撮ってもらえますか？", "おすすめはありますか？"], answer: 0, note: "" },
  { id: "s-002", cat: "sightseeing", type: "blank", en: "Could you take a ____ of us?",
    choices: ["photo", "phone", "phrase", "path"], answer: 0, note: "" },

  // --- Transport ---
  { id: "t-001", cat: "transport", type: "choice", en: "I'll get off here.",
    choices: ["ここで降ります", "ここで乗ります", "次で降ります", "止まってください"], answer: 0, note: "Stop here は状況次第で強め" },
  { id: "t-002", cat: "transport", type: "blank", en: "Could you call a ____ for me?",
    choices: ["taxi", "task", "tasty", "tackle"], answer: 0, note: "" },
];

const LS = {
  category: "tep_category",
  mode: "tep_mode", // normal | review | daily
  wrong: "tep_wrong_ids",
  xp: "tep_xp",
  streak: "tep_streak",
  lastDay: "tep_last_day",
  custom: "tep_custom_questions",
};

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function loadStr(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveStr(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("このブラウザは音声読み上げに対応していません");
    return;
  }
  window.speechSynthesis.cancel();
  const uttr = new SpeechSynthesisUtterance(text);
  uttr.lang = "en-US";
  uttr.rate = 0.95;
  window.speechSynthesis.speak(uttr);
}

export default function QuizPage() {
  const [category, setCategory] = useState("restaurant");
  const [mode, setMode] = useState("daily"); // default: daily
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const [order, setOrder] = useState([]); // question ids
  const [pos, setPos] = useState(0);

  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);

  const allQuestions = useMemo(() => {
    const custom = loadJSON(LS.custom, []);
    const map = new Map();
    for (const q of BUILTIN) map.set(q.id, q);
    if (Array.isArray(custom)) {
      for (const q of custom) map.set(q.id, q);
    }
    return Array.from(map.values());
  }, []); // stable

  useEffect(() => {
    setCategory(loadStr(LS.category, "restaurant"));
    setMode(loadStr(LS.mode, "daily"));
    setXp(Number(loadStr(LS.xp, "0")) || 0);
    setStreak(Number(loadStr(LS.streak, "0")) || 0);
  }, []);

  useEffect(() => saveStr(LS.category, category), [category]);
  useEffect(() => saveStr(LS.mode, mode), [mode]);
  useEffect(() => saveStr(LS.xp, String(xp)), [xp]);
  useEffect(() => saveStr(LS.streak, String(streak)), [streak]);

  useEffect(() => {
    const wrongIds = loadJSON(LS.wrong, []);
    const allInCat = allQuestions.filter((q) => q.cat === category).map((q) => q.id);
    let ids = allInCat;

    if (mode === "review") {
      ids = allInCat.filter((id) => wrongIds.includes(id));
      if (ids.length === 0) {
        setMode("normal");
        saveStr(LS.mode, "normal");
        ids = allInCat;
      }
    }

    if (mode === "daily") {
      const day = todayKey();
      const doneKey = `tep_daily_done_${day}`;
      const idsKey = `tep_daily_ids_${day}_${category}`;

      if (localStorage.getItem(doneKey) === "1") {
        setOrder([]);
        setPos(0);
        setPicked(null);
        setResult(null);
        return;
      }

      const saved = loadJSON(idsKey, null);
      if (saved && Array.isArray(saved) && saved.length) {
        setOrder(saved);
        setPos(0);
        setPicked(null);
        setResult(null);
        return;
      }

      const seed = hashSeed(`${day}_${category}`);
      const shuffled = seededShuffle(allInCat, seed);
      const pick3 = shuffled.slice(0, Math.min(3, shuffled.length));
      saveJSON(idsKey, pick3);

      setOrder(pick3);
      setPos(0);
      setPicked(null);
      setResult(null);
      return;
    }

    ids = [...ids].sort(() => Math.random() - 0.5);
    setOrder(ids);
    setPos(0);
    setPicked(null);
    setResult(null);
  }, [category, mode, allQuestions]);

  const current = useMemo(() => {
    const id = order[pos];
    return allQuestions.find((q) => q.id === id) ?? null;
  }, [order, pos, allQuestions]);

  const progressText = useMemo(() => {
    if (!order.length) return "";
    return `${pos + 1} / ${order.length}`;
  }, [pos, order.length]);

  const wrongCountInCat = useMemo(() => {
    const wrongIds = loadJSON(LS.wrong, []);
    const inCat = allQuestions.filter((q) => q.cat === category).map((q) => q.id);
    return inCat.filter((id) => wrongIds.includes(id)).length;
  }, [category, pos, mode, allQuestions]);

  const markWrong = (qid) => {
    const wrongIds = loadJSON(LS.wrong, []);
    if (!wrongIds.includes(qid)) {
      wrongIds.push(qid);
      saveJSON(LS.wrong, wrongIds);
    }
  };
  const unmarkWrong = (qid) => {
    const wrongIds = loadJSON(LS.wrong, []);
    const next = wrongIds.filter((id) => id !== qid);
    saveJSON(LS.wrong, next);
  };
  const bumpStreakIfFirstCorrectToday = () => {
    const today = todayKey();
    const last = loadStr(LS.lastDay, "");
    if (last !== today) {
      setStreak((s) => s + 1);
      saveStr(LS.lastDay, today);
    }
  };

  const next = () => {
    setPicked(null);
    setResult(null);
    setPos((p) => {
      const np = p + 1;
      if (mode === "daily" && np >= order.length) {
        const day = todayKey();
        localStorage.setItem(`tep_daily_done_${day}`, "1");
        return p;
      }
      return np >= order.length ? 0 : np;
    });
  };

  const choose = (i) => {
    if (!current || result) return;
    setPicked(i);
    const ok = i === current.answer;
    setResult(ok ? "ok" : "ng");

    if (ok) {
      setXp((v) => v + 10);
      bumpStreakIfFirstCorrectToday();
      unmarkWrong(current.id);
    } else {
      markWrong(current.id);
    }
    setTimeout(next, 850);
  };

  const resetWrong = () => {
    saveJSON(LS.wrong, []);
    alert("間違いリストをクリアしました");
  };

  const resetDaily = () => {
    const day = todayKey();
    localStorage.removeItem(`tep_daily_done_${day}`);
    localStorage.removeItem(`tep_daily_ids_${day}_${category}`);
    alert("今日の3問をリセットしました");
    setMode("daily");
    saveStr(LS.mode, "daily");
  };

  if (mode === "daily" && order.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>今日の3問は完了 ✅</h1>
        <p style={{ opacity: 0.75 }}>明日また来てね！YouTubeの新作もチェック。</p>

        <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: "#fff" }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>カテゴリ：{CATEGORIES[category] ?? category}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => { setMode("review"); saveStr(LS.mode, "review"); }}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
              🔁 復習（間違いだけ）
            </button>
            <button onClick={resetDaily}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
              ♻ 今日の3問をやり直す
            </button>
            <a href="/" style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", textDecoration: "none" }}>
              ← トップへ
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Quiz</h1>
        <p>このカテゴリの問題がまだありません。</p>
        <a href="/">← トップへ戻る</a>
      </div>
    );
  }

  const catLabel = CATEGORIES[category] ?? category;

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {mode === "daily" ? "📅 今日の3問" : mode === "review" ? "🔁 復習モード" : "📘 通常モード"}
          </div>
          <h1 style={{ margin: 0, fontSize: 18 }}>{catLabel}</h1>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{progressText}</div>
        </div>
        <div style={{ fontSize: 13, textAlign: "right" }}>
          XP: <b>{xp}</b><br />
          Streak: <b>{streak}</b>
        </div>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: `1px solid ${category === key ? "#111827" : "#e5e7eb"}`,
              background: category === key ? "#f1f5f9" : "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setMode("daily")}
          style={{
            flex: 1, minWidth: 130, padding: 12, borderRadius: 12,
            border: `1px solid ${mode === "daily" ? "#111827" : "#e5e7eb"}`,
            background: mode === "daily" ? "#111827" : "#fff",
            color: mode === "daily" ? "#fff" : "#111827",
            cursor: "pointer",
          }}
        >
          今日の3問
        </button>

        <button
          onClick={() => setMode("normal")}
          style={{
            flex: 1, minWidth: 120, padding: 12, borderRadius: 12,
            border: `1px solid ${mode === "normal" ? "#111827" : "#e5e7eb"}`,
            background: mode === "normal" ? "#111827" : "#fff",
            color: mode === "normal" ? "#fff" : "#111827",
            cursor: "pointer",
          }}
        >
          通常
        </button>

        <button
          onClick={() => setMode("review")}
          style={{
            flex: 1, minWidth: 140, padding: 12, borderRadius: 12,
            border: `1px solid ${mode === "review" ? "#111827" : "#e5e7eb"}`,
            background: mode === "review" ? "#111827" : "#fff",
            color: mode === "review" ? "#fff" : "#111827",
            cursor: "pointer",
          }}
        >
          復習（間違い {wrongCountInCat}）
        </button>
      </div>

      <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{current.type === "choice" ? "日本語を選ぶ" : "空欄を埋める"}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetWrong} style={{ fontSize: 12, opacity: 0.7, border: "none", background: "transparent", cursor: "pointer" }}>
              間違いクリア
            </button>
            <button onClick={resetDaily} style={{ fontSize: 12, opacity: 0.7, border: "none", background: "transparent", cursor: "pointer" }}>
              今日リセット
            </button>
          </div>
        </div>

        <div style={{ fontSize: 20, marginTop: 10, lineHeight: 1.4 }}>
          {current.type === "blank" ? (
            <>
              {current.en.split("____")[0]}
              <span style={{ padding: "2px 10px", borderRadius: 999, background: "#f1f5f9" }}>____</span>
              {current.en.split("____")[1]}
            </>
          ) : (
            current.en
          )}
        </div>

        <button
          onClick={() => speak(current.en.replace("____", ""))}
          style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}
        >
          🔊 英語を読み上げ
        </button>

        {current.note && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>メモ：{current.note}</div>}

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {current.choices.map((c, i) => {
            const isPicked = picked === i;
            const isCorrect = result && i === current.answer;
            const isWrongPicked = result === "ng" && isPicked && i !== current.answer;

            const bg = isCorrect ? "#dcfce7" : isWrongPicked ? "#fee2e2" : "#fff";
            const bd = isCorrect ? "#22c55e" : isWrongPicked ? "#ef4444" : "#e5e7eb";

            return (
              <button
                key={i}
                onClick={() => choose(i)}
                style={{ textAlign: "left", padding: 14, borderRadius: 12, border: `1px solid ${bd}`, background: bg, cursor: "pointer", fontSize: 15 }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          YouTubeで同じ問題を見たら → アプリで復習（復習タブが最強）
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
        ショート導線：<span style={{ fontFamily: "ui-monospace" }}>english-rant.vercel.app/quiz</span>
      </div>
    </div>
  );
}
