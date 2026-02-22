"use client";

const SAMPLE = `id,cat,type,en,choice1,choice2,choice3,choice4,answer,note
r-101,restaurant,choice,Could we get the bill?,お会計お願いします,別会計にしてください,予約を変更したい,おすすめは何ですか,0,bill = 会計
a-101,airport,blank,My gate has been ____. ,changed,charged,checked,chased,0,gate changed = ゲート変更
h-101,hotel,choice,Could I have a late checkout?,レイトチェックアウトできますか？,タオルを追加でください,部屋を変えたい,荷物を預けたい,0,
t-101,transport,choice,Could you stop here?,ここで止めてください,ここで降ります,次で降ります,急いでください,0,`;

export default function TemplatePage() {
  const copy = async () => {
    await navigator.clipboard.writeText(SAMPLE);
    alert("テンプレをコピーしました");
  };

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>CSVテンプレ</h1>
      <p style={{ opacity: 0.75 }}>
        1行＝1問。<code>type</code> が <code>blank</code> の場合は <code>en</code> に <code>____</code> を入れてください。
      </p>

      <button
        onClick={copy}
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        テンプレをコピー
      </button>

      <pre style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#0b1020", color: "#e5e7eb", overflowX: "auto" }}>
{SAMPLE}
      </pre>

      <div style={{ marginTop: 14 }}>
        <a href="/">← トップへ戻る</a>
      </div>
    </div>
  );
}
