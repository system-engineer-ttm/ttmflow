"use client";
import React from "react";
import Image from "next/image";
import { Icon } from "./Icon";

export function Login({ onLogin }) {
  // mode: "login" | "forgot" | "reset"
  const [mode, setMode] = React.useState("login");

  if (mode === "forgot") return <ForgotPassword onBack={() => setMode("login")} onReset={() => setMode("reset")} />;
  if (mode === "reset")  return <ResetPassword  onBack={() => setMode("login")} />;
  return <LoginForm onLogin={onLogin} onForgot={() => setMode("forgot")} />;
}

function LoginForm({ onLogin, onForgot }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      } else {
        onLogin(data.user);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { u: "req001", label: "Employee (Requester)" },
    { u: "app001", label: "Approver" },
    { u: "it001",  label: "IT Staff" },
    { u: "adm001", label: "Admin / QMR" },
    { u: "aud001", label: "Auditor" },
  ];

  return (
    <div className="ttm-login-page">
      <div className="ttm-login-card">
        <div className="ttm-login-brand">
          <Image src="/assets/logo.jpg" alt="Talk to Me" width={56} height={56} style={{ borderRadius: 12 }} />
          <h1>TTMFlow</h1>
          <p>ระบบจัดการคำขอภายในองค์กร · Talk to Me Co., Ltd.</p>
        </div>

        <form onSubmit={handleSubmit} className="ttm-login-form">
          <div className="ttm-login-field">
            <label>ชื่อผู้ใช้งาน (Username)</label>
            <div className="ttm-login-input-wrap">
              <Icon name="user" size={16} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น req001, adm001"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="ttm-login-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ marginBottom: 0 }}>รหัสผ่าน (Password)</label>
              <button type="button" className="ttm-login-forgot-link" onClick={onForgot}>
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="ttm-login-input-wrap">
              <Icon name="lock" size={16} />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                <Icon name={showPw ? "eye-off" : "eye"} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="ttm-login-error">
              <Icon name="alert-circle" size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="ttm-login-btn" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ / Sign in"}
          </button>
        </form>

        <div className="ttm-login-hint">
          <strong>Demo accounts (รหัสผ่านทุกบัญชี: 1234)</strong>
          <table>
            <tbody>
              {demoAccounts.map((a) => (
                <tr key={a.u}>
                  <td style={{ cursor: "pointer" }} onClick={() => { setUsername(a.u); setPassword("1234"); }}>
                    {a.u}
                  </td>
                  <td>→ {a.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Forgot Password ── */
function ForgotPassword({ onBack, onReset }) {
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [devToken, setDevToken] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      if (data.devToken) setDevToken(data.devToken);
      else onReset(); // production: go to reset form (token arrives via email)
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ttm-login-page">
      <div className="ttm-login-card">
        <div className="ttm-login-brand">
          <Image src="/assets/logo.jpg" alt="Talk to Me" width={56} height={56} style={{ borderRadius: 12 }} />
          <h1>TTMFlow</h1>
          <p>ลืมรหัสผ่าน / Forgot Password</p>
        </div>

        {devToken ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="ttm-login-error" style={{ background: "#d1fae5", borderColor: "#6ee7b7", color: "#065f46" }}>
              <Icon name="check-circle" size={14} />
              สร้าง reset token สำเร็จแล้ว
            </div>
            <div style={{ fontSize: "0.8rem", background: "var(--surface-2)", padding: "0.75rem", borderRadius: 8, wordBreak: "break-all" }}>
              <div style={{ color: "var(--muted)", marginBottom: 4 }}>Dev token (จะส่งทาง Email จริงเมื่อ Email service พร้อม):</div>
              <code style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{devToken}</code>
            </div>
            <button className="ttm-login-btn" onClick={() => onReset(devToken)}>
              ไปหน้ากำหนดรหัสผ่านใหม่ →
            </button>
            <button type="button" className="ttm-login-forgot-link" style={{ alignSelf: "center" }} onClick={onBack}>
              ← กลับหน้าเข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ttm-login-form">
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6 }}>
              กรอก Username ของคุณ ระบบจะส่งลิงก์ reset รหัสผ่านไปที่ Email ที่ผูกไว้กับบัญชี
            </p>
            <div className="ttm-login-field">
              <label>ชื่อผู้ใช้งาน (Username)</label>
              <div className="ttm-login-input-wrap">
                <Icon name="user" size={16} />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            {error && <div className="ttm-login-error"><Icon name="alert-circle" size={14} />{error}</div>}
            <button type="submit" className="ttm-login-btn" disabled={loading || !username.trim()}>
              {loading ? "กำลังดำเนินการ…" : "ส่งลิงก์ Reset รหัสผ่าน"}
            </button>
            <button type="button" className="ttm-login-forgot-link" style={{ alignSelf: "center", marginTop: 4 }} onClick={onBack}>
              ← กลับหน้าเข้าสู่ระบบ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Reset Password ── */
function ResetPassword({ onBack, initialToken = "" }) {
  const [token, setToken] = React.useState(initialToken);
  const [newPw, setNewPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    if (newPw !== confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      setDone(true);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ttm-login-page">
      <div className="ttm-login-card">
        <div className="ttm-login-brand">
          <Image src="/assets/logo.jpg" alt="Talk to Me" width={56} height={56} style={{ borderRadius: 12 }} />
          <h1>TTMFlow</h1>
          <p>กำหนดรหัสผ่านใหม่ / Reset Password</p>
        </div>

        {done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", padding: "1rem 0" }}>
            <Icon name="check-circle" size={48} style={{ color: "#10b981" }} />
            <div style={{ fontWeight: 600 }}>เปลี่ยนรหัสผ่านสำเร็จแล้ว!</div>
            <button className="ttm-login-btn" onClick={onBack}>กลับหน้าเข้าสู่ระบบ</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ttm-login-form">
            {!initialToken && (
              <div className="ttm-login-field">
                <label>Reset Token</label>
                <div className="ttm-login-input-wrap">
                  <Icon name="key" size={16} />
                  <input value={token} onChange={e => setToken(e.target.value)} placeholder="วางโค้ด token ที่ได้รับ" required />
                </div>
              </div>
            )}
            <div className="ttm-login-field">
              <label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
              <div className="ttm-login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  <Icon name={showPw ? "eye-off" : "eye"} size={16} />
                </button>
              </div>
            </div>
            <div className="ttm-login-field">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <div className="ttm-login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            {error && <div className="ttm-login-error"><Icon name="alert-circle" size={14} />{error}</div>}
            <button type="submit" className="ttm-login-btn" disabled={loading}>
              {loading ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
            </button>
            <button type="button" className="ttm-login-forgot-link" style={{ alignSelf: "center", marginTop: 4 }} onClick={onBack}>
              ← กลับหน้าเข้าสู่ระบบ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
