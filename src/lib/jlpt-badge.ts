// Classe CSS du badge de niveau JLPT (voir .jlpt-badge dans globals.css) :
// N5-N4 en vert, N3 en ambre, N2-N1 en vermillon, neutre sinon.
export function jlptBadgeClass(level: string | null | undefined): string {
  if (level === "N5" || level === "N4") {
    return "jlpt-badge jlpt-easy";
  }
  if (level === "N3") {
    return "jlpt-badge jlpt-mid";
  }
  if (level === "N2" || level === "N1") {
    return "jlpt-badge jlpt-hard";
  }
  return "jlpt-badge";
}
