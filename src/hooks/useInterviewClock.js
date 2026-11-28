// Countdown of the interview (seconds left), ticking once per second while `running`.
// Returns null when the clock is not running so the header hides the timer.
import { useEffect, useState } from "react";

export default function useInterviewClock({ running, startedAt, durationMinutes }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (!running || !startedAt) return null;
  // `now` can still hold the value from before the interview started for up to a second: clamp elapsed at 0.
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  return Math.max(0, durationMinutes * 60 - elapsed);
}
