"use client";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Travel English（無料）</title>
        <meta name="description" content="YouTubeで見た問題を、アプリでサクッと復習。カテゴリ別＋復習＋今日の3問＋読み上げ。" />
      </head>
      <body style={{ margin: 0, background: "#f8fafc", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" }}>
        {children}
      </body>
    </html>
  );
}
