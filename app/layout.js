export const metadata = {
  title: "Travel English Pro",
  description: "Restaurant & Travel English App"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui", background: "#f4f6f8" }}>
        {children}
      </body>
    </html>
  );
}