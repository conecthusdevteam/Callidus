import { useEffect, useState } from "react";
import { CircleAlert, X } from "lucide-react";
import type { WashOrigin } from "@/data/mockWashes";

export interface WashNotificationItem {
  id: string;
  origin: WashOrigin;
}

interface Props {
  notifications: WashNotificationItem[];
  onDismiss: (id: string) => void;
  /** Tempo (ms) até auto-dismiss. Default 6000. */
  autoDismissMs?: number;
}

/**
 * Notificação de novo registro de lavagem (img1).
 * - Fundo #D1E7DD, borda #A3CFBB (1px), texto #2B8E37 (Geist Medium 14px)
 * - Largura fixa 535px, altura 40px, raio 4px, padding 8px/16px
 * - Mensagem por origem:
 *   - stencil → "Lavagem de stencil registrada."
 *   - placa  → "Lavagem de placa registrada."
 */
export function WashNotification({ notifications, onDismiss, autoDismissMs = 6000 }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed right-6 top-20 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notificações de novas lavagens"
    >
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          item={n}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  item,
  onDismiss,
  autoDismissMs,
}: {
  item: WashNotificationItem;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inId = window.setTimeout(() => setVisible(true), 10);
    const outId = window.setTimeout(() => onDismiss(item.id), autoDismissMs);
    return () => {
      window.clearTimeout(inId);
      window.clearTimeout(outId);
    };
  }, [item.id, autoDismissMs, onDismiss]);

  const message =
    item.origin === "stencil"
      ? "Lavagem de stencil registrada."
      : "Lavagem de placa registrada.";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: 535,
        height: 40,
        borderRadius: 4,
        padding: "8px 16px",
        backgroundColor: "hsl(var(--toast-success-bg))",
        border: "1px solid hsl(var(--toast-success-border))",
        color: "hsl(var(--toast-success-fg))",
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
        <CircleAlert className="h-5 w-5" aria-hidden />
        {message}
      </span>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => onDismiss(item.id)}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
