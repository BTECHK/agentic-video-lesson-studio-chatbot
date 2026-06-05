# 05 · Content schema

This is the JSON shape that drives every animated lesson. The schema is **versioned** so we can evolve it without breaking old lessons. Today: **v1.0**.

If you change this schema in a breaking way, bump `schemaVersion`, write a migrator in `templates/lesson-renderer.jsx`, and tell Instructor.

---

## Top-level structure

```json
{
  "schemaVersion": "1.0",
  "id": "module-1",
  "lesson": {
    "title": "How this course works.",
    "topic": "Topic 1",
    "module": "Module 1 of 3",
    "duration": 104,
    "brandLabel": "Sample Academy"
  },
  "scenes": [
    { "id": "cover", "type": "cover", "start": 0, "duration": 8, ... },
    { "id": "journey", "type": "journey-map", "start": 8, "duration": 7, ... },
    ...
  ],
  "speakerNotes": [
    "Optional script for the voiceover. Indexed by scene order."
  ],
  "meta": {
    "createdAt": "2026-05-13",
    "lastUpdated": "2026-05-13",
    "authors": ["Course Instructor"],
    "factCheckedAt": null
  }
}
```

---

## Field reference

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `schemaVersion` | string | yes | `"1.0"` today. Lock in once stable. |
| `id` | string | yes | Slug. Used as filename (`lessons/<id>.html`) and as `persistKey` for the playhead. **Never rename after publish.** |
| `lesson.title` | string | yes | Plain text (no asterisks). The page `<title>`. |
| `lesson.topic` | string | yes | E.g. `"Topic 1"`. Shown in chrome. |
| `lesson.module` | string | yes | E.g. `"Module 1 of 3"`. |
| `lesson.duration` | number | yes | Total seconds. Must equal `last scene.start + last scene.duration`. |
| `lesson.brandLabel` | string | optional | Defaults to `"Sample Academy"`. Used in the top-left wordmark. |
| `scenes` | array | yes | Ordered list of scenes. Order is render order. |
| `speakerNotes` | string[] | optional | Per-scene narration script. Indexed by scene order. Position 0 = first scene. Use `""` for scenes without narration. |
| `meta.factCheckedAt` | string \| null | optional | ISO date of last `/accuracy-sweep` pass. |

### Scene fields (common to all types)

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Slug. Unique within the lesson. Stable across edits. |
| `type` | string | yes | One of the catalog types. See `03-scene-catalog.md`. |
| `start` | number | yes | Scene start in seconds. |
| `duration` | number | yes | Scene length in seconds. |
| `label` | string | optional | Top-right chrome label during this scene. Defaults to a sensible value per type. |
| `content` | object | yes | Type-specific content. See `03-scene-catalog.md`. |

### Beat IDs

Every named element inside `content` should have a stable `id` field where possible (list items, stat cards, tools, table rows, etc.). These become `data-beat-id` attributes in the DOM:

```html
<div data-scene-id="tool-cards" data-beat-id="chatgpt">...</div>
```

That's what enables surgical edits later — automation can find `[data-scene-id="tool-cards"][data-beat-id="chatgpt"]` and update its content without touching anything else.

---

## Accent markup

Inside content strings, wrap accent words in single asterisks:

```
"Sample line. *Accent.*"
```

The renderer applies `color: var(--accent)` to the wrapped text. Don't use bold tags or HTML — keep the JSON as plain string data.

For escape: write `\*` for a literal asterisk. (Asterisks in code blocks or stat values aren't parsed.)

---

## Timing constraints

- `scenes[0].start === 0`
- For every pair of adjacent scenes: `scenes[i+1].start === scenes[i].start + scenes[i].duration`
  (No gaps, no overlaps. Cross-fade happens *inside* `SceneFrame` via the `fadeIn`/`fadeOut` parameters.)
- `lesson.duration === scenes[last].start + scenes[last].duration`

A linter at the top of `lesson-renderer.jsx` checks these on load and logs a console warning if violated.

---

## Versioning & surgical updates

**Rule:** content edits never change `id` fields. They only change content fields (text, numbers, the `state` of a journey stop).

```diff
{
  "id": "tool-cards",
  "content": {
    "tools": [
      {
        "id": "chatgpt",
        "name": "ChatGPT",
        "tag": "Sample tag",
-       "oneliner": "One-line summary"
+       "oneliner": "One-line summary, updated"
      }
    ]
  }
}
```

The ID `chatgpt` stays. The text under it can change. Anyone re-rendering the lesson gets the new text in the same visual position.

**Rule:** if you need to add a new scene mid-lesson, give it a unique slug and recompute `start` for all subsequent scenes. The existing IDs stay stable; the timeline shifts.

**Rule:** if you need to *remove* a scene, leave its slot in `speakerNotes` as `""` and update timings. The lesson is now shorter, but downstream tools that reference the removed scene by ID will fail loudly — they should, so you catch dead references.

---

## Optional: scene templates as variables

For repeat scenes (e.g. every lesson has a `recap-grid` with 3 cards), you can extract a shared variables block:

```json
{
  "$shared": {
    "wrap-eyebrow": "Lesson 1.5 · Wrap"
  },
  "scenes": [
    {
      "id": "recap",
      "type": "recap-grid",
      "content": { "eyebrow": { "$ref": "$shared.wrap-eyebrow" } }
    }
  ]
}
```

The renderer resolves `$ref` paths before rendering. Use only if you find yourself repeating the same string 3+ times in one lesson — otherwise it's overkill.

---

## Full example

See `examples/module-1.json` for a complete, lint-clean lesson JSON (the `examples/` folder is not included in this copy; `content/lessons/module-1/` holds the production-format sample).
