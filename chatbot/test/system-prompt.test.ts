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

  // New tests for content injection
  it('includes content context when provided', () => {
    const prompt = getSystemPrompt('student', 'some tool data about Claude');
    expect(prompt).toContain('Course Content Repository');
    expect(prompt).toContain('some tool data about Claude');
    expect(prompt).not.toContain('Bootstrap Mode');
  });

  it('falls back to bootstrap when contentContext is empty string', () => {
    const prompt = getSystemPrompt('student', '');
    expect(prompt).toContain('Bootstrap Mode');
    expect(prompt).not.toContain('Course Content Repository');
  });

  it('falls back to bootstrap when contentContext is undefined', () => {
    const prompt = getSystemPrompt('student', undefined);
    expect(prompt).toContain('Bootstrap Mode');
    expect(prompt).not.toContain('Course Content Repository');
  });

  it('includes both content context and demo addendum for demo mode with content', () => {
    const prompt = getSystemPrompt('demo', 'ChatGPT tool data here');
    expect(prompt).toContain('Course Content Repository');
    expect(prompt).toContain('ChatGPT tool data here');
    expect(prompt).toContain('Demo Mode Scope');
  });

  it('content context replaces bootstrap addendum', () => {
    const prompt = getSystemPrompt('student', 'real course content');
    expect(prompt).not.toContain('course content coming soon');
    expect(prompt).toContain('Course Content Repository');
    expect(prompt).toContain('real course content');
  });

  // Office Hours mode (CHAT-04)
  it('defaults to TA mode with no Office Hours section', () => {
    const prompt = getSystemPrompt('student', 'real course content');
    expect(prompt).not.toContain('Office Hours Mode');
  });

  it('includes an Office Hours section when mode is office-hours', () => {
    const prompt = getSystemPrompt('student', 'real course content', 'office-hours');
    expect(prompt).toContain('Office Hours Mode');
  });

  it('relaxes the strict refusal boundary in Office Hours mode', () => {
    const prompt = getSystemPrompt('student', 'real course content', 'office-hours');
    expect(prompt.toLowerCase()).toContain('tangential');
  });

  it('keeps the Tutor persona and citation rules in Office Hours mode', () => {
    const prompt = getSystemPrompt('student', 'real course content', 'office-hours');
    expect(prompt).toContain('Tutor');
    expect(prompt).toContain('[Source:');
  });
});
