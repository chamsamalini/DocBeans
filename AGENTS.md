# DocBeans repository workflow

These instructions apply to the entire repository.

## Branching policy

- `main` is the production branch. Never commit or push directly to `main`.
- `dev` is the shared integration and testing branch. Never commit or push directly to `dev`.
- Begin every change by fetching the remote and updating a clean local `dev` from `origin/dev`.
- Create one focused working branch from the latest `dev`:
  - `feature/<short-description>` for new capability.
  - `fix/<short-description>` for defect correction.
  - `chore/<short-description>` for repository maintenance or documentation.
- Make application, database, API, environment, infrastructure, and documentation changes only on the working branch.
- Do not mix unrelated work in one branch or pull request.

## Required change workflow

1. Confirm the checkout is clean and fetch the latest remote branches.
2. Switch to `dev`, fast-forward it from `origin/dev`, and create the working branch.
3. Implement only the approved scope and preserve unrelated user changes.
4. Run the relevant tests, type checks, linting, build, and artifact verification for the affected area.
5. Review the diff and commit the tested change with a clear message.
6. Push the working branch and open a pull request targeting `dev`.
7. Leave the pull request open for review and approval. Do not merge it automatically.
8. After integration testing on `dev`, promote a tested release through a separate pull request from `dev` to `main`.
9. Leave the release pull request open for approval. Production deployment may occur only after the approved merge to `main` and through the authorised deployment process.

The required flow is:

`feature/* or fix/* -> PR -> dev -> testing -> PR -> main -> production`

## Branch safety

- Do not force-push or delete `main` or `dev`.
- Do not bypass required reviews, checks, or conversation resolution.
- Require at least one approving review for pull requests into `main` and `dev`.
- Require the applicable automated checks once those checks are configured in GitHub.
- Do not merge a pull request with failing or incomplete checks.
- Do not deploy from a feature, fix, chore, or `dev` branch unless a separately approved non-production environment explicitly requires it.
- Before any Git operation, inspect the current branch, upstream, worktree status, and remote target.
- If the current checkout contains uncommitted work, preserve it and use a separate worktree or clean clone rather than moving or overwriting it.

## Codex behaviour

- Follow this branching policy for every DocBeans code or repository change.
- Do not create commits, push branches, open pull requests, merge, deploy, or change repository settings beyond the user's stated authority.
- When asked to implement a change, use a working branch based on the latest `dev`, validate the result, push it, and open a pull request to `dev` without merging.
- Report the branch name, checks run, commit, and pull-request link at handoff.
