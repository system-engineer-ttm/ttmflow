"use client";
import React from "react";
import * as MockData from "./data";

const Ctx = React.createContext(null);

async function safeJson(path, fallback) {
  try {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
}

export function AppDataProvider({ children, enabled = true }) {
  const [formTemplates, setFormTemplates] = React.useState(MockData.FORM_TEMPLATES);
  const [requests, setRequests] = React.useState(MockData.REQUESTS);
  const [notifications, setNotifications] = React.useState(MockData.NOTIFICATIONS);
  const [flowTemplates, setFlowTemplates] = React.useState(MockData.FLOW_TEMPLATES);
  const [flowInstances, setFlowInstances] = React.useState(MockData.FLOW_INSTANCES);
  const [usersMap, setUsersMap] = React.useState(MockData.USERS);
  const [loading, setLoading] = React.useState(enabled);

  const reload = React.useCallback(async () => {
    setLoading(true);
    const [forms, reqs, notifs, ft, fi, users] = await Promise.all([
      safeJson("/api/forms", MockData.FORM_TEMPLATES),
      safeJson("/api/requests", MockData.REQUESTS),
      safeJson("/api/notifications", MockData.NOTIFICATIONS),
      safeJson("/api/flows/templates", MockData.FLOW_TEMPLATES),
      safeJson("/api/flows/instances", MockData.FLOW_INSTANCES),
      safeJson("/api/users", Object.values(MockData.USERS)),
    ]);
    if (Array.isArray(forms)) setFormTemplates(forms);
    if (Array.isArray(reqs)) setRequests(reqs);
    if (Array.isArray(notifs)) setNotifications(notifs);
    if (Array.isArray(ft)) setFlowTemplates(ft);
    if (Array.isArray(fi)) setFlowInstances(fi);
    if (Array.isArray(users)) {
      const map = {};
      for (const u of users) map[u.id] = u;
      setUsersMap(map);
    } else if (users && typeof users === "object") {
      setUsersMap(users);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  const refreshRequests = React.useCallback(async () => {
    const reqs = await safeJson("/api/requests", null);
    if (Array.isArray(reqs)) setRequests(reqs);
  }, []);
  const refreshNotifications = React.useCallback(async () => {
    const n = await safeJson("/api/notifications", null);
    if (Array.isArray(n)) setNotifications(n);
  }, []);
  const refreshForms = React.useCallback(async () => {
    const f = await safeJson("/api/forms", null);
    if (Array.isArray(f)) setFormTemplates(f);
  }, []);
  const refreshFlowTemplates = React.useCallback(async () => {
    const f = await safeJson("/api/flows/templates", null);
    if (Array.isArray(f)) setFlowTemplates(f);
  }, []);
  const refreshFlowInstances = React.useCallback(async () => {
    const f = await safeJson("/api/flows/instances", null);
    if (Array.isArray(f)) setFlowInstances(f);
  }, []);

  const value = {
    FORM_TEMPLATES: formTemplates,
    REQUESTS: requests,
    NOTIFICATIONS: notifications,
    FLOW_TEMPLATES: flowTemplates,
    FLOW_INSTANCES: flowInstances,
    USERS: usersMap,
    loading,
    reload,
    refreshRequests,
    refreshNotifications,
    refreshForms,
    refreshFlowTemplates,
    refreshFlowInstances,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    // Fallback to mock data so components can be used standalone
    return {
      FORM_TEMPLATES: MockData.FORM_TEMPLATES,
      REQUESTS: MockData.REQUESTS,
      NOTIFICATIONS: MockData.NOTIFICATIONS,
      FLOW_TEMPLATES: MockData.FLOW_TEMPLATES,
      FLOW_INSTANCES: MockData.FLOW_INSTANCES,
      USERS: MockData.USERS,
      loading: false,
      reload: async () => {},
      refreshRequests: async () => {},
      refreshNotifications: async () => {},
      refreshForms: async () => {},
      refreshFlowTemplates: async () => {},
      refreshFlowInstances: async () => {},
    };
  }
  return ctx;
}
