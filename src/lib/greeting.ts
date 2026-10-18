/** "Hola, Ana": greets by first name, or with a plain "Hola!" when there is none. */
export function getGreeting(name: string): string {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName ? `Hola, ${firstName}` : "Hola!";
}
