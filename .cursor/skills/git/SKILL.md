---
name: git
description: Standardizes Chatty Git workflow with Light GitFlow branching, Conventional Commits, PR rules, and release/hotfix flow. Use when creating branches, writing commits, opening PRs, preparing releases, or handling hotfixes in this repository.
---

# Git Convention for Chatty

## When to apply

Apply this skill for any Git operation in this repository, including branch naming, commit message writing, pull request preparation, release branching, and hotfix handling.

## Repository defaults

1. Branch model:
   - `main`: stable, production-ready code only.
   - `develop`: integration branch for ongoing work.
   - `feature/<scope>-<short-description>`: standard feature branch off `develop`.
   - `release/<version>`: release stabilization branch off `develop`.
   - `hotfix/<scope>-<short-description>`: urgent production fix branch off `main`.

2. Commit format (Conventional Commits):
   - Required format: `<type>(<scope>): <subject>`
   - Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `perf`, `revert`.
   - Prefer imperative present-tense subject (example: `add socket auth guard`).
   - Breaking changes use `!` and a `BREAKING CHANGE:` footer.

3. Scope taxonomy:
   - Backend: `backend`, `auth`, `chatrooms`, `messages`, `websocket`, `scheduler`, `prisma`.
   - Frontend: `frontend`, `chat`, `ui`, `router`, `state`, `pwa`.
   - Cross-cutting: `repo`, `infra`, `deps`, `ci`, `docs`.

4. Pull request defaults:
   - PR title follows Conventional Commit format.
   - Prefer one concern per PR.
   - Prefer squash merge to keep `develop` and `main` history readable.

## Required workflow

Use this checklist while working:

```markdown
Git Task Checklist

- [ ] Branch is created from the correct base (`develop` for features, `main` for hotfixes)
- [ ] Branch name follows naming convention
- [ ] Commits follow Conventional Commits with appropriate scope
- [ ] PR title and body follow project template
- [ ] Lint/typecheck/tests are run for affected app(s)
- [ ] Merge target is correct (`develop` for feature, `main` for release/hotfix)
- [ ] Back-merge/cherry-pick rules are applied after release/hotfix
```

## Branch and merge policy

### Feature flow

1. Update base branch:
   - `git checkout develop`
   - `git pull`
2. Create branch:
   - `git checkout -b feature/<scope>-<short-description>`
3. Open PR to `develop`.
4. Squash merge after approval and checks pass.

### Release flow

1. Create release branch from `develop`:
   - `git checkout develop && git pull`
   - `git checkout -b release/<version>`
2. Allow only bugfix/docs/versioning commits on release branch.
3. PR `release/<version>` to `main`.
4. Tag in `main` with semantic version (`vX.Y.Z`).
5. Merge `main` back into `develop` to keep histories aligned.

### Hotfix flow

1. Create hotfix branch from `main`:
   - `git checkout main && git pull`
   - `git checkout -b hotfix/<scope>-<short-description>`
2. PR to `main` for urgent production fix.
3. After merge to `main`, merge the same fix into `develop`.

## Commit and PR templates

### Commit examples

- `feat(messages): add AI stream completion event`
- `fix(auth): reject expired JWT on websocket handshake`
- `refactor(frontend): split chat input state hook`
- `docs(repo): clarify release and hotfix merge flow`

### PR title examples

- `feat(chat): add optimistic message placeholder`
- `fix(websocket): handle reconnect room join race`
- `chore(ci): enforce conventional commit format`

### PR body template

```markdown
## Summary
- <what changed>

## Why
- <problem or goal>

## Test plan
- [ ] backend: `npm run lint`
- [ ] backend: `npm run test`
- [ ] frontend: `npm run lint`
- [ ] frontend: `npm run typecheck`
- [ ] frontend: `npm run test`

## Rollback notes
- <how to safely revert if needed>
```

## Automation and guardrails

Default automated checks for this repo:

- Local `commit-msg` hook validates Conventional Commit format.
- Local `pre-push` hook runs app checks depending on changed paths.
- CI validates commit messages for push/PR ranges.

Enable local hooks once per clone:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/commit-msg .githooks/pre-push scripts/ci/verify-commits.sh
```

If local hooks block progress for exceptional reasons, fix the issue rather than bypassing checks unless maintainers approve an exception.

## Pilot and iteration loop

Use this rollout loop for one sprint:

1. Apply this workflow to all new branches.
2. Track friction:
   - ambiguous scope names
   - branch naming complexity
   - unnecessary check runtime
3. At sprint end, adjust scope taxonomy or hook strictness while preserving:
   - Light GitFlow branch model
   - Conventional Commit format
   - PR title/body standard

Use [pilot-checklist.md](pilot-checklist.md) to run and review the first sprint consistently.
