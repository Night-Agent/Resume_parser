# 📚 Git Quick Reference Guide

## 🚀 Initial Setup

### First Time Configuration
```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check configuration
git config --list

# Set default branch name
git config --global init.defaultBranch main
```

### Initialize Repository
```bash
# Create new repository
git init

# Clone existing repository
git clone https://github.com/username/resumeparser.git

# Clone with custom folder name
git clone https://github.com/username/resumeparser.git my-project
```

---

## 📝 Basic Commands

### Check Status
```bash
# See changed files
git status

# Short status
git status -s
```

### Add Files
```bash
# Add specific file
git add filename.txt

# Add all files
git add .

# Add all JavaScript files
git add *.js

# Add all files in directory
git add backend/

# Interactive add
git add -p
```

### Commit Changes
```bash
# Commit with message
git commit -m "feat: add resume parser"

# Add and commit in one step
git commit -am "fix: resolve login issue"

# Amend last commit
git commit --amend -m "Updated commit message"

# Commit with detailed message
git commit
# Opens editor for multi-line message
```

---

## 🌿 Branching

### Create Branches
```bash
# Create new branch
git branch feature-name

# Create and switch to branch
git checkout -b feature-name

# Or using newer syntax
git switch -c feature-name
```

### Switch Branches
```bash
# Switch to existing branch
git checkout main
git switch main

# Switch to previous branch
git checkout -
```

### List Branches
```bash
# List local branches
git branch

# List all branches (local + remote)
git branch -a

# List remote branches
git branch -r
```

### Delete Branches
```bash
# Delete local branch (safe)
git branch -d feature-name

# Force delete local branch
git branch -D feature-name

# Delete remote branch
git push origin --delete feature-name
```

---

## 🔄 Syncing with Remote

### Add Remote
```bash
# Add remote repository
git remote add origin https://github.com/username/resumeparser.git

# View remotes
git remote -v

# Change remote URL
git remote set-url origin https://github.com/username/new-repo.git
```

### Fetch and Pull
```bash
# Fetch changes (don't merge)
git fetch origin

# Pull changes (fetch + merge)
git pull origin main

# Pull with rebase
git pull --rebase origin main
```

### Push Changes
```bash
# Push to remote
git push origin main

# Push and set upstream
git push -u origin feature-name

# Push all branches
git push --all

# Force push (dangerous!)
git push --force
# Better: force with lease (safer)
git push --force-with-lease
```

---

## 🔍 Viewing History

### Log Commands
```bash
# View commit history
git log

# Compact one-line format
git log --oneline

# With graph
git log --graph --oneline --all

# Last 5 commits
git log -5

# Commits by author
git log --author="John Doe"

# Commits with specific file
git log -- filename.txt

# Pretty format
git log --pretty=format:"%h - %an, %ar : %s"
```

### View Changes
```bash
# See unstaged changes
git diff

# See staged changes
git diff --staged

# Compare branches
git diff main..feature-branch

# Compare specific files
git diff main:file.txt feature:file.txt
```

---

## ↩️ Undoing Changes

### Discard Changes
```bash
# Discard unstaged changes in file
git checkout -- filename.txt
git restore filename.txt

# Discard all unstaged changes
git checkout -- .
git restore .

# Unstage file (keep changes)
git reset HEAD filename.txt
git restore --staged filename.txt
```

### Reset Commits
```bash
# Soft reset (keep changes staged)
git reset --soft HEAD~1

# Mixed reset (keep changes unstaged) - default
git reset HEAD~1

# Hard reset (discard all changes) - DANGEROUS!
git reset --hard HEAD~1

# Reset to specific commit
git reset --hard abc1234
```

### Revert Commits
```bash
# Create new commit that undoes changes
git revert HEAD

# Revert specific commit
git revert abc1234

# Revert without committing
git revert --no-commit HEAD
```

---

## 🔀 Merging and Rebasing

### Merge
```bash
# Merge branch into current branch
git merge feature-branch

# Merge with no fast-forward
git merge --no-ff feature-branch

# Abort merge if conflicts
git merge --abort
```

### Rebase
```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (last 3 commits)
git rebase -i HEAD~3

# Continue after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### Conflict Resolution
```bash
# During merge/rebase conflict:

# 1. See conflicted files
git status

# 2. Edit files to resolve conflicts
# Remove markers: <<<<<<<, =======, >>>>>>>

# 3. Mark as resolved
git add conflicted-file.txt

# 4. Complete merge/rebase
git commit  # for merge
git rebase --continue  # for rebase
```

---

## 🏷️ Tags

### Create Tags
```bash
# Lightweight tag
git tag v1.0.0

# Annotated tag (recommended)
git tag -a v1.0.0 -m "Version 1.0.0 release"

# Tag specific commit
git tag -a v1.0.0 abc1234 -m "Release"
```

### List and Delete Tags
```bash
# List all tags
git tag

# List tags with pattern
git tag -l "v1.*"

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

### Push Tags
```bash
# Push specific tag
git push origin v1.0.0

# Push all tags
git push origin --tags
```

---

## 📦 Stashing

### Stash Changes
```bash
# Stash current changes
git stash

# Stash with message
git stash save "Work in progress on feature X"

# Stash including untracked files
git stash -u
```

### Apply Stashed Changes
```bash
# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply specific stash
git stash apply stash@{2}

# Apply and remove from stash list
git stash pop

# Remove specific stash
git stash drop stash@{0}

# Remove all stashes
git stash clear
```

---

## 🔧 Advanced Commands

### Cherry-pick
```bash
# Apply specific commit to current branch
git cherry-pick abc1234

# Cherry-pick multiple commits
git cherry-pick abc1234 def5678
```

### Clean
```bash
# Remove untracked files (dry run)
git clean -n

# Remove untracked files
git clean -f

# Remove untracked files and directories
git clean -fd
```

### Blame
```bash
# See who changed each line
git blame filename.txt

# Blame specific lines
git blame -L 10,20 filename.txt
```

### Bisect
```bash
# Find bug using binary search
git bisect start
git bisect bad  # Current commit is bad
git bisect good abc1234  # This commit was good

# Git will checkout commits to test
# Mark each as good or bad
git bisect good
git bisect bad

# When found, reset
git bisect reset
```

---

## 🔐 GitHub Specific

### Pull Requests
```bash
# Create PR from command line (using GitHub CLI)
gh pr create --title "Add feature" --body "Description"

# List PRs
gh pr list

# View PR
gh pr view 123

# Checkout PR locally
gh pr checkout 123
```

### Issues
```bash
# Create issue
gh issue create --title "Bug report" --body "Description"

# List issues
gh issue list

# View issue
gh issue view 123
```

---

## 🎯 Common Workflows

### Feature Branch Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: implement new feature"

# 3. Push to remote
git push -u origin feature/new-feature

# 4. Create PR on GitHub

# 5. After PR merged, update main
git checkout main
git pull origin main

# 6. Delete feature branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### Hotfix Workflow
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add .
git commit -m "fix: resolve critical bug"

# 3. Push and create PR
git push -u origin hotfix/critical-bug

# 4. After merge, tag release
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Hotfix release"
git push origin v1.0.1
```

---

## 🆘 Emergency Commands

### Oh no, I committed to main instead of a branch!
```bash
# Before pushing:
git branch feature-branch  # Create branch with current commits
git reset --hard origin/main  # Reset main to remote
git checkout feature-branch  # Switch to feature branch
```

### Oh no, I pushed sensitive data!
```bash
# Remove file from history (DANGEROUS - rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Better: use BFG Repo Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Then force push
git push origin --force --all
```

### Oh no, I accidentally deleted a branch!
```bash
# Find commit SHA from reflog
git reflog

# Recreate branch
git checkout -b recovered-branch abc1234
```

---

## 📋 Useful Aliases

Add to `.gitconfig` or run:

```bash
# Short status
git config --global alias.st status

# Short log
git config --global alias.lg "log --oneline --graph --all"

# Undo last commit (keep changes)
git config --global alias.undo "reset HEAD~1"

# View last commit
git config --global alias.last "log -1 HEAD"

# List aliases
git config --global alias.aliases "config --get-regexp alias"
```

---

## 🎨 Git Ignore Patterns

Common `.gitignore` patterns:

```gitignore
# Node modules
node_modules/

# Environment files
.env
.env.local

# Build output
dist/
build/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

---

## 📚 Additional Resources

- [Official Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [Oh Shit, Git!?!](https://ohshitgit.com/)

---

**Pro Tip:** Use `git help <command>` for detailed help on any command!
