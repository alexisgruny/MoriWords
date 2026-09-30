"use client";

import { useEffect, useState } from "react";

// Parcours terminé (ou palier N5 réussi) ? Gardé pour la session dans le
// navigateur : le menu le lit sur chaque page sans rappeler l'API.
const STORAGE_PREFIX = "moriwords-course-finished:";
const CHANGE_EVENT = "moriwords-course-changed";

function readCached(userId: string): boolean | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_PREFIX + userId);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

function writeCached(userId: string, finished: boolean) {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + userId, finished ? "1" : "0");
  } catch {
    // Stockage indisponible : on redemandera à la prochaine page.
  }
}

// À appeler après avoir validé une leçon : l'état sera relu.
export function forgetCourseStatus() {
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Rien à oublier.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useCourseFinished(userId: string | undefined): boolean {
  const [finished, setFinished] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let isCancelled = false;
    const cached = readCached(userId);
    const load: Promise<boolean> =
      cached !== null
        ? Promise.resolve(cached)
        : fetch("/api/course")
            .then((response) => (response.ok ? (response.json() as Promise<{ finished?: boolean }>) : null))
            .then((data) => {
              const value = data?.finished === true;
              if (data) writeCached(userId, value);
              return value;
            });
    load
      .then((value) => {
        if (!isCancelled) setFinished(value);
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [userId, version]);

  return userId ? finished : false;
}
