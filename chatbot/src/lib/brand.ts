export const BRAND = {
  colors: {
    bgBase: '#EDE8E3',
    bgAlt: '#F7F4F0',
    bgCard: '#FDFBF9',
    text: '#1C1C1C',
    textMuted: '#1C1C1C99',
    accent: '#8B2635',
    accentHover: '#6B1D28',
    accentSoft: '#8B26351A',
    border: 'rgba(28, 28, 28, 0.08)',
  },
  font: {
    family: 'Syne',
    weights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
    } as const,
  },
  radius: 4,
} as const;
