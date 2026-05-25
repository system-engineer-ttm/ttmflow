"use client";
import React from "react";
import Image from "next/image";
import { Icon } from "./Icon";

export function Login({ onLogin }) {
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
            <label>รหัสผ่าน (Password)</label>
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
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() => { setUsername(a.u); setPassword("1234"); }}
                  >
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
