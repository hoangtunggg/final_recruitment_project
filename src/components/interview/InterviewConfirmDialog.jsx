import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";

/**
 * Native <dialog> opened with showModal(): everything behind it is inert (no Tab / click gets through).
 * `request` = { titleKey, textKey, okKey, cancelKey } from useInterviewConfirm; null = closed.
 * Esc or a click on the backdrop = cancel. The cancel button gets focus first (safe if Enter was just pressed
 * to send an answer), and focus goes back to the control that opened the dialog.
 */
const InterviewConfirmDialog = ({ request, onSettle }) => {
  const { t } = useTranslation("interview");
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (request && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!request && dialog.open) {
      dialog.close();
      const opener = openerRef.current;
      if (opener?.isConnected && !opener.disabled) opener.focus();
    }
  }, [request]);

  const handleBackdropClick = (event) => {
    const box = dialogRef.current.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;
    if (event.target === dialogRef.current && outside) onSettle(false);
  };

  return (
    <dialog
      ref={dialogRef}
      data-testid="interview-confirm"
      aria-labelledby="interview-confirm-title"
      aria-describedby="interview-confirm-text"
      onCancel={(event) => {
        event.preventDefault(); // Esc
        onSettle(false);
      }}
      onClick={handleBackdropClick}
      className="m-auto w-[min(480px,calc(100%-40px))] rounded-2xl border border-tint-line bg-surface p-7 text-ink shadow-2xl backdrop:bg-black/50"
    >
      <h2 id="interview-confirm-title" className="mb-2 text-2xl leading-8">
        {request ? t(request.titleKey) : ""}
      </h2>
      <p id="interview-confirm-text" className="text-muted">
        {request ? t(request.textKey) : ""}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button ref={cancelRef} variant="outline" data-testid="interview-confirm-cancel" onClick={() => onSettle(false)}>
          {request ? t(request.cancelKey) : ""}
        </Button>
        <Button data-testid="interview-confirm-ok" onClick={() => onSettle(true)}>
          {request ? t(request.okKey) : ""}
        </Button>
      </div>
    </dialog>
  );
};

export default InterviewConfirmDialog;
