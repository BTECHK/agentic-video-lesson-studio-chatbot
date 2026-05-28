import { timingSafeEqual } from 'crypto';
import type { AccessMode } from './types';

export function validateAccessCode(code: string): boolean {
  // Dev-only bypass: explicit opt-in AND never in production, so it cannot be
  // enabled in a production build even if the flag leaks into the environment.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
  ) {
    return true;
  }
  // Fail closed: no hardcoded fallback. A committed default ('demo-access-code')
  // is not a secret — with ACCESS_CODE unset, deny all access.
  const validCode = process.env.ACCESS_CODE;
  if (!validCode) return false;
  if (code.length !== validCode.length) return false;
  return timingSafeEqual(Buffer.from(code), Buffer.from(validCode));
}

export function getDemoModuleScope(): string {
  return process.env.DEMO_MODULE_SCOPE || 'module-1';
}

export function isModuleAccessible(moduleId: string, mode: AccessMode): boolean {
  if (mode === 'student') return true;
  return moduleId === getDemoModuleScope();
}
