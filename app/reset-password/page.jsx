"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { ResetPassword } from "../components/Login";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  return (
    <ResetPassword
      initialToken={token}
      onBack={() => { window.location.href = "/"; }}
    />
  );
}

export default function ResetPasswordPage() {
  // useSearchParams requires a Suspense boundary in the app router
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordInner />
    </React.Suspense>
  );
}
