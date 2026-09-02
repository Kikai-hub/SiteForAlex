#!/usr/bin/env bash
# One-command bootstrap for a fresh Linux host: installs Docker if needed,
# clones (or updates) the repo, asks for an admin login, brings the site up,
# seeds the admin account, and — on systemd hosts — installs the auto-update
# timer so the site keeps itself in sync with GitHub from then on.
#
# Usage (on the server, as root or via sudo):
#   curl -fsSL https://raw.githubusercontent.com/Kikai-hub/SiteForAlex/main/scripts/install.sh | bash
# or, with a custom install path / a domain you already have pointed here
# (login cookies are HTTPS-only, so admin/account/courier login won't work
# until this is set — either now or later via .env + `adanasite restart`):
#   INSTALL_DIR=/srv/adana-pizza SITE_DOMAIN=yourdomain.ru bash install.sh
set -euo pipefail

REPO_URL="https://github.com/Kikai-hub/SiteForAlex.git"
INSTALL_DIR="${INSTALL_DIR:-/opt/adana-pizza}"
BRANCH="${BRANCH:-main}"

log() { printf '\n==> %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root (or with sudo) — it installs system packages and a systemd timer." >&2
  exit 1
fi

log "Checking for Docker..."
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker (official convenience script)..."
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker is installed but the 'docker compose' plugin isn't available. Install it and re-run this script." >&2
  exit 1
fi
systemctl enable --now docker >/dev/null 2>&1 || true

log "Checking for git..."
if ! command -v git >/dev/null 2>&1; then
  (apt-get update && apt-get install -y git) || (yum install -y git) || {
    echo "Could not install git automatically — install it manually and re-run." >&2
    exit 1
  }
fi

log "Fetching the repository into $INSTALL_DIR..."
if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"
else
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

chmod +x bin/adanasite scripts/auto-update.sh

if [ ! -f .env ]; then
  log "No .env found — creating one from .env.example with a fresh SESSION_SECRET."
  cp .env.example .env
  generated_secret="$(openssl rand -base64 48)"
  # Portable in-place edit (BSD/GNU sed differ on -i syntax).
  sed -i.bak "s#^SESSION_SECRET=.*#SESSION_SECRET=\"$generated_secret\"#" .env && rm -f .env.bak
else
  log ".env already exists — leaving it untouched."
fi

# Admin login: prompted here so the very first `adanasite seed` below
# succeeds immediately. Without this, prisma/seed.ts deliberately refuses to
# create the well-known dev admin/password in production (see that file) —
# you'd otherwise have to edit .env and re-run `adanasite seed` by hand
# before you could ever log into /admin/login.
if ! grep -q '^SEED_ADMIN_PASSWORD=".\+"' .env; then
  if [ -n "${SEED_ADMIN_USERNAME:-}" ] && [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
    log "Using SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD from the environment."
  elif [ -r /dev/tty ]; then
    # Reads from /dev/tty explicitly: this script is normally run as
    # `curl ... | bash`, where stdin is the piped script itself, not a
    # terminal — a plain `read` would silently consume that pipe instead of
    # prompting, and the script would appear to hang or skip ahead.
    log "Set up the admin panel login (used at /admin/login)."
    read -r -p "  Admin username [admin]: " SEED_ADMIN_USERNAME </dev/tty
    SEED_ADMIN_USERNAME="${SEED_ADMIN_USERNAME:-admin}"
    while true; do
      read -r -s -p "  Admin password (min 6 characters, no \" character): " SEED_ADMIN_PASSWORD </dev/tty
      echo
      if [ "${#SEED_ADMIN_PASSWORD}" -lt 6 ]; then
        echo "  Too short — try again."
        continue
      fi
      case "$SEED_ADMIN_PASSWORD" in
        *'"'*)
          echo "  Can't contain a \" character — try again."
          continue
          ;;
      esac
      read -r -s -p "  Confirm password: " password_confirm </dev/tty
      echo
      if [ "$SEED_ADMIN_PASSWORD" = "$password_confirm" ]; then
        break
      fi
      echo "  Passwords didn't match — try again."
    done
  else
    SEED_ADMIN_USERNAME="admin"
    SEED_ADMIN_PASSWORD="$(openssl rand -base64 18)"
    log "No terminal to prompt on — generated a random admin password instead (shown at the end, also saved to .env)."
  fi
  grep -v '^SEED_ADMIN_USERNAME=' .env | grep -v '^SEED_ADMIN_PASSWORD=' >.env.tmp
  mv .env.tmp .env
  printf 'SEED_ADMIN_USERNAME="%s"\n' "$SEED_ADMIN_USERNAME" >>.env
  printf 'SEED_ADMIN_PASSWORD="%s"\n' "$SEED_ADMIN_PASSWORD" >>.env
fi
admin_username="$(grep '^SEED_ADMIN_USERNAME=' .env | cut -d'"' -f2)"
admin_password="$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d'"' -f2)"

if [ -n "${SITE_DOMAIN:-}" ]; then
  if grep -q '^# \?SITE_DOMAIN=' .env; then
    sed -i.bak "s#^# \?SITE_DOMAIN=.*#SITE_DOMAIN=\"$SITE_DOMAIN\"#" .env && rm -f .env.bak
  elif ! grep -q '^SITE_DOMAIN=' .env; then
    echo "SITE_DOMAIN=\"$SITE_DOMAIN\"" >>.env
  fi
  log "SITE_DOMAIN set to $SITE_DOMAIN — Caddy will fetch a Let's Encrypt certificate on start."
else
  log "No SITE_DOMAIN given — serving plain HTTP for now. Login (admin/account/courier) needs" \
      "HTTPS to work: set SITE_DOMAIN in .env once you have a domain, then run: adanasite restart"
fi

log "Building and starting the site (this can take a few minutes on first run)..."
./bin/adanasite start

log "Seeding the admin account..."
./bin/adanasite seed

if [ ! -e /usr/local/bin/adanasite ]; then
  ln -s "$INSTALL_DIR/bin/adanasite" /usr/local/bin/adanasite
  log "Installed the 'adanasite' command — run 'adanasite' with no arguments from anywhere to see what it can do."
fi

if command -v systemctl >/dev/null 2>&1; then
  log "Installing the auto-update timer (checks GitHub every 5 minutes)..."
  sed "s#__REPO_DIR__#$INSTALL_DIR#g" deploy/adana-autoupdate.service >/etc/systemd/system/adana-autoupdate.service
  cp deploy/adana-autoupdate.timer /etc/systemd/system/adana-autoupdate.timer
  systemctl daemon-reload
  systemctl enable --now adana-autoupdate.timer
  log "Auto-update installed. Logs: $INSTALL_DIR/logs/auto-update.log or 'journalctl -u adana-autoupdate'."
else
  log "No systemd on this host — set up cron manually if you want auto-updates (see DEPLOY.md)."
fi

server_ip="$( (curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}') || true )"
cat <<EOF

============================================================
 Adana Pizza is running.

   Site:   http://${server_ip:-<server-ip>}/
   Admin:  http://${server_ip:-<server-ip>}/admin/login
   Login:  $admin_username / $admin_password

 Installed at: $INSTALL_DIR
 Commands:     adanasite   (run with no arguments to see the full list)
 Auto-update:  every 5 min via systemd timer (if this host has systemd)

 Next steps:
  - Fill in YANDEX_MAPS_API_KEY / YOOKASSA_* in $INSTALL_DIR/.env if you
    want address autocomplete / online card payment, then: adanasite restart
  - Point a domain at this server and set SITE_DOMAIN in .env for HTTPS,
    then: adanasite restart
============================================================
EOF
