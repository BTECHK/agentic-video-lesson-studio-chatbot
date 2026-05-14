import fs from 'node:fs';
import {
  LessonSchema,
  ToolSchema,
  SourceFileSchema,
  type Lesson,
  type Tool,
  type SourceFile,
} from '../../content/schemas/index';

export async function loadLesson(filePath: string): Promise<Lesson> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const result = LessonSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid lesson file ${filePath}: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

export async function loadToolData(filePath: string): Promise<Tool> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const result = ToolSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid tool file ${filePath}: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

export async function loadSourceFile(filePath: string): Promise<SourceFile> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const result = SourceFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid source file ${filePath}: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

export function validateLesson(
  data: unknown,
): { success: true; data: Lesson } | { success: false; errors: string[] } {
  const result = LessonSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );
  return { success: false, errors };
}

export function validateToolData(
  data: unknown,
): { success: true; data: Tool } | { success: false; errors: string[] } {
  const result = ToolSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );
  return { success: false, errors };
}
