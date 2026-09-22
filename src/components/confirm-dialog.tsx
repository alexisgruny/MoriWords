"use client";

import { ReactNode, useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Boîte de dialogue de confirmation générique, utilisée avant toute action
// irréversible (ex. suppression d'une carte). Se ferme sur Échap ou clic
// en dehors du panneau.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="confirm-dialog-title" className="text-lg font-semibold text-[var(--ink)]">
          {title}
        </p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="secondary-button">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "primary-button confirm-danger-button" : "primary-button"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
