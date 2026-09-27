"use client";

import { ReactNode, useEffect, useRef } from "react";

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
// en dehors du panneau ; le focus est piégé à l'intérieur pendant qu'elle est
// ouverte, posé sur "Annuler" à l'ouverture (jamais sur l'action dangereuse),
// et rendu au bouton qui l'a ouverte à la fermeture.
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
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  // Garde la dernière version de onCancel sans la mettre en dépendance de
  // l'effet ci-dessous : sinon, comme les appelants passent presque toujours
  // une fonction recréée à chaque rendu, l'effet se relancerait à chaque
  // rendu du parent pendant que la boîte est ouverte et volerait le focus.
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancelRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      // Piège le focus dans le panneau : seuls les boutons qu'il contient
      // sont atteignables tant que la boîte est ouverte.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button");

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={panelRef}
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
          <button ref={cancelButtonRef} type="button" onClick={onCancel} className="secondary-button">
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
