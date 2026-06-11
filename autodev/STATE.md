# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: DONE              # no `- [ ]` left in PLAN.md → next session reports PLAN-COMPLETE
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: M4 merged PR #12 (strong=claude-opus-4-8). RED close-out resume: prior session left the branch
  gate-green (gate-green marker == branch HEAD d7c0721) with review round-1 staged but NOT completed (no codex
  lane, no verdict, no review-clean — stale M3 review-clean marker). This session r2-resumed: re-confirmed gate
  green @ HEAD, ran the full two-lane review (Lane A adversarial-reviewer + Lane B codex/gpt-5.5-xhigh +
  evaluator). Both lanes converged on ONE finding (engine-reply re-entrancy seam); evaluator verified it
  latent/unreachable with the shipped synchronous engines (RandomEngine/SimpleAI bestMove have zero yield
  points) → 0 confirmed, 0 patched, 1 round → Backlog. Implementation was strong-gen (Opus RED edits to the
  existing UI: hint/moves/undo into index.html + src/ui/app.js; +5 teaching-marker assertions in serve-smoke.sh).
last_gate: green @ M4 close-out (steps: secrets, integrity, perft, core-smoke, core-api, ui-wiring 15/15,
  engine-contract 8/8, full-game checkmate@42plies, static-serve → SERVE SMOKE OK)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- PLAN-COMPLETE: all milestones M0–M4 are merged. The next /autodev-milestone session finds no `- [ ]` line
  and exits PLAN-COMPLETE. Remaining work lives in PLAN.md `## Backlog` (review nice-to-haves + parked ideas);
  promote any of it only via /autodev-plan (SPEC is frozen; new scope is a replan, not a milestone tick).
- M4 latent item now in Backlog: engine-reply re-entrancy busy-guard + mv re-validation — fix when an engine
  first truly yields (timer/worker/network); harmless with the current synchronous engines.
