import { useEffect, useRef } from "react";
import InterviewChatBubble from "./InterviewChatBubble";

// The composer sticks to the bottom of the window and covers the newest bubble, so scroll the whole page down.
// force = false while tokens stream: only follow if the user is already near the end (do not yank a reader).
const scrollChatEnd = (force) => {
  const root = document.documentElement;
  if (force || window.innerHeight + window.scrollY >= root.scrollHeight - 160) {
    window.scrollTo({ top: root.scrollHeight });
  }
};

/** The conversation: read-only bubbles in a live region (aria-busy while the AI question is streaming). */
const InterviewChatLog = ({ messages }) => {
  const lastCountRef = useRef(0);
  useEffect(() => {
    const grew = messages.length !== lastCountRef.current;
    lastCountRef.current = messages.length;
    scrollChatEnd(grew);
  }, [messages]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-busy={messages.some((message) => message.streaming)}
      data-testid="interview-chat"
      className="mt-10 flex min-h-40 flex-col gap-4"
    >
      {messages.map((message) => (
        <InterviewChatBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

export default InterviewChatLog;
