import { describe, expect, it } from 'vitest';
import { productMatchesQuery } from './search';

const waffle = {
  name: 'Waffle Tee',
  description: 'Heavyweight cotton with a black wash',
  slug: 'waffle-tee',
  category: 'topwear',
  tags: ['new', 'core'],
  metadata: { tags: ['drop-01'], category: 'shortsleeve' },
};

describe('productMatchesQuery', () => {
  it('matches all products when the query is empty or whitespace', () => {
    expect(productMatchesQuery(waffle, '')).toBe(true);
    expect(productMatchesQuery(waffle, '   ')).toBe(true);
    expect(productMatchesQuery({}, '')).toBe(true);
  });

  it('matches name, description, slug, and category', () => {
    expect(productMatchesQuery(waffle, 'waffle')).toBe(true);
    expect(productMatchesQuery(waffle, 'heavyweight')).toBe(true);
    expect(productMatchesQuery(waffle, 'waffle-tee')).toBe(true);
    expect(productMatchesQuery(waffle, 'topwear')).toBe(true);
  });

  it('matches tags array and tags string', () => {
    expect(productMatchesQuery(waffle, 'core')).toBe(true);
    expect(productMatchesQuery({ ...waffle, tags: 'limited, restock' }, 'restock')).toBe(
      true
    );
  });

  it('matches metadata.tags and metadata.category', () => {
    expect(productMatchesQuery(waffle, 'drop-01')).toBe(true);
    expect(productMatchesQuery(waffle, 'shortsleeve')).toBe(true);
  });

  it('requires every token (AND) for multi-word queries', () => {
    expect(productMatchesQuery(waffle, 'waffle black')).toBe(true);
    expect(productMatchesQuery(waffle, 'waffle missing')).toBe(false);
    expect(productMatchesQuery(waffle, 'core topwear')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(productMatchesQuery(waffle, 'WAFFLE')).toBe(true);
    expect(productMatchesQuery(waffle, 'TopWear')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(productMatchesQuery(waffle, 'hoodie')).toBe(false);
    expect(productMatchesQuery({}, 'tee')).toBe(false);
  });
});
