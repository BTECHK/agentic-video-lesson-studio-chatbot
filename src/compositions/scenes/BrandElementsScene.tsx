import React from 'react';
import { BRAND } from '../../brand/tokens';
import { useSpringScale } from '../../lib/animations';

interface CardProps {
  label: string;
  delay: number;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ label, delay, children }) => {
  const anim = useSpringScale(delay);

  return (
    <div
      style={{
        ...anim,
        backgroundColor: '#FFFFFF',
        borderRadius: BRAND.radius,
        padding: 32,
        width: 300,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {children}
      <div
        style={{
          fontFamily: BRAND.font.family,
          fontSize: 20,
          fontWeight: BRAND.font.weights.semiBold,
          color: BRAND.colors.text,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const BrandElementsScene: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: BRAND.colors.bgBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
      }}
    >
      <Card label="Background" delay={0}>
        <div
          style={{
            width: 120,
            height: 80,
            backgroundColor: '#EDE8E3',
            borderRadius: BRAND.radius,
            border: '2px solid #D5D0CB',
          }}
        />
      </Card>

      <Card label="Accent" delay={6}>
        <div
          style={{
            width: 120,
            height: 80,
            backgroundColor: '#8B2635',
            borderRadius: BRAND.radius,
          }}
        />
      </Card>

      <Card label="Radius" delay={12}>
        <div
          style={{
            width: 120,
            height: 80,
            backgroundColor: BRAND.colors.accent,
            borderRadius: 4,
            border: `2px solid ${BRAND.colors.text}`,
          }}
        />
      </Card>
    </div>
  );
};
