"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Travel English Pro</h1>
      <Link href="/quiz">Start Learning</Link>
      <br/><br/>
      <Link href="/login">Login</Link>
    </div>
  );
}