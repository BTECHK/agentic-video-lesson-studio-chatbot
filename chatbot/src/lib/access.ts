import { timingSafeEqual } from 'crypto';
import type { AccessMode } from './types';

export function validateAccessCode(code: string): boolean {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
    return true;
  }
  const validCode = process.env.ACCESS_CODE || 'demo-access-code';
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
