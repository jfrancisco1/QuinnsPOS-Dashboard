---
name: smart-commit
description: Use when the user wants to commit their currently staged changes with a descriptive, Conventional Commits message in this repo's house style.
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob
---

# Smart Commit

Write a commit message for what is **already staged**. Don't stage, amend, or push.

## 1. Gather context

```bash
git status --short
git diff --staged --stat
git diff --staged
git log --format='%s%n%n%b%n===' -8
```

## 2. Checks

- Nothing staged → stop, tell the user to `git add` first.
- Unstaged changes also present → proceed, but mention what's being left out.
- A staged file looks unintended (`.env*`, credentials, build output, debug files) →
  flag it and ask before committing.
- Leftover debugging in the diff (`dd()`, `dump()`, commented-out blocks) → point it
  out, don't silently commit or auto-remove it.

## 3. Draft the message

```
<TICKET-ID>: <type>(<scope>): <imperative summary>

<why this change was needed, in a sentence or two>

- <notable change, if more than one thing happened>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

- Subject: imperative, lowercase after the colon, no period, ≤72 chars.
- Type: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore`.
- Scope: the resource/area touched (`fix(orders): ...`) — omit if nothing fits.
- Ticket reference: if the user names a ticket/issue ID in the request (e.g. "QN-6"),
  or the current branch name contains one (e.g. `feature/QN-6-...`), lead the subject
  with `TICKET-ID: ` before `type(scope):` — e.g.
  `QN-6: fix(orders): stop order list flicker...`. Omit entirely when no ticket is
  known; don't ask for one unless the repo's history shows every commit has one.
- Body: only if the change needs explaining beyond the subject — the *why*, not a
  restatement of the diff. Skip it for small, obvious commits.
- Mention anything the next person needs to know: a migration to run, a breaking
  change, a follow-up left undone.
- Two unrelated changes staged together → say so and suggest splitting, but still
  write one message if the user wants one commit.

## 4. Confirm, then commit

Show the message, wait for approval, then:

```bash
git commit -F - <<'EOF'
<approved message>
EOF
```

No `-m` for multi-line messages. No `--no-verify`.

## 5. Report

```bash
git log -1 --format='%h %s'
```

State the short hash and subject. Stop — no push, no PR, unless asked.
