"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type PermissionState = "default" | "granted" | "denied";

interface UsePushNotificationReturn {
  /** Current permission state */
  permission: PermissionState;
  /** Whether notifications are supported in this browser */
  isSupported: boolean;
  /** Request permission from the user */
  requestPermission: () => Promise<boolean>;
  /** Send a browser notification */
  notify: (title: string, options?: NotificationOptions) => void;
}

export function usePushNotification(): UsePushNotificationReturn {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission as PermissionState);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      return result === "granted";
    } catch {
      return false;
    }
  }, [isSupported]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      // Deduplicate: don't show the same notification within 5 minutes
      const key = `${title}:${options?.body || ""}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);
      setTimeout(() => notifiedRef.current.delete(key), 5 * 60 * 1000);

      try {
        const notification = new Notification(title, {
          icon: "/toki-logo.png",
          badge: "/toki-icon.png",
          ...options,
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10_000);

        // Focus window on click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch {
        // Notification constructor may fail in some contexts
      }
    },
    [isSupported, permission]
  );

  return { permission, isSupported, requestPermission, notify };
}
