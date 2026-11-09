/** Two letters for the circular avatar next to an asset or debt name. */
export function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toLocaleUpperCase("ca-ES");
  }
  return (parts[0][0] + parts[1][0]).toLocaleUpperCase("ca-ES");
}
