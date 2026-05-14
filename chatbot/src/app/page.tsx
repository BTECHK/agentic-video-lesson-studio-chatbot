"use client";

import { useState } from "react";
import type { AccessMode } from "@/lib/types";

export default function Home() {
  const [mode, setMode] = useState<AccessMode | null>(null);

  if (mode) {
    return (
      <main
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div
          className="p-8 text-center"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Mode: {mode}
          </p>
          <p className="mt-2" style={{ fontWeight: 600 }}>
            Chat interface coming in Plan 03
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-sm p-8 text-center"
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}
      >
        <h1 className="text-3xl mb-1" style={{ fontWeight: 800 }}>
          Tutor
        </h1>
        <p className="mb-8" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Sample Academy AI Teaching Assistant
        </p>

        <div className="space-y-3">
          <button
            onClick={() => setMode("demo")}
            className="w-full py-3 px-4 text-white font-semibold cursor-pointer"
            style={{
              backgroundColor: "var(--accent)",
              borderRadius: "var(--radius)",
              border: "none",
            }}
          >
            Try Demo
          </button>
          <button
            onClick={() => setMode("student")}
            className="w-full py-3 px-4 font-semibold cursor-pointer"
            style={{
              backgroundColor: "transparent",
              borderRadius: "var(--radius)",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
            }}
          >
            I&#39;m a Student
          </button>
        </div>
      </div>
    </main>
  );
}
