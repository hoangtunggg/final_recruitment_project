// Message list of the interview chat (ported from interview-chat.js). Each turn is a READ-ONLY bubble:
//   { id, who: "ai" | "me", source?: "text" | "voice", text, streaming?, pending?, rejected?,
//     meta?: { phase, topic, action }, notes?: [{ key } | { metrics }], metrics? }
// Notes and tags hold i18n keys / raw data (never translated text) so a language switch re-translates them.
import { useCallback, useRef, useState } from "react";

export default function useInterviewChat() {
  const [messages, setMessages] = useState([]);
  const lastId = useRef(0);

  /** Appends a bubble and returns its id. */
  const add = useCallback((message) => {
    lastId.current += 1;
    const id = lastId.current;
    setMessages((list) => [...list, { id, ...message }]);
    return id;
  }, []);

  /** Merges a patch (object, or function of the current bubble) into one bubble. */
  const patch = useCallback((id, change) => {
    setMessages((list) =>
      list.map((message) =>
        message.id === id
          ? { ...message, ...(typeof change === "function" ? change(message) : change) }
          : message
      )
    );
  }, []);

  /** Streaming: adds one token to a bubble. */
  const append = useCallback((id, token) => patch(id, (m) => ({ text: m.text + token })), [patch]);

  const remove = useCallback((id) => setMessages((list) => list.filter((m) => m.id !== id)), []);

  /** Small line under a bubble (reason it was not counted, delivery metrics). */
  const addNote = useCallback(
    (id, note) => patch(id, (m) => ({ notes: [...(m.notes || []), note] })),
    [patch]
  );

  /** A turn that did not count (no speech heard, send failed): keep the bubble, dim it, say why. */
  const markRejected = useCallback(
    (id, note) => patch(id, (m) => ({ rejected: true, notes: [...(m.notes || []), note] })),
    [patch]
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, add, patch, append, remove, addNote, markRejected, clear };
}
