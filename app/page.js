"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { key: "restaurant", label: "🍽 レストラン" },
  { key: "airport", label: "✈ 空港" },
  { key: "hotel", label: "🏨 ホテル" },
  { key: "sightseeing", label: "🗺 観光" },
  { key: "transport", label: "🚕 移動" },
];

function csvSplitLine(line) {
  // Simple CSV splitter supporting quotes.
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { // escaped quote
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export default function Home() {
  const router = useRouter();
  const [cat, setCat] = useState("restaurant");
  const [customCount, setCustomCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tep_category");
      if (saved) setCat(saved);
      const custom = localStorage.getItem("tep_custom_questions");
      if (custom) setCustomCount(JSON.parse(custom).length || 0);
    } catch {}
  }, []);

  const start = () => {
    try {
      localStorage.setItem("tep_category", cat);
      localStorage.setItem("tep_mode", "daily"); // YouTube導線：まずは今日の3問へ
    } catch {}
    router.push("/quiz");
  };

  const importCsv = async (file) => {
    const text = await file.text();
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim().length);
    if (!lines.length) return alert("CSVが空です");

    const header = csvSplitLine(lines.shift()).map(s => s.trim());
    const idx = (name) => header.indexOf(name);

    const required = ["id","cat","type","en","choice1","choice2","choice3","choice4","answer","note"];
    for (const k of required) {
      if (idx(k) === -1) return alert(`ヘッダーに ${k} がありません`);
    }

    const items = lines.map((line) => {
      const cols = csvSplitLine(line);
      const q = {
        id: cols[idx("id")] || "",
        cat: cols[idx("cat")] || "",
        type: cols[idx("type")] || "choice",
        en: cols[idx("en")] || "",
        choices: [
          cols[idx("choice1")] || "",
          cols[idx("choice2")] || "",
          cols[idx("choice3")] || "",
          cols[idx("choice4")] || "",
        ],
        answer: Number(cols[idx("answer")]),
        note: cols[idx("note")] || "",
      };
      return q;
    }).filter(q =>
      q.id &&
      ["restaurant","airport","hotel","sightseeing","transport"].includes(q.cat) &&
      ["choice","blank"].includes(q.type) &&
      q.en &&
      q.choices.every(Boolean) &&
      Number.isFinite(q.answer) && q.answer >= 0 && q.answer <= 3
    );

    localStorage.setItem("tep_custom_questions", JSON.stringify(items));
    setCustomCount(items.length);
    alert(`CSVを読み込みました：${items.length}問`);
  };

  const clearCustom = () => {
    localStorage.removeItem("tep_custom_questions");
    setCustomCount(0);
    alert("カスタム問題を削除しました");
  };

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ margin: "8px 0 0", fontSize: 22 }}>Travel English（無料）</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        YouTubeで見た問題を、アプリでサクッと復習。<br />
        「今日の3問」→「復習（間違いだけ）」が最短ルート。
      </p>

      <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, opacity: 0.7 }}>カテゴリを選んでスタート</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              style={{
                padding: 14,
                borderRadius: 12,
                border: `1px solid ${cat === c.key ? "#111827" : "#e5e7eb"}`,
                background: cat === c.key ? "#f1f5f9" : "#fff",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={start}
          style={{
            marginTop: 14,
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          今日の3問をはじめる ▶
        </button>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          カスタム問題：<b>{customCount}</b>問
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, cursor: "pointer" }}>
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
                e.target.value = "";
              }}
            />
            📥 CSVで問題追加
          </label>

          <button
            onClick={clearCustom}
            style={{ fontSize: 12, opacity: 0.7, border: "none", background: "transparent", cursor: "pointer" }}
            title="カスタム問題を削除"
          >
            カスタム削除
          </button>

          {/* <a href="/template" style={{ fontSize: 12, opacity: 0.9 }}>
            CSVテンプレを見る
          </a> */}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          URL：<span style={{ fontFamily: "ui-monospace" }}>english-rant.vercel.app/quiz</span>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
        ※ログイン不要 / 無料。XP・Streak・復習は端末内に保存されます。
      </div>
    </div>
  );
}
