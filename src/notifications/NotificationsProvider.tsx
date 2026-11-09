import * as signalR from "@microsoft/signalr";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_ORIGIN, getToken, notificationsApi } from "../api/client";
import { useModules } from "../api/useModules";
import { router } from "../router";
import type { Notification } from "../types";

// Groups bursts of SignalR notifications (e.g. a reminder job firing one row per item
// in a single run) into a single device notification per module, instead of one per row.
const BATCH_DEBOUNCE_MS = 2000;

export interface GroupedUnread {
  moduleId: string;
  label: string;
  count: number;
  route: string;
}

/** "unsupported" = no Notification API in this browser (e.g. iOS Safari outside an installed
 * PWA — on iPhone the app must be added to the home screen first). */
export type DevicePermission = NotificationPermission | "unsupported";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  groupedUnread: GroupedUnread[];
  markAsRead: (id: string) => void;
  removeMany: (ids: string[]) => void;
  devicePermission: DevicePermission;
  /** Must be called from a user gesture (a click) — iOS rejects permission prompts otherwise. */
  requestDevicePermission: () => Promise<void>;
}

function currentPermission(): DevicePermission {
  return "Notification" in window ? Notification.permission : "unsupported";
}

async function showDeviceNotification(body: string, url: string) {
  if (currentPermission() !== "granted") return;

  // Through the service worker when there is one: it's the only way that works in an installed
  // PWA on mobile, and it lets sw.ts handle the tap (notificationclick).
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  const options: NotificationOptions = { body, icon: "/pwa-192x192.png", badge: "/pwa-64x64.png", data: { url } };

  if (registration) {
    await registration.showNotification("Moneta", options);
  } else {
    const notification = new window.Notification("Moneta", options);
    notification.onclick = () => {
      window.focus();
      router.navigate(url);
    };
  }
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  // Provider mounts outside the Router tree, but useModules() just hits the API directly —
  // no router context required. A ref mirrors the latest list so the SignalR effect
  // below (which subscribe once on mount) always resolve against fresh data instead
  // of whatever `modules` looked like on their first render.
  const { modules } = useModules();
  const modulesRef = useRef(modules);
  modulesRef.current = modules;

  const [devicePermission, setDevicePermission] = useState<DevicePermission>(currentPermission);

  async function requestDevicePermission() {
    if (!("Notification" in window)) return;
    setDevicePermission(await Notification.requestPermission());
  }

  const pendingBatchRef = useRef<Notification[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function upsert(notification: Notification) {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== notification.id);
      return [notification, ...next].sort(
        (a, b) => new Date(b.deliveredAt ?? 0).getTime() - new Date(a.deliveredAt ?? 0).getTime(),
      );
    });
  }

  async function markAsRead(id: string) {
    const current = notificationsRef.current.find((n) => n.id === id);
    if (current?.readAt) return;

    try {
      const updated = await notificationsApi.markAsRead(id);
      upsert(updated);
    } catch {
      // API indisponível: tenta de novo na próxima ação do usuário, sem travar a UI.
    }
  }

  function removeMany(ids: string[]) {
    const idSet = new Set(ids);
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)));
  }

  function flushPendingBatch() {
    const batch = pendingBatchRef.current;
    pendingBatchRef.current = [];
    debounceTimerRef.current = null;

    const countByModule = new Map<string, number>();
    for (const n of batch) {
      countByModule.set(n.moduleId, (countByModule.get(n.moduleId) ?? 0) + 1);
    }

    for (const [moduleId, count] of countByModule) {
      const module = modulesRef.current.find((m) => m.id === moduleId);
      void showDeviceNotification(
        `Você tem ${count} pendência${count > 1 ? "s" : ""} em ${module?.name ?? "um módulo"}`,
        module ? `/modulos/${module.slug}` : "/",
      );
    }
  }

  useEffect(() => {
    notificationsApi
      .list()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  // sw.ts asks an already-open window to navigate when a notification is tapped.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "navigate" && data.url) router.navigate(data.url);
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hubs/notifications`, { accessTokenFactory: () => getToken() ?? "" })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notification: Notification) => {
      upsert(notification);

      pendingBatchRef.current.push(notification);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(flushPendingBatch, BATCH_DEBOUNCE_MS);
    });

    let stopped = false;
    async function connectWithRetry() {
      while (!stopped) {
        try {
          await connection.start();
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
    void connectWithRetry();

    return () => {
      stopped = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      void connection.stop();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const groupedUnread = useMemo<GroupedUnread[]>(() => {
    const countByModule = new Map<string, number>();
    for (const n of notifications) {
      if (n.readAt) continue;
      countByModule.set(n.moduleId, (countByModule.get(n.moduleId) ?? 0) + 1);
    }
    return [...countByModule.entries()].map(([moduleId, count]) => {
      const module = modules.find((m) => m.id === moduleId);
      return {
        moduleId,
        label: module?.name ?? "Módulo removido",
        count,
        route: module ? `/modulos/${module.slug}` : "/",
      };
    });
  }, [notifications, modules]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        groupedUnread,
        markAsRead,
        removeMany,
        devicePermission,
        requestDevicePermission,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
