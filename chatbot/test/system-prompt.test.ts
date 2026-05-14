import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from '@/lib/llm/system-prompt';

describe('getSystemPrompt', () => {
  it('includes Tutor persona for demo mode', () => {
    const prompt = getSystemPrompt('demo');
    expect(prompt).toContain('Tutor');
    expect(prompt).toContain('Sample Academy');
  });

  it('includes demo addendum for demo mode', () => {
    const prompt = getSystemPrompt('demo');
    expect(prompt).toContain('Demo Mode Scope');
    expect(prompt).toContain('Module 1');
  });

  it('excludes demo addendum for student mode', () => {
    const prompt = getSystemPrompt('student');
    expect(prompt).not.toContain('Demo Mode Scope');
  });

  it('includes bootstrap addendum in both modes', () => {
    const demoPrompt = getSystemPrompt('demo');
    const studentPrompt = getSystemPrompt('student');
    expect(demoPrompt).toContain('Bootstrap Mode');
    expect(studentPrompt).toContain('Bootstrap Mode');
  });

  it('includes citation formatting instructions', () => {
    const prompt = getSystemPrompt('student');
    expect(prompt).toContain('[Source:');
    expect(prompt).toContain('Citation Rules');
  });

  it('includes boundary rules', () => {
    const prompt = getSystemPrompt('student');
    expect(prompt).toContain('Boundaries');
    expect(prompt).toContain('NOT about AI tools');
  });
});
