#!/usr/bin/env bash
# Polls GitHub for a new commit on the currently checked-out branch and, if
# one exists, redeploys via `bin/site deploy`. Meant to run unattended on a
# schedule (systemd timer or cron) — see deploy/adana-autoupdate.* and
# DEPLOY.md for how it's installed.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p logs
LOG_FILE="logs/auto-update.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"; }

branch="$(git rev-parse --abbrev-ref HEAD)"
local_sha="$(git rev-parse HEAD)"
remote_sha="$(git ls-remote origin "refs/heads/$branch" | cut -f1)"

if [ -z "$remote_sha" ]; then
  log "Could not reach GitHub (empty ls-remote result) — skipping this run."
  exit 0
fi

if [ "$local_sha" = "$remote_sha" ]; then
  exit 0
fi

log "New commit on $branch: $local_sha -> $remote_sha. Deploying..."
if ./bin/site deploy >>"$LOG_FILE" 2>&1; then
  log "Deploy succeeded ($remote_sha)."
else
  log "Deploy FAILED — site left running its previous build. Check $LOG_FILE above for the error."
  exit 1
fi
