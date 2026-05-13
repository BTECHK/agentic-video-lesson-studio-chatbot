export const BRAND = {
  colors: {
    bgBase: '#EDE8E3',
    text: '#1C1C1C',
    accent: '#8B2635',
  },
  font: {
    family: 'Syne',
    weights: {
      regular: '400',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
    } as const,
  },
  radius: 4,
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

export type BrandColors = typeof BRAND.colors;
export type BrandFontWeights = typeof BRAND.font.weights;
