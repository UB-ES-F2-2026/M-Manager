/** "Hola, Ana" uses only the first name; falls back to a plain greeting. */
export function getGreeting(name: string): string {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName ? `Hola, ${firstName}` : "Hola!";
}
