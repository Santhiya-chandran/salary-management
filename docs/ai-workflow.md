# AI Workflow

How I used AI tools to build this project: what I asked for, how I checked the output, and where I changed or rejected suggestions.

## Tools

- **Claude Code (in VS Code):** implementation: commands, code, tests, and research in official docs.
- **Claude (chat):** planning, explaining unfamiliar concepts and trade-offs, and reviewing Claude Code's plans and output before I approved them.

## How I worked

1. **Requirements before code.** I wrote the requirements document with AI help and edited it, then sent clarifying questions to the stakeholders. Each question stated my planned default, so work could start while waiting for answers. Their reply made currency my decision, so I chose local currency as the source of truth plus an approximate USD view, and updated the requirements before building.
2. **Standing rules in [`CLAUDE.md`](../CLAUDE.md).** Scope, out-of-scope items, the tech stack, and engineering rules: plan before coding, tests first, small steps, aggregations in SQL, no floats for money, no new packages without asking, and the AI never commits.
3. **Plan, review, approve, one step at a time.** For each step, Claude Code proposed a plan and listed open questions. I reviewed it, answered the questions, and approved one step or a small batch.
4. **Review every change before committing.** I read each summary and diff, ran the checks myself when needed, and **tested every UI step in the browser**. I made every commit myself, with a Conventional Commit message.
5. **Decisions recorded as they happened** in [`decisions.md`](decisions.md), written during each step and committed as one file near the end.

## Kickoff prompt

```
Read CLAUDE.md and docs/requirements.md fully.

Then, before writing any code:
1. Summarise your understanding of the goal, scope, and out-of-scope items.
2. List any questions or ambiguities you see.
3. Propose a step-by-step implementation plan, broken into small
   steps that would each make a sensible commit (TDD where applicable).

Do not create or change any files yet. Wait for my approval.
```

Claude Code returned a correct summary, 18 questions and a 21-step plan. I accepted most recommendations, and changed the plan in three places:

- **Deploy early:** moved the first deployment from the last step to right after login and the React shell worked, so deployment problems would surface while the app was small.
- **Record decisions as we go**, not at the end.
- **Add one chart** as a stretch item, alongside the median.

## Where I steered or corrected the AI

- **"Verify, don't assume."** Online sources (including an AI search summary) said Render didn't support Ruby 4.0, and I was briefly advised to switch to Ruby 3.4.11 without that being verified. I stopped and **ran a real test deploy**: Render installed Ruby 4.0.5 and all gems fine, so I discarded the switch. After that, I added a rule to `CLAUDE.md`: never assume a version, platform or library works; verify it from official docs or by running it, or ask.
- **Version checks before installing:** I asked Claude Code to confirm compatibility from official docs before adding packages. Mantine 9 with React 19.3 and React Router 8 with our React and Node versions were both confirmed first. I also had it confirm that Render's Ruby runtime provides Node, and later checked the build log to be sure.
- **TypeScript:** I rejected trying TypeScript 7 first and used the version from Vite's official React + TypeScript template (6.0), the combination the Vite team tests.
- **Commit structure:**
  - I asked for the untouched `rails new` output in its own commit, separate from my configuration, so reviewers can tell generated code from mine.
  - I removed Kamal before the first commit, and left an unused `Procfile.dev` out instead of adding and then deleting it.
- **Removing defaults the app doesn't need, each with a reason:** Kamal (we deploy to Render), Dependabot (upgrade pull requests mid-assessment; `bundler-audit` in CI already covers vulnerable gems), and Solid Cache/Queue/Cable (unused in v1, and Render's free plan has one database).
- **A wrong claim caught from the logs:** an earlier decision said our Puma config didn't read `WEB_CONCURRENCY`. Render's first deploy log showed Puma in cluster mode with one worker, so I pointed out the contradiction. Claude Code confirmed it in Puma's source, fixed the config (with a spec), and corrected the decision.
- **Seed safety:** I required that the seed, which runs on every deploy, must never delete or duplicate employees. It only seeds an empty table, in one transaction.
- **API behaviour:** I specified that only `/api` requests get a 401 JSON response when logged out, while normal pages still redirect to login, with specs for both.
- **Product details:**
  - department and job title fields suggest existing values as you type, so HR is more likely to reuse “Sales” than enter a variant like “sales”;
  - salaries are shown with currency codes rather than symbols, which are ambiguous across USD, CAD and AUD;
  - filters live in the URL, so refresh and shared links work.

## Where the AI caught problems

- **Security:** the Vite installer added a version with a known high-severity advisory. Claude Code upgraded it, and `npm audit` reports 0 vulnerabilities.
- **Self-corrections after checking docs:**
  - the HTTPS plan (Render, not Rails, redirects HTTP to HTTPS);
  - the React Router version (v8, not v7);
  - the real reason for the explicit `npm ci` in the build script.
- **Exact money:** PostgreSQL's built-in median returns a float, so Claude Code computed an exact median instead. A spec proves the float version would be wrong.
- **A Windows-only bug:** two files whose names differed only in letter case worked differently on Windows than they would on Linux (CI and Render). Renamed before it could break anything.
- **Performance:** the chart library nearly doubled the JavaScript bundle. Lazy-loading it cut the JavaScript every page loads from 274 kB to 158 kB gzipped.

## Problems found by CI and fixed

Developing on Windows caused issues that only appeared on Linux:

- `bin/` scripts weren't marked executable;
- their first lines pointed to `ruby.exe` instead of `ruby`.

GitHub Actions caught both. After the first one, I ran the same checks locally before pushing, to avoid a chain of fix commits.

## What I'd do differently

- **Match the production environment from day one.** The app runs on Linux (CI and Render), but I developed on Windows. Platform differences (file permissions, Windows-style script headers, line endings, case-insensitive file names) had to be caught by CI or by extra checks. Next time I'd develop in WSL or a Linux container from the start, so local development matches production.
- **Write a short design doc** (data model and API) before the first feature step, not only the requirements.
- **Keep these notes as I go**, rather than reconstructing them at the end.