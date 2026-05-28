import { useEffect, useState } from "react";

/**
 * Componente sem UI. Escuta o evento "lovable-debug-error" e, durante o
 * render, lança um Error com a mensagem recebida. Deve ficar FORA de
 * qualquer ErrorBoundary/Suspense para que o erro escape ao overlay global.
 */
const DebugErrorThrower = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.length > 0) {
        setMessage(detail);
      }
    };
    window.addEventListener("lovable-debug-error", handler as EventListener);
    return () => window.removeEventListener("lovable-debug-error", handler as EventListener);
  }, []);

  if (message) {
    throw new Error(message);
  }

  return null;
};

export default DebugErrorThrower;