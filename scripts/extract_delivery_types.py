"""Per-row delivery-type recovery from the course-outline DOCX (Instructor 2026-06-09).

The outline color-codes every row's delivery type as table-row shading; the
legend is verbatim in the document:
  Blue rows  (Slides/Visual)   -> Co-owner designs a slide; fill ebf5fb
  Green rows (Demo / in-tool)  -> Instructor screen-shares;  fill eafaf1
  Orange rows (Talking Head)   -> Instructor on camera;      fill fef9e7
Plain-text extraction lost this; this script reads the w:shd fill attribute
per row and emits content/curriculum/delivery-types.json so the course-map
compiler can stamp a per-row deliveryType. Run:

  python scripts/extract_delivery_types.py            # extract + write JSON
  python scripts/extract_delivery_types.py --test     # unit tests only
"""

import json
import sys
import unittest
from pathlib import Path

DOCX_PATH = Path("original background content/sample-course-outline.docx")
OUT_PATH = Path("content/curriculum/delivery-types.json")

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

FILL_TO_TYPE = {
    "ebf5fb": "slide",         # blue — Slides/Visual
    "eafaf1": "demo",          # green — Demo / in-tool
    "fef9e7": "talking-head",  # orange — Talking Head
}
HEADER_FILLS = {"1a1a2e"}      # dark navy table headers ("Time | Content")


def classify_fill(fill):
    """Map a w:shd fill hex to a delivery type. Headers/unknown -> None."""
    if fill is None:
        return None
    fill = fill.lower()
    if fill in HEADER_FILLS:
        return None
    return FILL_TO_TYPE.get(fill)


def row_fill(row):
    """Read the shading fill of a table row (from its first cell)."""
    shd = row.cells[0]._tc.find(f".//{{{W_NS}}}tcPr/{{{W_NS}}}shd")
    return shd.get(f"{{{W_NS}}}fill") if shd is not None else None


def extract(docx_path=DOCX_PATH):
    import docx  # python-docx

    d = docx.Document(str(docx_path))
    rows = []
    for ti, table in enumerate(d.tables):
        for ri, row in enumerate(table.rows):
            dtype = classify_fill(row_fill(row))
            if dtype is None:
                continue  # header / legend / unshaded
            cells = [c.text.strip() for c in row.cells]
            time = cells[0] if cells else ""
            content = cells[1] if len(cells) > 1 else ""
            head = content.split("\n", 1)[0][:80]
            rows.append(
                {
                    "table": ti,
                    "row": ri,
                    "time": time,
                    "contentHead": head,
                    "deliveryType": dtype,
                }
            )
    return rows


class TestColorMapping(unittest.TestCase):
    """TDD anchor (Instructor): test the color->type mapping on rows with KNOWN
    delivery types before trusting full extraction."""

    def test_legend_fills(self):
        self.assertEqual(classify_fill("ebf5fb"), "slide")
        self.assertEqual(classify_fill("eafaf1"), "demo")
        self.assertEqual(classify_fill("fef9e7"), "talking-head")

    def test_case_insensitive(self):
        self.assertEqual(classify_fill("EBF5FB"), "slide")

    def test_headers_and_unknown_excluded(self):
        self.assertIsNone(classify_fill("1a1a2e"))  # header navy
        self.assertIsNone(classify_fill(None))      # unshaded
        self.assertIsNone(classify_fill("ffffff"))  # unrecognized

    @unittest.skipUnless(DOCX_PATH.exists(), "requires python-docx + the source DOCX (not included)")
    def test_known_rows_in_real_docx(self):
        """Calibration against rows whose type is independently known:
        1.1 'Topic 1 at a Glance' is a Slides row (approved 1.1 plan: all
        slides); 1.2's 'Side-by-Side Answers' is a Demo row
        (OUTLINE.md); Topic 0 'Welcome and Course Promise' is on-camera."""
        rows = extract()
        by_head = {}
        for r in rows:
            by_head.setdefault(r["contentHead"].split("\n")[0], r["deliveryType"])

        def find(prefix):
            for head, dtype in by_head.items():
                if head.startswith(prefix):
                    return dtype
            raise AssertionError(f"no extracted row starts with {prefix!r}")

        self.assertEqual(find("Topic 1 at a Glance"), "slide")
        self.assertEqual(find("Side-by-Side Answers"), "demo")
        self.assertEqual(find("Welcome and Course Promise"), "talking-head")

    @unittest.skipUnless(DOCX_PATH.exists(), "requires python-docx + the source DOCX (not included)")
    def test_every_extracted_row_is_typed(self):
        rows = extract()
        self.assertGreater(len(rows), 10)  # every shaded content row in the outline
        for r in rows:
            self.assertIn(r["deliveryType"], ("slide", "demo", "talking-head"))


if __name__ == "__main__":
    if "--test" in sys.argv:
        sys.argv = [sys.argv[0]]
        unittest.main()
    else:
        rows = extract()
        counts = {}
        for r in rows:
            counts[r["deliveryType"]] = counts.get(r["deliveryType"], 0) + 1
        OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUT_PATH.write_text(
            json.dumps({"source": str(DOCX_PATH), "counts": counts, "rows": rows}, indent=2),
            encoding="utf-8",
        )
        print(f"wrote {OUT_PATH} — {len(rows)} rows: {counts}")
