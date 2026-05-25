import { describe, it, expect } from 'vitest';
import { groupIntoProducts, validateProductInvariant, type Tool } from '../content/schemas';

function tool(overrides: Partial<Tool> & { id: string }): Tool {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    vendor: overrides.vendor ?? 'V',
    productId: overrides.productId ?? overrides.id,
    surface: overrides.surface ?? 'Web app',
    isPrimarySurface: overrides.isPrimarySurface ?? true,
    priority: overrides.priority ?? 'P0',
    description: overrides.description ?? 'd',
    url: overrides.url ?? 'https://example.com',
    capabilities: overrides.capabilities ?? {},
    sourceRefs: overrides.sourceRefs ?? [],
  } as Tool;
}

describe('groupIntoProducts', () => {
  it('groups surfaces sharing a productId into one product', () => {
    const products = groupIntoProducts([
      tool({ id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', productId: 'chatgpt', isPrimarySurface: true }),
      tool({ id: 'codex', name: 'Codex', vendor: 'OpenAI', productId: 'chatgpt', surface: 'Codex', isPrimarySurface: false }),
    ]);
    expect(products).toHaveLength(1);
    expect(products[0].surfaces).toHaveLength(2);
  });

  it('names the product after its primary surface', () => {
    const [product] = groupIntoProducts([
      tool({ id: 'codex', name: 'Codex', productId: 'chatgpt', surface: 'Codex', isPrimarySurface: false }),
      tool({ id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', productId: 'chatgpt', isPrimarySurface: true }),
    ]);
    expect(product.productName).toBe('ChatGPT');
    expect(product.vendor).toBe('OpenAI');
    expect(product.primary.id).toBe('chatgpt');
  });

  it('lists the primary surface first regardless of input order', () => {
    const [product] = groupIntoProducts([
      tool({ id: 'codex', productId: 'chatgpt', isPrimarySurface: false }),
      tool({ id: 'chatgpt', productId: 'chatgpt', isPrimarySurface: true }),
    ]);
    expect(product.surfaces[0].id).toBe('chatgpt');
  });

  it('keeps a standalone tool as a single-surface product', () => {
    const products = groupIntoProducts([tool({ id: 'grok', productId: 'grok', isPrimarySurface: true })]);
    expect(products).toHaveLength(1);
    expect(products[0].surfaces).toHaveLength(1);
  });
});

describe('validateProductInvariant', () => {
  it('returns no errors when each product has exactly one primary surface', () => {
    expect(
      validateProductInvariant([
        tool({ id: 'chatgpt', productId: 'chatgpt', isPrimarySurface: true }),
        tool({ id: 'codex', productId: 'chatgpt', isPrimarySurface: false }),
      ]),
    ).toEqual([]);
  });

  it('flags a product with two primary surfaces', () => {
    const errors = validateProductInvariant([
      tool({ id: 'a', productId: 'p', isPrimarySurface: true }),
      tool({ id: 'b', productId: 'p', isPrimarySurface: true }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('p');
  });

  it('flags a product with no primary surface', () => {
    const errors = validateProductInvariant([tool({ id: 'a', productId: 'p', isPrimarySurface: false })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('p');
  });
});
