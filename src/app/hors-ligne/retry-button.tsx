"use client";

// Recharge la page demandée : utile dès que le réseau revient.
export function RetryButton() {
  return (
    <button type="button" onClick={() => window.location.reload()} className="primary-button">
      Réessayer
    </button>
  );
}
