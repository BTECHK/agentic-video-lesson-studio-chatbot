import type { AccessMode } from './types';

export function getAccessMode(): AccessMode {
  return 'demo';
}

export function validateAccessCode(code: string): boolean {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
    return true;
  }
  const validCode = process.env.ACCESS_CODE || 'demo-access-code';
  return code === validCode;
}

export function getDemoModuleScope(): string {
  return process.env.DEMO_MODULE_SCOPE || 'module-1';
}

export function isModuleAccessible(moduleId: string, mode: AccessMode): boolean {
  if (mode === 'student') return true;
  const demoScope = getDemoModuleScope();
  return moduleId === demoScope;
}
