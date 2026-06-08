"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("Incorrect passcode");
  }

  return (
    <div className="wrap">
      <div className="login card" style={{ padding: 22 }}>
        <div className="section barred" style={{ marginTop: 0 }}>
          <h2>Score Entry Login</h2>
        </div>
        <div className="field-group">
          <label htmlFor="pc">Passcode</label>
          <input
            id="pc"
            className="text"
            type="password"
            value={passcode}
            autoComplete="current-password"
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        {error && <div style={{ color: "var(--red-dark)", fontFamily: "var(--cond)", marginBottom: 10 }}>{error}</div>}
        <button className="btn btn-red" style={{ width: "100%" }} disabled={busy} onClick={submit}>
          {busy ? "Checking..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
