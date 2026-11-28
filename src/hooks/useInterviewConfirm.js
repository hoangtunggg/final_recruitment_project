// Promise-based confirmation (replaces window.confirm), rendered by <InterviewConfirmDialog />.
//   const { ask, request, settle } = useInterviewConfirm();
//   const yes = await ask({ titleKey, textKey, okKey, cancelKey });   // i18n keys in the `interview` namespace
// A second ask() while one dialog is open resolves false at once (never stacks two dialogs).
import { useCallback, useRef, useState } from "react";

export default function useInterviewConfirm() {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const ask = useCallback((options) => {
    if (resolverRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest(options);
    });
  }, []);

  const settle = useCallback((value) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setRequest(null);
    resolve?.(value);
  }, []);

  return { ask, request, settle };
}
