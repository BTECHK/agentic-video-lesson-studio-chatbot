import { describe, it, expect } from 'vitest';
import { groupIntoProducts, type ToolData } from '@/lib/content-types';

function tool(o: Partial<ToolData> & { id: string }): ToolData {
  return {
    id: o.id,
    name: o.name ?? o.id,
    vendor: o.vendor ?? 'V',
    productId: o.productId ?? o.id,
    surface: o.surface ?? 'Web app',
    isPrimarySurface: o.isPrimarySurface ?? true,
    priority: o.priority ?? 'P0',
    description: o.description ?? 'd',
    url: o.url ?? 'https://example.com',
    capabilities: o.capabilities ?? {},
    sourceRefs: o.sourceRefs ?? [],
  };
}

describe('groupIntoProducts (chatbot)', () => {
  it('groups surfaces sharing a productId and names the product after its primary', () => {
    const products = groupIntoProducts([
      tool({ id: 'codex', name: 'Codex', productId: 'chatgpt', surface: 'Codex', isPrimarySurface: false }),
      tool({ id: 'chatgpt', name: 'ChatGPT', vendor: 'OpenAI', productId: 'chatgpt', isPrimarySurface: true }),
    ]);
    expect(products).toHaveLength(1);
    expect(products[0].productName).toBe('ChatGPT');
    expect(products[0].vendor).toBe('OpenAI');
    expect(products[0].surfaces[0].id).toBe('chatgpt');
    expect(products[0].surfaces).toHaveLength(2);
  });

  it('keeps a standalone tool as a single-surface product', () => {
    const products = groupIntoProducts([tool({ id: 'grok', productId: 'grok', isPrimarySurface: true })]);
    expect(products).toHaveLength(1);
    expect(products[0].surfaces).toHaveLength(1);
  });
});
