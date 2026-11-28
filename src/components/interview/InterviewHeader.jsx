import { FiClock } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../common/LanguageToggle";
import ThemeToggle from "../common/ThemeToggle";
import { Brand, TopBar } from "../ui";
import useAuth from "../../hooks/useAuth";
import { useEnumLabel } from "../../i18n/helpers";
import { formatClock, initialsOf } from "./interview-format";

/**
 * Header of the interview page (the public Navbar is hidden here): 5-colour bar, brand, countdown (only while
 * the interview runs), language / theme switches and the signed-in user.
 * `remainingSeconds` = null hides the countdown; `canLeave` = false while an interview is running, so the brand
 * is not a link that would throw the session away.
 */
const InterviewHeader = ({ remainingSeconds = null, canLeave = true }) => {
  const { t } = useTranslation("interview");
  const { user } = useAuth();
  const enumLabel = useEnumLabel();

  return (
    <>
      <TopBar />
      <header className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:pt-10">
        {canLeave ? (
          <Link to="/" aria-label={t("header.backHome")} className="rounded-control">
            <Brand />
          </Link>
        ) : (
          <Brand />
        )}
        <div className="flex items-center gap-2 sm:gap-5">
          {remainingSeconds !== null && (
            <div
              role="timer"
              title={t("header.timerTitle")}
              className="inline-flex items-center gap-2 rounded-pill border border-brand-red bg-brand-red/5 px-4 py-2 font-semibold text-danger"
            >
              <FiClock aria-hidden="true" className="h-4 w-4" />
              <span data-testid="interview-timer" className="tabular-nums">
                {formatClock(remainingSeconds)}
              </span>
            </div>
          )}
          <LanguageToggle size="sm" />
          <ThemeToggle size="sm" />
          <span aria-hidden="true" className="hidden h-8 w-px bg-line-strong sm:block" />
          <div className="flex items-center gap-2" data-testid="interview-user">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white ring-[5px] ring-primary-500/15"
            >
              {initialsOf(user?.name)}
            </span>
            <span className="hidden flex-col leading-tight md:flex">
              <span className="max-w-[10rem] truncate font-semibold">{user?.name}</span>
              <span className="text-xs text-muted">{enumLabel("userRole", user?.role)}</span>
            </span>
          </div>
        </div>
      </header>
    </>
  );
};

export default InterviewHeader;
