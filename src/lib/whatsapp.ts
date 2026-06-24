/** Construye un deep-link wa.me. Devuelve null si no hay numero configurado. */
export function buildWhatsappUrl(number: string, message: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
