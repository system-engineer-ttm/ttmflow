"use client";
import React from "react";

/* Dropdown bound to a user's titleTh/titleEn, sourced from admin-managed positions.
   onChange receives the selected position object, or null for "no position".
   Legacy free-text titles not in the list stay selectable so they aren't lost. */
export function PositionSelect({ lang, positions = [], titleTh, titleEn, onChange }) {
  const th = lang === "th";
  const current = positions.find((p) => p.nameTh === titleTh && p.nameEn === titleEn);
  const hasLegacy = !current && (titleTh || titleEn);
  const value = current ? current.id : (hasLegacy ? "__legacy__" : "");

  return (
    <select
      className="ttm-mf-select"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") onChange(null);
        else if (v === "__legacy__") { /* keep current legacy value */ }
        else onChange(positions.find((p) => p.id === v) ?? null);
      }}
    >
      <option value="">{th ? "— ไม่ระบุตำแหน่ง —" : "— No position —"}</option>
      {hasLegacy && (
        <option value="__legacy__">
          {(th ? titleTh : titleEn) || titleTh || titleEn} {th ? "(เดิม)" : "(current)"}
        </option>
      )}
      {positions.map((p) => (
        <option key={p.id} value={p.id}>
          {th ? (p.nameTh || p.nameEn) : (p.nameEn || p.nameTh)}
        </option>
      ))}
    </select>
  );
}
