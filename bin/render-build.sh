#!/usr/bin/env bash
# Render build command (Free plan, so migrations and seeds run here rather
# than in a pre-deploy command). See docs/decisions.md.
set -o errexit

# Confirm Render picked up .node-version (24.15.0).
node --version
npm --version

bundle install

# Install exactly what package-lock.json records, including the dev
# dependencies Vite needs to build. Done explicitly so a failure stops the
# build here; vite_ruby's own install step ignores npm's exit status.
npm ci --include=dev

# Builds the Vite assets (vite_ruby hooks into assets:precompile).
VITE_RUBY_SKIP_ASSETS_PRECOMPILE_INSTALL=true bin/rails assets:precompile
bin/rails assets:clean

bin/rails db:migrate

# Creates the HR Manager login from HR_EMAIL and HR_PASSWORD; safe to repeat.
bin/rails db:seed
