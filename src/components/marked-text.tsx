import { Fragment } from "react";

// Affiche un texte de leçon avec sa mise en forme légère (voir LessonSection) :
// [は] en couleur (la partie dont parle la règle), **mot** en gras.
export function MarkedText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]*\]|\*\*[^*]*\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          return (
            <mark key={index} className="lesson-mark">
              {part.slice(1, -1)}
            </mark>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-[var(--ink)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
