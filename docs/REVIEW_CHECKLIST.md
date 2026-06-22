# Adversarial Review Checklist

Used by BOTH reviewers — Claude's `checker` and Codex (`codex exec` /
`/codex:review` / `/codex:adversarial-review`). Be adversarial. The goal is to
FALSIFY the claim that the work is done, not to be agreeable.

**Report ONLY blocking issues.** No naming debates, no style nitpicks, no "what
does this do." Signal, not noise. If nothing blocks, say so explicitly — do not
invent issues.

Check, against `docs/ACCEPTANCE.md` for the task:

1. **Missing requirements** — anything in the spec not actually implemented.
2. **Unmet / vague acceptance criteria** — a criterion not truly satisfied, or
   too vague to verify.
3. **Edge cases** — inputs, states, and failures not handled.
4. **Tests that would falsely pass** — over-mocked, shallow, asserting nothing
   meaningful, or not exercising the real path. A test that cannot fail is a fake.
5. **Fake completion / unverifiable claims** — "done"/"verified" with no
   artifact, no command output, or evidence that does not actually show the
   criterion met.
6. **Visual / UI mismatch** — the screenshot/DOM artifact does NOT clearly show
   the criterion met; missing route/viewport coverage; dead buttons or controls.
7. **Regressions** — previously-passing behavior now broken.
8. **Security-sensitive surfaces** — auth, input handling, file paths, shell
   execution, deserialization, crypto. Different model, different blind spots; the
   cost of a miss here is asymmetric.

Output: a list of BLOCKING findings, each with file path + line + the specific
reason it blocks. Then a one-line verdict: **BLOCK** or **PASS**.
