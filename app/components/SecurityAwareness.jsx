"use client";
import React from "react";
import { COURSE, MODULES, QUESTIONS, SLIDES } from "../lib/securityCourse";

/* ============================================================
   Security Awareness Training 2026
   Self-paced e-learning: registration → pre-test → 4 modules →
   post-test → certificate (PDF) + admin KPI dashboard.
   Ported from the Claude Design handoff into TTMFlow conventions
   (ttm-sat-* classes, server-side API storage, role-gated admin).
   ============================================================ */

const KEYS_TH = ["ก", "ข", "ค", "ง", "จ"];
const STEP_LABELS = ["ลงทะเบียน", "ทดสอบก่อนเรียน", "บทเรียน", "ทดสอบหลังเรียน", "ใบรับรอง"];
const SESSION_KEY = "ttm_sat_session_v1";

/* lesson-point + ui icons (24x24 stroke paths) */
const ICONS = {
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  clock: "M12 7v5l3 2 M12 21a9 9 0 100-18 9 9 0 000 18",
  shield: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z",
  brand: "M4 7h16v10H4z M8 11h8 M8 14h5",
  wave: "M3 12h2l2-6 3 14 3-10 2 4 4-2h2",
  verify: "M9 12l2 2 4-4 M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z",
  alert: "M12 9v4 M12 17h.01 M10.3 4.3L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z",
  crown: "M3 17h18 M3 7l4 4 5-6 5 6 4-4-2 10H5z",
  gift: "M20 12v9H4v-9 M2 7h20v5H2z M12 22V7 M12 7S10 3 7.5 4 9 7 12 7zM12 7s2-4 4.5-3S15 7 12 7z",
  lock: "M6 11h12v9H6z M9 11V8a3 3 0 016 0v3",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  report: "M7 3h7l5 5v13H7z M14 3v5h5 M9 13h6 M9 17h6",
  key: "M14 8a4 4 0 10-3.5 6L12 16l2 2 2-2-2-2 1.5-1.5A4 4 0 0014 8z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 100 6 3 3 0 000-6z",
  users: "M16 14c2.5 0 5 1.5 5 5 M2 21c0-3 2.5-5 6-5s6 2 6 5 M8 12a4 4 0 100-8 4 4 0 000 8z M16 10a3 3 0 100-6",
  check: "M5 12l4 4 10-10",
  ban: "M5 5l14 14 M12 21a9 9 0 100-18 9 9 0 000 18",
  ticket: "M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 00-2 2H6a2 2 0 01-2-2 2 2 0 000-4z M14 6v12",
  need: "M12 3l9 5-9 5-9-5z M3 12l9 5 9-5",
  export: "M12 15V3 M8 7l4-4 4 4 M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4",
  shredder: "M4 9h16 M5 5h14v4H5z M7 13v5 M12 13v6 M17 13v4",
  mobile: "M7 3h10v18H7z M11 18h2",
  desk: "M3 10h18 M5 10v8 M19 10v8 M5 10l2-5h10l2 5",
};
function SatIcon({ name, size = 20, className }) {
  const d = ICONS[name] || "M12 12h.01";
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i ? "M" + p : p} />)}
    </svg>
  );
}

/* utils */
const pct = (n) => Math.round(n * 100);
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function thaiDate(d) {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return d.getDate() + " " + months[d.getMonth()] + " พ.ศ. " + (d.getFullYear() + 543);
}
const safe = (s) => String(s || "user").replace(/[^A-Za-z0-9]/g, "_");
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function freshState(currentUser, lang) {
  return {
    screen: "login",
    user: {
      name: (lang === "th" ? currentUser?.nameTh : currentUser?.nameEn) || currentUser?.nameTh || "",
      empId: currentUser?.employeeId || currentUser?.id || "",
      dept: currentUser?.dept || "",
    },
    startedAt: null,
    pre: { answers: Array(QUESTIONS.length).fill(null), score: null },
    slideIndex: 0,
    relearn: false,
    post: { order: [], optOrder: {}, answers: [], score: null },
    attemptsUsed: 0,
    bestScore: 0,
    lastScore: 0,
    passed: false,
    examEnd: null,
    finishedAt: null,
  };
}

export function SecurityAwareness({ lang, role, currentUser }) {
  const th = lang === "th";
  const canAdmin = role === "admin" || role === "auditor";

  const [S, setS] = React.useState(() => freshState(currentUser, lang));
  const [hydrated, setHydrated] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [gateRemain, setGateRemain] = React.useState(null);
  const [, setTick] = React.useState(0);
  const [admin, setAdmin] = React.useState(null); // { recs, loading } | null
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const submittedRef = React.useRef(false);
  const toastTimer = React.useRef(null);

  const update = React.useCallback((patch) => setS((s) => ({ ...s, ...patch })), []);
  const flash = React.useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* resume session on mount */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.screen) {
          if (d.screen === "posttest" && d.examEnd && Date.now() > d.examEnd) { d.screen = "content"; d.slideIndex = 0; }
          setS(d);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  /* persist */
  React.useEffect(() => { if (hydrated) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(S)); } catch {} } }, [S, hydrated]);

  /* read-gate countdown on the final content slide */
  React.useEffect(() => {
    const isLast = S.slideIndex === SLIDES.length - 1;
    if (S.screen !== "content" || !isLast) { setGateRemain(null); return; }
    setGateRemain(COURSE.readGateSeconds);
    const iv = setInterval(() => setGateRemain((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [S.screen, S.slideIndex]);

  /* post-test countdown tick + auto-submit */
  React.useEffect(() => {
    if (S.screen !== "posttest") return;
    submittedRef.current = false;
    const iv = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(iv);
  }, [S.screen]);
  React.useEffect(() => {
    if (S.screen === "posttest" && S.examEnd && Date.now() >= S.examEnd && !submittedRef.current) {
      flash("หมดเวลาทำข้อสอบ — ระบบส่งคำตอบอัตโนมัติ");
      submitPost(true);
    }
  });

  /* ---------------- transitions ---------------- */
  function startCourse() {
    update({ screen: "pretest", startedAt: Date.now(), pre: { answers: Array(QUESTIONS.length).fill(null), score: null } });
    window.scrollTo(0, 0);
  }
  function submitPre() {
    if (S.pre.answers.some((a) => a === null)) { flash("กรุณาตอบให้ครบทุกข้อก่อนส่ง"); return; }
    let sc = 0; QUESTIONS.forEach((q, i) => { if (S.pre.answers[i] === q.answer) sc++; });
    update({ pre: { ...S.pre, score: sc }, screen: "content", slideIndex: 0, relearn: false });
    window.scrollTo(0, 0);
  }
  function startPostTest() {
    const order = shuffle(QUESTIONS.map((_, i) => i));
    const optOrder = {};
    order.forEach((qi) => { optOrder[qi] = shuffle(QUESTIONS[qi].options.map((_, i) => i)); });
    update({
      post: { order, optOrder, answers: Array(QUESTIONS.length).fill(null), score: null },
      examEnd: Date.now() + COURSE.examMinutes * 60 * 1000,
      screen: "posttest",
    });
    window.scrollTo(0, 0);
  }
  function submitPost(auto) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    let sc = 0; QUESTIONS.forEach((q, i) => { if (S.post.answers[i] === q.answer) sc++; });
    const bestScore = Math.max(S.bestScore, sc);
    const attemptsUsed = S.attemptsUsed + 1;
    const passedNow = sc / QUESTIONS.length >= COURSE.passThreshold;

    if (passedNow) {
      finishCourse({ lastScore: sc, bestScore, attemptsUsed, passed: true });
    } else if (attemptsUsed < COURSE.maxAttempts) {
      update({ lastScore: sc, bestScore, attemptsUsed, screen: "fail" });
      window.scrollTo(0, 0);
    } else {
      finishCourse({ lastScore: sc, bestScore, attemptsUsed, passed: bestScore / QUESTIONS.length >= COURSE.passThreshold });
    }
  }
  function finishCourse({ lastScore, bestScore, attemptsUsed, passed }) {
    const finishedAt = Date.now();
    update({ lastScore, bestScore, attemptsUsed, passed, finishedAt, screen: passed ? "cert" : "failFinal" });
    window.scrollTo(0, 0);
    const rec = {
      name: S.user.name, empId: S.user.empId, dept: S.user.dept,
      preScore: S.pre.score, postBest: bestScore, postLast: lastScore,
      total: QUESTIONS.length, attempts: attemptsUsed, passed,
      thresholdPct: pct(COURSE.passThreshold), scorePct: pct(bestScore / QUESTIONS.length),
      startedAt: S.startedAt ? new Date(S.startedAt).toISOString() : null,
      completedAt: new Date(finishedAt).toISOString(),
    };
    fetch("/api/training/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) })
      .then((r) => flash(r.ok ? "บันทึกผลการอบรมเรียบร้อย" : "บันทึกผลไม่สำเร็จ กรุณาแจ้งผู้ดูแล"))
      .catch(() => flash("บันทึกผลไม่สำเร็จ กรุณาแจ้งผู้ดูแล"));
  }
  function relearn() { update({ relearn: true, slideIndex: 0, screen: "content" }); window.scrollTo(0, 0); }
  function resetToStart() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setS(freshState(currentUser, lang));
    window.scrollTo(0, 0);
  }
  function selectAnswer(mode, qi, opt) {
    setS((s) => {
      const arr = (mode === "pre" ? s.pre.answers : s.post.answers).slice();
      arr[qi] = opt;
      return mode === "pre" ? { ...s, pre: { ...s.pre, answers: arr } } : { ...s, post: { ...s.post, answers: arr } };
    });
  }

  /* ---------------- admin dashboard ---------------- */
  async function openAdmin() {
    setAdmin({ recs: [], loading: true });
    try {
      const res = await fetch("/api/training/records");
      const data = await res.json();
      setAdmin({ recs: Array.isArray(data) ? data : [], loading: false });
    } catch { setAdmin({ recs: [], loading: false }); }
  }

  if (!hydrated) return <div className="ttm-sat" />;

  /* ---------------- render ---------------- */
  let body;
  if (admin) body = <AdminDashboard th={th} admin={admin} onRefresh={openAdmin} onClose={() => setAdmin(null)} flash={flash} />;
  else if (S.screen === "login") body = <Registration th={th} S={S} setUser={(u) => update({ user: u })} onStart={startCourse} />;
  else if (S.screen === "pretest") body = <PreTest th={th} S={S} onSelect={selectAnswer} onSubmit={submitPre} />;
  else if (S.screen === "content") body = <Content th={th} S={S} gateRemain={gateRemain} onNav={(i) => update({ slideIndex: i })} onStartPost={startPostTest} />;
  else if (S.screen === "posttest") body = <PostTest th={th} S={S} onSelect={selectAnswer} onSubmit={() => submitPost(false)} />;
  else if (S.screen === "fail") body = <FailRetry th={th} S={S} onRelearn={relearn} />;
  else if (S.screen === "failFinal") body = <FailFinal th={th} S={S} onHome={resetToStart} />;
  else if (S.screen === "cert") body = <Certificate th={th} S={S} pdfBusy={pdfBusy} setPdfBusy={setPdfBusy} flash={flash} onRestart={resetToStart} />;

  const activeStep = admin ? -1 : { login: 0, pretest: 1, content: 2, posttest: 3, fail: 3, failFinal: 3, cert: 4 }[S.screen];

  return (
    <div className="ttm-sat">
      <div className="ttm-sat-topbar">
        <div className="ttm-sat-brand-row">
          <div>
            <div className="ttm-sat-brand-title">ความตระหนักด้านความมั่นคงปลอดภัยไซเบอร์ 2026</div>
            <div className="ttm-sat-brand-sub">CYBERSECURITY AWARENESS · E-LEARNING</div>
          </div>
          {canAdmin && !admin && (
            <button className="ttm-sat-btn ttm-sat-ghost ttm-sat-admin-btn" onClick={openAdmin}>
              <SatIcon name="lock" size={16} /> {th ? "แดชบอร์ดผู้ดูแล" : "Admin dashboard"}
            </button>
          )}
        </div>
        {activeStep >= 0 && <Stepper activeStep={activeStep} />}
      </div>

      <div className="ttm-sat-main">{body}</div>
      <div className="ttm-sat-foot">Talk to Me Co., Ltd. · Information Security · Internal use only</div>

      {toast && <div className="ttm-sat-toast">{toast}</div>}
    </div>
  );
}

/* ---------------- stepper ---------------- */
function Stepper({ activeStep }) {
  return (
    <div className="ttm-sat-stepper">
      {STEP_LABELS.map((label, i) => {
        const done = activeStep > i, cur = activeStep === i;
        return (
          <React.Fragment key={i}>
            <div className="ttm-sat-step">
              <div className={"ttm-sat-step-dot" + (done ? " is-done" : cur ? " is-cur" : "")}>
                {done ? <SatIcon name="check" size={18} /> : i + 1}
              </div>
              <span className={"ttm-sat-step-label" + (cur ? " is-cur" : done ? " is-done" : "")}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div className={"ttm-sat-step-line" + (activeStep > i ? " is-done" : "")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------------- registration ---------------- */
function Registration({ th, S, setUser, onStart }) {
  const u = S.user;
  const deptOptions = COURSE.departments.includes(u.dept) || !u.dept ? COURSE.departments : [u.dept, ...COURSE.departments];
  const ready = u.name.trim() && u.empId.trim() && u.dept;
  return (
    <div className="ttm-sat-fade ttm-sat-login">
      <div className="ttm-sat-card ttm-sat-login-form">
        <div className="ttm-sat-pill is-sky"><SatIcon name="shield" size={15} /> STEP 1 · ลงทะเบียนเข้าอบรม</div>
        <h1 className="ttm-sat-h1">ยืนยันตัวตนพนักงาน<br />เพื่อเริ่มหลักสูตร</h1>
        <p className="ttm-sat-lead">ระบบดึงข้อมูลจากบัญชีที่ล็อกอินให้แล้ว ตรวจสอบความถูกต้องก่อนเริ่ม — ข้อมูลนี้จะใช้ออกใบรับรอง (Certificate) และบันทึกผลเพื่อการตรวจสอบ (Audit)</p>
        <div className="ttm-sat-fields">
          <Field label="ชื่อ-นามสกุล (Full Name)">
            <input value={u.name} onChange={(e) => setUser({ ...u, name: e.target.value })} placeholder="เช่น สมชาย ใจดี" />
          </Field>
          <div className="ttm-sat-grid2">
            <Field label="รหัสพนักงาน (Employee ID)">
              <input value={u.empId} onChange={(e) => setUser({ ...u, empId: e.target.value })} placeholder="เช่น TTM-00123" />
            </Field>
            <Field label="แผนก (Department)">
              <select value={u.dept} onChange={(e) => setUser({ ...u, dept: e.target.value })}>
                <option value="" disabled>เลือกแผนก…</option>
                {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <button className="ttm-sat-btn ttm-sat-primary ttm-sat-block" disabled={!ready} onClick={onStart}>
          เริ่มหลักสูตร (Start Course) <SatIcon name="export" size={16} />
        </button>
        <p className="ttm-sat-hint-center">ปุ่มจะปลดล็อกเมื่อกรอกข้อมูลครบทุกช่อง</p>
      </div>

      <div className="ttm-sat-card ttm-sat-login-aside">
        <div className="ttm-sat-aside-kicker">หลักสูตรนี้ประกอบด้วย</div>
        <div className="ttm-sat-aside-rows">
          <InfoRow ic="report" t="แบบทดสอบ 10 ข้อ" d="ก่อนเรียน + หลังเรียน วัดผลการพัฒนา" />
          <InfoRow ic="brand" t="บทเรียน 4 โมดูล" d="ความเสี่ยง · Vishing · VoIP · ความเป็นส่วนตัว" />
          <InfoRow ic="clock" t="เวลาทำข้อสอบ 10 นาที" d="เกณฑ์ผ่าน 90% (9 จาก 10 ข้อ)" />
          <InfoRow ic="verify" t="ใบรับรองอิเล็กทรอนิกส์" d="ดาวน์โหลดเป็นไฟล์ PDF ได้ทันที" />
        </div>
        <div className="ttm-sat-aside-note">หากสอบไม่ผ่าน ระบบจะให้กลับไปทบทวนบทเรียนก่อนสอบใหม่ ทำได้สูงสุด 3 ครั้ง</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return <div className="ttm-sat-field-group"><label>{label}</label><div className="ttm-sat-field">{children}</div></div>;
}
function InfoRow({ ic, t, d }) {
  return (
    <div className="ttm-sat-inforow">
      <div className="ttm-sat-inforow-ic"><SatIcon name={ic} size={20} /></div>
      <div><div className="ttm-sat-inforow-t">{t}</div><div className="ttm-sat-inforow-d">{d}</div></div>
    </div>
  );
}

/* ---------------- question card + quiz ---------------- */
function QuestionCard({ q, qi, optOrder, selected, mode, onSelect, displayNo }) {
  return (
    <div className="ttm-sat-card ttm-sat-qcard">
      <div className="ttm-sat-qrow">
        <div className="ttm-sat-qno">{displayNo}</div>
        <div className="ttm-sat-qbody">
          <div className="ttm-sat-qtext">{q.q}</div>
          <div className="ttm-sat-opts">
            {optOrder.map((optIdx, pos) => (
              <button key={optIdx} type="button"
                className={"ttm-sat-opt" + (selected === optIdx ? " is-sel" : "")}
                onClick={() => onSelect(mode, qi, optIdx)}>
                <span className="ttm-sat-opt-key">{KEYS_TH[pos]}</span>
                <span className="ttm-sat-opt-text">{q.options[optIdx]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreTest({ th, S, onSelect, onSubmit }) {
  const done = S.pre.answers.filter((a) => a !== null).length;
  return (
    <div className="ttm-sat-fade">
      <Banner tag="STEP 2 · แบบทดสอบก่อนเรียน (Pre-Test)" title="ประเมินความรู้เดิมของคุณ"
        desc={<>ตอบตามความเข้าใจปัจจุบัน ระบบจะ<strong>ไม่แสดงคะแนนหรือเฉลย</strong>ในขั้นนี้ เพื่อวัดพัฒนาการได้อย่างแม่นยำ</>} tone="sky" />
      <div className="ttm-sat-qlist">
        {QUESTIONS.map((q, qi) => (
          <QuestionCard key={qi} q={q} qi={qi} optOrder={q.options.map((_, i) => i)} selected={S.pre.answers[qi]} mode="pre" onSelect={onSelect} displayNo={qi + 1} />
        ))}
      </div>
      <div className="ttm-sat-actions">
        <div className="ttm-sat-count">ตอบแล้ว <strong>{done}</strong> / {QUESTIONS.length} ข้อ</div>
        <button className="ttm-sat-btn ttm-sat-primary" onClick={onSubmit}>ส่งคำตอบและเริ่มเรียน <SatIcon name="check" size={16} /></button>
      </div>
    </div>
  );
}

function PostTest({ th, S, onSelect, onSubmit }) {
  const done = S.post.answers.filter((a) => a !== null).length;
  const attemptNo = S.attemptsUsed + 1;
  const ms = Math.max(0, (S.examEnd || 0) - Date.now());
  const sec = Math.floor(ms / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const danger = sec <= 60;
  return (
    <div className="ttm-sat-fade">
      <div className="ttm-sat-post-head">
        <div>
          <div className="ttm-sat-pill is-plain">STEP 4 · แบบทดสอบหลังเรียน (Post-Test)</div>
          <div className="ttm-sat-post-sub">เกณฑ์ผ่าน <strong>90% (9/10 ข้อ)</strong> · ครั้งที่ <strong>{attemptNo} / {COURSE.maxAttempts}</strong></div>
        </div>
        <div className={"ttm-sat-timer" + (danger ? " is-danger" : "")}>
          <SatIcon name="clock" size={22} />
          <div><div className="ttm-sat-timer-label">เวลาคงเหลือ</div><div className="ttm-sat-timer-val">{mm}:{ss}</div></div>
        </div>
      </div>
      <div className="ttm-sat-qlist">
        {S.post.order.map((qi, idx) => (
          <QuestionCard key={qi} q={QUESTIONS[qi]} qi={qi} optOrder={S.post.optOrder[qi]} selected={S.post.answers[qi]} mode="post" onSelect={onSelect} displayNo={idx + 1} />
        ))}
      </div>
      <div className="ttm-sat-actions">
        <div className="ttm-sat-count">ตอบแล้ว <strong>{done}</strong> / {QUESTIONS.length} ข้อ</div>
        <button className="ttm-sat-btn ttm-sat-sky" onClick={() => {
          if (S.post.answers.some((a) => a === null) && !confirm("คุณยังตอบไม่ครบทุกข้อ ข้อที่ไม่ตอบจะถือว่าผิด ต้องการส่งคำตอบหรือไม่?")) return;
          onSubmit();
        }}>ส่งคำตอบ <SatIcon name="check" size={16} /></button>
      </div>
    </div>
  );
}

function Banner({ tag, title, desc, tone }) {
  return (
    <div className="ttm-sat-banner">
      <div className={"ttm-sat-pill " + (tone === "sky" ? "is-sky" : "is-plain")}>{tag}</div>
      <h1 className="ttm-sat-h2">{title}</h1>
      <p className="ttm-sat-lead">{desc}</p>
    </div>
  );
}

/* ---------------- content slides ---------------- */
function Content({ th, S, gateRemain, onNav, onStartPost }) {
  const item = SLIDES[S.slideIndex];
  const m = item.module, sl = item.slide;
  const isLast = S.slideIndex === SLIDES.length - 1;
  const gateReady = !isLast || gateRemain === 0;
  const nextLabel = isLast ? (S.relearn ? "ทำข้อสอบอีกครั้ง" : "ไปทำข้อสอบหลังเรียน") : "ถัดไป";
  return (
    <div className="ttm-sat-fade">
      <div className="ttm-sat-content-top">
        <div className="ttm-sat-content-mod"><span className="ttm-sat-mod-tag">MODULE {("0" + m.no)}</span> {m.title}</div>
        <div className="ttm-sat-content-count">สไลด์ {S.slideIndex + 1} / {SLIDES.length}</div>
      </div>

      <div className={"ttm-sat-card ttm-sat-slide is-" + m.accent}>
        <div className="ttm-sat-slide-head">
          <div className="ttm-sat-slide-kicker">{sl.kicker}</div>
          <h2 className="ttm-sat-slide-h">{sl.heading}</h2>
          <div className="ttm-sat-slide-en">{sl.headingEn}</div>
          <p className="ttm-sat-slide-lead">{sl.lead}</p>
        </div>
        <div className="ttm-sat-points">
          {sl.points.map((p, i) => (
            <div key={i} className="ttm-sat-point">
              <div className="ttm-sat-point-ic"><SatIcon name={p.icon} size={24} /></div>
              <div><div className="ttm-sat-point-t">{p.t}</div><div className="ttm-sat-point-d">{p.d}</div></div>
            </div>
          ))}
        </div>
      </div>

      {isLast && (
        <div className={"ttm-sat-gate" + (gateRemain === 0 ? " is-ready" : "")}>
          <SatIcon name={gateRemain === 0 ? "check" : "clock"} size={16} />
          {gateRemain === 0
            ? <span>พร้อมแล้ว · คุณสามารถเริ่มทำข้อสอบหลังเรียนได้</span>
            : <span>กรุณาอ่านเนื้อหาสรุปนี้อย่างน้อย <strong>{gateRemain} วินาที</strong> ก่อนทำข้อสอบ</span>}
        </div>
      )}

      <div className="ttm-sat-slide-nav">
        <button className="ttm-sat-btn ttm-sat-ghost" disabled={S.slideIndex === 0} onClick={() => onNav(S.slideIndex - 1)}>
          <SatIcon name="export" size={16} /> ก่อนหน้า
        </button>
        <div className="ttm-sat-dots">
          {SLIDES.map((_, i) => (
            <button key={i} aria-label={"slide " + (i + 1)}
              className={"ttm-sat-dot" + (i === S.slideIndex ? " is-cur" : i < S.slideIndex ? " is-done" : "")}
              onClick={() => { if (i <= S.slideIndex || i < SLIDES.length - 1) onNav(i); }} />
          ))}
        </div>
        <button className={"ttm-sat-btn " + (isLast ? "ttm-sat-sky" : "ttm-sat-primary")}
          disabled={isLast && !gateReady}
          onClick={() => { if (isLast) { if (gateReady) onStartPost(); } else onNav(S.slideIndex + 1); }}>
          {nextLabel} <SatIcon name={isLast ? "report" : "export"} size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- fail screens ---------------- */
function FailRetry({ th, S, onRelearn }) {
  return (
    <div className="ttm-sat-fade ttm-sat-result">
      <div className="ttm-sat-card ttm-sat-result-card">
        <div className="ttm-sat-result-ic is-amber"><SatIcon name="alert" size={32} /></div>
        <h2 className="ttm-sat-h2">ยังไม่ผ่านเกณฑ์ในครั้งนี้</h2>
        <p className="ttm-sat-lead">คุณทำได้ <strong>{S.lastScore} / {QUESTIONS.length}</strong> ข้อ (เกณฑ์ผ่านคือ 9 ข้อขึ้นไป)</p>
        <div className="ttm-sat-note-box">
          ตามนโยบายการอบรม คุณต้อง<strong>กลับไปทบทวนบทเรียนทั้งหมดอีกครั้ง</strong> ก่อนเข้าสอบใหม่<br />
          เหลือสิทธิ์สอบอีก <strong>{COURSE.maxAttempts - S.attemptsUsed} ครั้ง</strong> · หลังครบ 3 ครั้งระบบจะใช้คะแนนที่ดีที่สุด
        </div>
        <button className="ttm-sat-btn ttm-sat-primary ttm-sat-block" onClick={onRelearn}><SatIcon name="brand" size={18} /> กลับไปทบทวนบทเรียน</button>
      </div>
    </div>
  );
}
function FailFinal({ th, S, onHome }) {
  return (
    <div className="ttm-sat-fade ttm-sat-result">
      <div className="ttm-sat-card ttm-sat-result-card">
        <div className="ttm-sat-result-ic is-red"><SatIcon name="ban" size={32} /></div>
        <h2 className="ttm-sat-h2">ยังไม่ผ่านการอบรม</h2>
        <p className="ttm-sat-lead">คุณใช้สิทธิ์สอบครบ {COURSE.maxAttempts} ครั้งแล้ว · คะแนนที่ดีที่สุดคือ <strong>{S.bestScore} / {QUESTIONS.length}</strong> ข้อ</p>
        <div className="ttm-sat-note-box">ระบบได้บันทึกผลไว้สำหรับผู้ดูแลแล้ว · กรุณาติดต่อ <strong>หัวหน้างาน หรือฝ่าย HR/IT</strong> เพื่อเข้ารับการอบรมรอบถัดไป</div>
        <button className="ttm-sat-btn ttm-sat-ghost" onClick={onHome}>กลับสู่หน้าเริ่มต้น</button>
      </div>
    </div>
  );
}

/* ---------------- certificate ---------------- */
function Certificate({ th, S, pdfBusy, setPdfBusy, flash, onRestart }) {
  const d = new Date(S.finishedAt || Date.now());
  const prePct = pct((S.pre.score || 0) / QUESTIONS.length);
  const postPct = pct(S.bestScore / QUESTIONS.length);
  const improve = postPct - prePct;
  const certId = "TTM-CSA26-" + (S.user.empId || "XXXX").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(-6).padStart(4, "0") + "-" + d.getFullYear();

  async function downloadPdf() {
    const node = document.getElementById("ttm-sat-cert");
    if (!node) return;
    setPdfBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pw - 48, h = w / ratio;
      if (h > ph - 48) { h = ph - 48; w = h * ratio; }
      pdf.addImage(img, "JPEG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save("Certificate_CSA2026_" + safe(S.user.empId) + ".pdf");
      flash("ดาวน์โหลดใบรับรองสำเร็จ");
    } catch { flash("เกิดข้อผิดพลาดในการสร้าง PDF"); }
    finally { setPdfBusy(false); }
  }
  function downloadAudit() {
    const data = {
      certificateId: certId, course: "Cybersecurity Awareness 2026", organization: "Talk to Me Co., Ltd.",
      user: S.user, preTestScore: S.pre.score, preTestTotal: QUESTIONS.length,
      postTestBestScore: S.bestScore, postTestLastScore: S.lastScore, postTestTotal: QUESTIONS.length,
      scorePercent: postPct, passThresholdPercent: pct(COURSE.passThreshold),
      attemptsUsed: S.attemptsUsed, maxAttempts: COURSE.maxAttempts, passed: S.passed,
      startedAt: S.startedAt ? new Date(S.startedAt).toISOString() : null,
      completedAt: S.finishedAt ? new Date(S.finishedAt).toISOString() : null, exportedAt: new Date().toISOString(),
    };
    downloadBlob(JSON.stringify(data, null, 2), "audit_" + safe(S.user.empId) + ".json", "application/json");
    flash("ส่งออก Audit Log แล้ว");
  }

  return (
    <div className="ttm-sat-fade">
      <div className="ttm-sat-cert-intro">
        <div className="ttm-sat-pill is-teal"><SatIcon name="check" size={15} /> ผ่านการอบรมเรียบร้อย</div>
        <h1 className="ttm-sat-h1">ยินดีด้วย คุณ{S.user.name}</h1>
        <p className="ttm-sat-lead">คุณผ่านหลักสูตรความตระหนักด้านความมั่นคงปลอดภัยไซเบอร์ 2026</p>
      </div>

      <div className="ttm-sat-cert-wrap">
        <div id="ttm-sat-cert" className="ttm-sat-cert">
          <div className="ttm-sat-cert-top">
            <div className="ttm-sat-cert-bubble1" /><div className="ttm-sat-cert-bubble2" />
            <div className="ttm-sat-cert-toprow">
              <div className="ttm-sat-cert-logo">Talk to Me</div>
              <div className="ttm-sat-cert-no"><div className="ttm-sat-cert-no-k">CERTIFICATE OF COMPLETION</div><div className="ttm-sat-cert-no-v">เลขที่ {certId}</div></div>
            </div>
            <div className="ttm-sat-cert-title">
              <div className="ttm-sat-cert-title-k">ใบรับรองการอบรม</div>
              <div className="ttm-sat-cert-title-h">ความตระหนักด้านความมั่นคงปลอดภัยไซเบอร์ 2026</div>
              <div className="ttm-sat-cert-title-en">CYBERSECURITY AWARENESS PROGRAM</div>
            </div>
          </div>
          <div className="ttm-sat-cert-bodywrap">
            <div className="ttm-sat-cert-body">
              <div className="ttm-sat-cert-to">ขอมอบใบรับรองฉบับนี้ให้แก่</div>
              <div className="ttm-sat-cert-name">{S.user.name}</div>
              <div className="ttm-sat-cert-meta">
                <span>รหัสพนักงาน: <strong>{S.user.empId}</strong></span>
                <span className="ttm-sat-cert-divider" />
                <span>แผนก: <strong>{S.user.dept}</strong></span>
              </div>
              <div className="ttm-sat-cert-desc">ได้ผ่านการอบรมและการทดสอบตามหลักสูตรครบถ้วน ด้วยคะแนน <strong>{postPct}%</strong> ซึ่งเป็นไปตามเกณฑ์มาตรฐานความปลอดภัยของบริษัท</div>
              <div className="ttm-sat-cert-foot">
                <div className="ttm-sat-cert-foot-l"><div className="ttm-sat-cert-foot-k">วันที่ออกใบรับรอง</div><div className="ttm-sat-cert-foot-v">{thaiDate(d)}</div></div>
                <div className="ttm-sat-cert-seal"><div><div className="ttm-sat-cert-seal-k">PASSED</div><div className="ttm-sat-cert-seal-v">{postPct}%</div></div></div>
                <div className="ttm-sat-cert-foot-r"><div className="ttm-sat-cert-sign">Talk to Me Co., Ltd.</div><div className="ttm-sat-cert-foot-k">Information Security Office</div></div>
              </div>
            </div>
          </div>
          <div className="ttm-sat-cert-fine">เอกสารนี้ออกโดยระบบ E-Learning อัตโนมัติ · ตรวจสอบได้ที่ฝ่ายทรัพยากรบุคคล · {certId}</div>
        </div>
      </div>

      <div className="ttm-sat-cert-dl">
        <button className="ttm-sat-btn ttm-sat-primary" disabled={pdfBusy} onClick={downloadPdf}>
          <SatIcon name="export" size={18} /> {pdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลดใบรับรอง (PDF)"}
        </button>
        <button className="ttm-sat-btn ttm-sat-ghost" onClick={downloadAudit}><SatIcon name="report" size={18} /> ส่งออกข้อมูล Audit Log (JSON)</button>
      </div>

      <div className="ttm-sat-metrics">
        <Metric label="ก่อนเรียน (Pre-Test)" big={(S.pre.score || 0) + " / " + QUESTIONS.length} sub={prePct + "%"} tone="slate" />
        <Metric label="หลังเรียน (Post-Test)" big={S.bestScore + " / " + QUESTIONS.length} sub={postPct + "%"} tone="teal" />
        <Metric label="พัฒนาการ (Improvement)" big={(improve >= 0 ? "+" : "") + improve + "%"} sub={"ครั้งที่ใช้สอบ " + S.attemptsUsed + "/" + COURSE.maxAttempts} tone="sky" />
      </div>

      <div className="ttm-sat-card ttm-sat-compare">
        <div className="ttm-sat-compare-h">เปรียบเทียบผลก่อน–หลังเรียน</div>
        <CompareBar label="ก่อนเรียน" val={prePct} tone="slate" />
        <CompareBar label="หลังเรียน" val={postPct} tone="teal" />
        <div className="ttm-sat-compare-note">เกณฑ์ KPI องค์กร: พนักงานต้องผ่านการอบรม ≥ {pct(COURSE.kpiTeamTarget)}% ของทีม · เกณฑ์ผ่านรายบุคคล 90%</div>
      </div>

      <div className="ttm-sat-restart"><button onClick={onRestart}>เริ่มเซสชันใหม่สำหรับพนักงานคนถัดไป</button></div>
    </div>
  );
}
function Metric({ label, big, sub, tone }) {
  return <div className="ttm-sat-card ttm-sat-metric"><div className="ttm-sat-metric-l">{label}</div><div className={"ttm-sat-metric-big is-" + tone}>{big}</div><div className="ttm-sat-metric-s">{sub}</div></div>;
}
function CompareBar({ label, val, tone }) {
  return (
    <div className="ttm-sat-cbar">
      <div className="ttm-sat-cbar-l">{label}</div>
      <div className="ttm-sat-cbar-track"><div className={"ttm-sat-cbar-fill is-" + tone} style={{ width: val + "%" }} /></div>
      <div className="ttm-sat-cbar-v">{val}%</div>
    </div>
  );
}

/* ---------------- admin dashboard ---------------- */
function AdminDashboard({ th, admin, onRefresh, onClose, flash }) {
  const recs = admin.recs || [];
  const total = recs.length;
  const passed = recs.filter((r) => r.passed).length;
  const passRate = total ? Math.round((passed / total) * 100) : 0;
  const kpiTarget = pct(COURSE.kpiTeamTarget);
  const kpiMet = passRate >= kpiTarget;
  const avgPre = total ? Math.round(recs.reduce((s, r) => s + (r.preScore || 0), 0) / total * 10) / 10 : 0;
  const avgPost = total ? Math.round(recs.reduce((s, r) => s + (r.postBest || 0), 0) / total * 10) / 10 : 0;

  function exportCSV() {
    if (!recs.length) { flash("ยังไม่มีข้อมูลให้ส่งออก"); return; }
    const head = ["No", "Name", "EmployeeID", "Department", "PreScore", "PostBest", "Total", "ScorePercent", "Attempts", "Passed", "CompletedAt"];
    const lines = [head.join(",")];
    recs.forEach((r, i) => {
      const row = [i + 1, r.name, r.empId, r.dept, r.preScore, r.postBest, r.total, r.scorePct, r.attempts, r.passed ? "PASS" : "FAIL", r.completedAt]
        .map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"');
      lines.push(row.join(","));
    });
    downloadBlob("﻿" + lines.join("\r\n"), "training_report_CSA2026.csv", "text/csv;charset=utf-8;");
    flash("ดึงรายงาน CSV สำเร็จ");
  }
  function exportJSON() {
    if (!recs.length) { flash("ยังไม่มีข้อมูลให้ส่งออก"); return; }
    const report = {
      course: "Cybersecurity Awareness 2026", organization: "Talk to Me Co., Ltd.", generatedAt: new Date().toISOString(),
      kpi: { teamTargetPercent: kpiTarget, passRatePercent: passRate, met: kpiMet },
      summary: { totalParticipants: total, passed, failed: total - passed }, records: recs,
    };
    downloadBlob(JSON.stringify(report, null, 2), "training_report_CSA2026.json", "application/json");
    flash("ส่งออกรายงาน JSON สำเร็จ");
  }

  return (
    <div className="ttm-sat-fade">
      <div className="ttm-sat-admin-head">
        <div>
          <div className="ttm-sat-pill is-plain"><SatIcon name="lock" size={14} /> ADMIN BACK-OFFICE</div>
          <h1 className="ttm-sat-h2">แดชบอร์ดสรุปผลการอบรม</h1>
          <p className="ttm-sat-admin-sub">ข้อมูลรวมจากทุกเครื่อง/ทุกสาขา (จัดเก็บกลางผ่าน TTMFlow)</p>
        </div>
        <div className="ttm-sat-admin-tools">
          <button className="ttm-sat-btn ttm-sat-ghost" onClick={onRefresh}><SatIcon name="export" size={16} /> รีเฟรช</button>
          <button className="ttm-sat-btn ttm-sat-primary" onClick={exportCSV}><SatIcon name="export" size={16} /> ดึงรายงาน (CSV)</button>
          <button className="ttm-sat-btn ttm-sat-ghost" onClick={exportJSON}>JSON</button>
          <button className="ttm-sat-btn ttm-sat-ghost" onClick={onClose}>ออก</button>
        </div>
      </div>

      <div className="ttm-sat-kpis">
        <Kpi label="ผู้เข้าอบรมทั้งหมด" big={total} sub="คน" tone="navy" ic="users" />
        <Kpi label="ผ่านการทดสอบ" big={passed} sub={"จาก " + total + " คน"} tone="teal" ic="check" />
        <div className={"ttm-sat-card ttm-sat-kpi-big" + (kpiMet ? " is-met" : "")}>
          <div className="ttm-sat-kpi-big-l">อัตราการผ่าน (Pass Rate)</div>
          <div className="ttm-sat-kpi-big-v">{passRate}%</div>
          <div className="ttm-sat-kpi-big-s">{kpiMet ? "บรรลุ KPI ≥ " + kpiTarget + "%" : "ต่ำกว่าเป้า KPI " + kpiTarget + "%"}</div>
        </div>
        <Kpi label="คะแนนเฉลี่ย ก่อน → หลัง" big={avgPre + " → " + avgPost} sub={"เต็ม " + QUESTIONS.length + " คะแนน"} tone="sky" ic="report" />
      </div>

      <div className="ttm-sat-card ttm-sat-kpi-prog">
        <div className="ttm-sat-kpi-prog-top">
          <div>KPI องค์กร · พนักงานต้องผ่านการทดสอบ ≥ {kpiTarget}%</div>
          <div className={kpiMet ? "is-teal" : "is-amber"}>{passRate}% / {kpiTarget}%</div>
        </div>
        <div className="ttm-sat-kpi-prog-track">
          <div className={"ttm-sat-kpi-prog-fill" + (kpiMet ? " is-met" : "")} style={{ width: Math.min(100, passRate) + "%" }} />
          <div className="ttm-sat-kpi-prog-target" style={{ left: kpiTarget + "%" }} />
        </div>
        <div className="ttm-sat-kpi-prog-note">เส้นคือเป้าหมาย KPI {kpiTarget}% · {kpiMet ? "ทีมบรรลุเป้าหมายแล้ว" : "ยังต้องเพิ่มจำนวนผู้ผ่านให้ถึงเป้า"}</div>
      </div>

      <div className="ttm-sat-card ttm-sat-table-wrap">
        <table className="ttm-sat-table">
          <thead><tr>
            <th>#</th><th>พนักงาน</th><th>แผนก</th><th className="ta-c">ก่อนเรียน</th>
            <th className="ta-c">หลังเรียน (Best)</th><th className="ta-c">ครั้งที่สอบ</th><th className="ta-c">สถานะ</th><th>วันที่</th>
          </tr></thead>
          <tbody>
            {admin.loading ? (
              <tr><td colSpan={8} className="ttm-sat-table-empty">กำลังโหลด…</td></tr>
            ) : recs.length ? recs.slice().reverse().map((r, i) => {
              const dt = r.completedAt ? new Date(r.completedAt) : null;
              return (
                <tr key={r.id || i}>
                  <td className="ttm-sat-td-mono">{recs.length - i}</td>
                  <td><div className="ttm-sat-td-name">{r.name}</div><div className="ttm-sat-td-mono">{r.empId}</div></td>
                  <td>{r.dept}</td>
                  <td className="ta-c">{r.preScore != null ? r.preScore : "-"}/{r.total}</td>
                  <td className="ta-c"><strong>{r.postBest}/{r.total}</strong> <span className="ttm-sat-td-mute">({r.scorePct}%)</span></td>
                  <td className="ta-c">{r.attempts}</td>
                  <td className="ta-c">{r.passed
                    ? <span className="ttm-sat-badge is-pass">ผ่าน</span>
                    : <span className="ttm-sat-badge is-fail">ไม่ผ่าน</span>}</td>
                  <td className="ttm-sat-td-date">{dt ? dt.toLocaleDateString("th-TH") + " " + dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="ttm-sat-table-empty">ยังไม่มีข้อมูลการอบรม · ข้อมูลจะปรากฏเมื่อมีพนักงานเรียนจบ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ttm-sat-admin-back"><button className="ttm-sat-btn ttm-sat-ghost" onClick={onClose}>← กลับสู่หน้าหลักสูตร</button></div>
    </div>
  );
}
function Kpi({ label, big, sub, tone, ic }) {
  return (
    <div className="ttm-sat-card ttm-sat-kpi">
      <div className={"ttm-sat-kpi-ic is-" + tone}><SatIcon name={ic} size={22} /></div>
      <div className="ttm-sat-kpi-v">{big}</div>
      <div className="ttm-sat-kpi-l">{label}</div>
      <div className="ttm-sat-kpi-s">{sub}</div>
    </div>
  );
}
