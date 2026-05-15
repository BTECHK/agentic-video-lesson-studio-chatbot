import "server-only";
import fs from "fs";
import path from "path";

export type {
  ToolSubFeature,
  ToolCapability,
  ToolData,
  SourceEntry,
  VendorSources,
} from "./content-types";
export { getCapabilityCount } from "./content-types";

import type { ToolData, VendorSources } from "./content-types";

const CONTENT_DIR = path.join(process.cwd(), "..", "content");
const TOOLS_DIR = path.join(CONTENT_DIR, "tools");
const SOURCES_DIR = path.join(CONTENT_DIR, "sources");

export function getAllTools(): ToolData[] {
  if (!fs.existsSync(TOOLS_DIR)) return [];

  return fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(TOOLS_DIR, f), "utf-8");
      return JSON.parse(raw) as ToolData;
    });
}

export function getToolById(id: string): ToolData | null {
  const filePath = path.join(TOOLS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ToolData;
}

export function getSourcesForVendor(vendorId: string): VendorSources | null {
  const filePath = path.join(SOURCES_DIR, `${vendorId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as VendorSources;
}

export function getAllSources(): VendorSources[] {
  if (!fs.existsSync(SOURCES_DIR)) return [];

  return fs
    .readdirSync(SOURCES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(SOURCES_DIR, f), "utf-8");
      return JSON.parse(raw) as VendorSources;
    });
}
