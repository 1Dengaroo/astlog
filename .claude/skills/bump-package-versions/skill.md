---
name: bump-package-versions
description: Bump the package.json version (patch/minor/major), commit, push, and open a PR.
---

Bump the package version, commit, push, and open a PR. Do NOT ask for confirmation between steps — just execute.

The user may pass `major`, `minor`, or `patch` as an argument (e.g. `/bump-package-versions patch`). Default to `patch` if no argument is given.

## Step 0: Preflight checks

Run these checks before doing anything. If any fail, abort immediately and tell the user why.

1. **Validate argument.** If an argument is provided, it must be one of `major`, `minor`, or `patch`. If it is anything else, abort with: `Invalid bump type "<arg>". Must be one of: major, minor, patch.`
2. **Clean working tree.** Run `git status --porcelain`. If there is any output, abort with: `Working tree is not clean. Please commit or stash your changes first.`
3. **On main branch.** Run `git branch --show-current`. If not on `main`, switch to it with `git checkout main`.
4. **Up to date with remote.** Run `git pull` to ensure main is current before branching.

## Step 1: Bump the version

1. Read `package.json` and parse the current `version` field.
2. Increment the version according to the argument:
   - `patch`: `0.1.1` → `0.1.2`
   - `minor`: `0.1.1` → `0.2.0`
   - `major`: `0.1.1` → `1.0.0`
3. Update the `version` field in `package.json` using the Edit tool. Do not change anything else in the file.
4. Run `npm i --package-lock-only` to sync `package-lock.json` with the new version.
5. Store the new version string (e.g. `0.1.2`) for use in later steps.

## Step 2: Create branch, commit, push, and open PR

1. **Create a branch** named `pkg/bump-to-v<NEW_VERSION>` (e.g. `pkg/bump-to-v0.1.2`).
   Use `git checkout -b <branch>`.

2. **Stage** `package.json` and `package-lock.json`.

3. **Commit** with the message:

   ```
   pkg: Bump pkg versions to v<NEW_VERSION>
   ```

   No co-author lines. No multi-line body.

4. **Push** with `git push -u origin <branch>`.

5. **Open PR** with `gh pr create`:
   - Title: `Bump package version to v<NEW_VERSION>`
   - Body: `Bumps package version from v<OLD_VERSION> to v<NEW_VERSION>.`
   - Use a HEREDOC for the body.

6. **Switch back to main** with `git checkout main`.

7. **Return the PR URL** to the user.

IMPORTANT:

- Do NOT amend existing commits
- Do NOT add untracked files or files unrelated to the version bump
- Do NOT ask for confirmation at any step
- Do NOT run build or tests — this is a version-only change
