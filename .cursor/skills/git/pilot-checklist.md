# Git Convention Pilot Checklist (1 Sprint)

Use this during the first sprint after adopting `.cursor/skills/git/SKILL.md`.

## Week 1 setup

- [ ] All contributors run `git config core.hooksPath .githooks`
- [ ] Hook scripts are executable (`chmod +x .githooks/commit-msg .githooks/pre-push scripts/ci/verify-commits.sh`)
- [ ] New branches follow `feature/*`, `release/*`, `hotfix/*`
- [ ] PR titles follow Conventional Commit format

## During sprint

- [ ] Track rejected commits by reason (format/scope/subject clarity)
- [ ] Track PR title corrections requested in review
- [ ] Track pre-push check runtime pain points
- [ ] Track naming pain points for scope and branch descriptions

## End-of-sprint retro

- [ ] Decide if scope taxonomy needs edits
- [ ] Decide if pre-push checks should be narrowed or expanded
- [ ] Confirm release/hotfix flow was clear
- [ ] Record agreed changes directly in `.cursor/skills/git/SKILL.md`
