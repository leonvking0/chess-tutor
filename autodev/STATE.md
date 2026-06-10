# STATE — machine-maintained cache. If git/gh disagree with this file, git/gh win.
status: ready                # ready | BLOCKED
milestone: M0                # M0 — Oracle + rules core (FEN, legal move generation, perft)
attempts: 0                  # attempts at THIS milestone; 3 ⇒ BLOCKED
last_failure: none           # canonical signature "GATE FAIL step=<name>", or none
blocked_reason: none
last_session: (plan: greenfield SPEC+PLAN authored)
last_gate: (never run — gate.sh is still the fail-closed placeholder until M0 lands)
updated: 2026-06-10

## Notes (this milestone only; wiped at close-out)
- Day-0 greenfield: no commits, no GitHub remote. Initial commit lands on main directly (pre-protection).
- M0 must REPLACE autodev/gate.sh (currently the fail-closed placeholder) with the real oracle.
- M0 NEW files (weak model): src/core/chess.js, test/perft.test.js, autodev/smoke/core-smoke.mjs.
- M0 RED edit (strong model): autodev/gate.sh.
