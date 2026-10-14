/**
 * Ойын пернелерін елемеу керек пе: адам мәтін жазып отырса,
 * модаль терезе ашық болса немесе Ctrl/Alt/Cmd басылса.
 */
export function shouldIgnoreGameKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (el) {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
  }
  return document.querySelector('[role="dialog"]') !== null;
}
