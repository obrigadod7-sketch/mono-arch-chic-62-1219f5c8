import { useEffect, useState } from "react";

/**
 * DebugErrorThrower
 *
 * Mantém compatibilidade com o evento global "lovable-debug-error", mas não
 * derruba mais a tela do app em preview/publicação.
 */
export const DebugErrorThrower = () => {
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

  useEffect(() => {
    if (!message) return;
    console.warn("Instrução de debug capturada sem quebrar a tela:", message);
    (window as any).__lovableDebugInstruction = message;
  }, [message]);

  return null;
};
