# Git & Development Workflow Guidelines

## CRITICAL RULE: No Automatic Commits or Pushes
- **DO NOT** execute `git commit` or `git push` automatically under any circumstances.
- **NEVER** push directly to `main` without explicit, unambiguous user command.
- Leave all modified and created files in the working tree for user review.
- The user must test, inspect the changes, and click "Accept All" in the IDE before any version control operations.
- Only run `git commit` or `git push` when the user explicitly instructs to do so (e.g. "закоммить", "запушь", "сделай коммит").
