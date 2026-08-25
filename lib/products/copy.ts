/**
 * Client-specified catalog copy overlays.
 * Only fills gaps named in the feedback checklist — never invents new products.
 */

const GSM_IN_TITLE = /\s*\d{2,4}\s*-?\s*GSM\b/gi;

/** Strip GSM tokens from titles. GSM belongs in specs/description, not the name. */
export function displayProductName(name: string): string {
  return name
    .replace(GSM_IN_TITLE, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\)/g, ')')
    .trim();
}

export function extractGsmSpec(text: string): string | null {
  const match = text.match(/(\d{2,4})\s*-?\s*GSM/i);
  return match ? `${match[1]} GSM` : null;
}

export function withClientProductCopy(
  slug: string,
  name: string,
  description: string
): string {
  const hay = `${slug} ${name} ${description}`;
  const isWaffle = /waffle/i.test(hay);
  let next = description || '';

  if (isWaffle) {
    next = next.replace(/350\s*-?\s*GSM/gi, '220 GSM');
    if (!/220\s*-?\s*GSM/i.test(next)) {
      next = next.trim()
        ? `${next.trim()} 220 GSM lightweight waffle-knit — thermal texture without the weight.`
        : '220 GSM lightweight waffle-knit — thermal texture without the weight.';
    }
    return next;
  }

  const gsmFromName = extractGsmSpec(name);
  if (gsmFromName && !/\d{2,4}\s*-?\s*GSM/i.test(next)) {
    next = next.trim()
      ? `${next.trim()} Specifications: ${gsmFromName}.`
      : `Specifications: ${gsmFromName}.`;
  }
  return next;
}
