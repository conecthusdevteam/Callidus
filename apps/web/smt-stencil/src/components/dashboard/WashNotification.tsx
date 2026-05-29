import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { WashOrigin } from "@/data/mockWashes";

export interface WashNotificationItem {
  id: string;
  origin: WashOrigin;
}

interface Props {
  notifications: WashNotificationItem[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
  isInline?: boolean;
  currentTab?: "stencil" | "placas";
}

export function WashNotification({
  notifications,
  onDismiss,
  autoDismissMs = 10_000,
  isInline = false,
  currentTab,
}: Props) {
  const filtered = currentTab
    ? notifications.filter((n) => {
        if (currentTab === "stencil") return n.origin === "stencil";
        if (currentTab === "placas") return n.origin === "placa";
        return true;
      })
    : notifications;

  if (filtered.length === 0) return null;

  if (isInline) {
    const current = filtered[0];
    return (
      <InlineNotificationItem
        key={current.id}
        item={current}
        onDismiss={onDismiss}
        autoDismissMs={autoDismissMs}
      />
    );
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notificações de novas lavagens"
    >
      {filtered.map((n) => (
        <StackedNotificationItem
          key={n.id}
          item={n}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
}

function StackedNotificationItem({
  item,
  onDismiss,
  autoDismissMs,
}: {
  item: WashNotificationItem;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}) {
  const [visible, setVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const inId = window.setTimeout(() => setVisible(true), 10);
    const outId = window.setTimeout(
      () => onDismissRef.current(item.id),
      autoDismissMs,
    );
    return () => {
      window.clearTimeout(inId);
      window.clearTimeout(outId);
    };
  }, [item.id, autoDismissMs]);

  const isStencil = item.origin === "stencil";
  const message = isStencil
    ? "Lavagem de stencil registrada."
    : "Lavagem de placa registrada.";

  const backgroundColor = isStencil ? "#C3DDFD" : "#D1E7DD";
  const borderColor = isStencil ? "#76A9FA" : "#A3CFBB";
  const textColor = isStencil ? "#1B427F" : "#2B8E37";
  const iconColor = isStencil ? "#1C64F2" : "#2B8E37";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minWidth: 260,
        maxWidth: 320,
        borderRadius: 6,
        padding: "8px 12px",
        backgroundColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: 13,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
      className="flex items-center justify-between gap-2"
    >
      <span className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: iconColor, flexShrink: 0 }}
        >
          <circle cx="8" cy="8" r="7" stroke={iconColor} strokeWidth="1.5" />
          <path
            d="M8 7v4"
            stroke={iconColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="5" r="0.75" fill={iconColor} />
        </svg>
        {message}
      </span>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => onDismissRef.current(item.id)}
        style={{ color: textColor, opacity: 0.6 }}
        className="hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function InlineNotificationItem({
  item,
  onDismiss,
  autoDismissMs,
}: {
  item: WashNotificationItem;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}) {
  const [visible, setVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const inId = window.setTimeout(() => setVisible(true), 10);
    const outId = window.setTimeout(
      () => onDismissRef.current(item.id),
      autoDismissMs,
    );
    return () => {
      window.clearTimeout(inId);
      window.clearTimeout(outId);
    };
  }, [item.id, autoDismissMs]);

  const isStencil = item.origin === "stencil";
  const message = isStencil
    ? "Lavagem de stencil registrada."
    : "Lavagem de placa registrada.";

  const backgroundColor = isStencil ? "#C3DDFD" : "#D1E7DD";
  const borderColor = isStencil ? "#76A9FA" : "#A3CFBB";
  const textColor = isStencil ? "#1B427F" : "#2B8E37";
  const iconColor = isStencil ? "#1C64F2" : "#2B8E37";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: "100%",
        maxWidth: 520,
        minHeight: 40,
        borderRadius: 4,
        padding: "8px 16px",
        backgroundColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: 14,
        gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
      className="flex items-center justify-between shadow-card"
    >
      <span className="flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: iconColor, flexShrink: 0 }}
        >
          <circle cx="8" cy="8" r="7" stroke={iconColor} strokeWidth="1.5" />
          <path
            d="M8 7v4"
            stroke={iconColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="5" r="0.75" fill={iconColor} />
        </svg>
        {message}
      </span>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => onDismissRef.current(item.id)}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
