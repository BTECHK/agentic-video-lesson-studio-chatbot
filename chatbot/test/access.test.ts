import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateAccessCode, getDemoModuleScope, isModuleAccessible } from '@/lib/access';

describe('validateAccessCode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts the correct access code', () => {
    expect(validateAccessCode('demo-access-code')).toBe(true);
  });

  it('rejects an incorrect access code', () => {
    expect(validateAccessCode('wrong-code')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateAccessCode('')).toBe(false);
  });

  it('uses ACCESS_CODE env var when set', () => {
    vi.stubEnv('ACCESS_CODE', 'custom-code-123');
    expect(validateAccessCode('custom-code-123')).toBe(true);
    expect(validateAccessCode('demo-access-code')).toBe(false);
  });

  it('bypasses validation when dev bypass is enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_DEV_BYPASS', 'true');
    expect(validateAccessCode('anything')).toBe(true);
  });

  it('rejects wrong-length codes without timing leak', () => {
    expect(validateAccessCode('short')).toBe(false);
    expect(validateAccessCode('this-is-way-too-long-to-be-correct')).toBe(false);
  });
});

describe('getDemoModuleScope', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to module-1', () => {
    expect(getDemoModuleScope()).toBe('module-1');
  });

  it('uses DEMO_MODULE_SCOPE env var when set', () => {
    vi.stubEnv('DEMO_MODULE_SCOPE', 'module-3');
    expect(getDemoModuleScope()).toBe('module-3');
  });
});

describe('isModuleAccessible', () => {
  it('allows students access to any module', () => {
    expect(isModuleAccessible('module-1', 'student')).toBe(true);
    expect(isModuleAccessible('module-5', 'student')).toBe(true);
  });

  it('restricts demo users to demo scope', () => {
    expect(isModuleAccessible('module-1', 'demo')).toBe(true);
    expect(isModuleAccessible('module-2', 'demo')).toBe(false);
  });
});
