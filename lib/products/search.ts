export function productMatchesQuery(
  product: {
    name?: string;
    description?: string;
    slug?: string;
    category?: string;
    tags?: string[] | string;
    metadata?: Record<string, unknown>;
  },
  query: string
): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = collectSearchText(product).toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function collectSearchText(product: {
  name?: string;
  description?: string;
  slug?: string;
  category?: string;
  tags?: string[] | string;
  metadata?: Record<string, unknown>;
}): string {
  const parts: string[] = [
    stringify(product.name),
    stringify(product.description),
    stringify(product.slug),
    stringify(product.category),
    stringifyField(product.tags),
    stringifyField(product.metadata?.tags),
    stringifyField(product.metadata?.category),
  ];
  return parts.filter(Boolean).join(' ');
}

function stringify(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringifyField(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => stringify(entry)).filter(Boolean).join(' ');
  }
  return stringify(value);
}
