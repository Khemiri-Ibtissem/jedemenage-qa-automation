# JeDemenage — QA & Test Automation

Manual and automated testing of **JeDemenage**, a relocation marketplace built with Laravel: clients post a move with an inventory builder, movers place bids, the client accepts an offer, follows the move with live GPS tracking and rates the mover.

Application source: [dev-projects/JeDemenage](https://github.com/Khemiri-Ibtissem/dev-projects/tree/main/JeDemenage)

## Coverage

**92 automated Playwright tests** across 8 test cases, each backed by a manual test plan and scenarios:

| Test case | Scope |
|---|---|
| CT-01 | Home page |
| CT-02 | Sign-up |
| CT-03 | Login |
| CT-04 | Move request (inventory builder, volume estimate) |
| CT-05 | Offers (mover bids, client acceptance) |
| CT-06 | Tracking, closing and rating |
| CT-07 | Access control (client / mover / admin) |
| CT-08 | Administration |

## Approach

1. **Manual first** — test plan and scenarios per feature (`01_Tests_Manuels/`).
2. **One automated test per manual scenario**, same numbering (`02_Tests_Auto/tests/`).
3. **Known defects** are written as the expected behaviour and marked `test.fail()`, so they turn red once fixed.

## Automation architecture

- **Playwright + TypeScript**, Page Object Model: 14 page objects covering the client, mover and admin journeys (`src/pages/`), shared fixtures and reusable journeys (`src/outils/Parcours.ts`).
- **Isolated environment**: Playwright starts the Laravel app on a dedicated PHP server and Vite, on a fresh test database seeded before each run — no real account is used.
- **Tags**: `@smoke`, `@securite` (security), plus a mobile project.

## Run the tests

The suite drives the application locally, so clone this repository **inside the JeDemenage project root** (next to `artisan`):

```bash
cd JeDemenage                       # application root
git clone https://github.com/Khemiri-Ibtissem/jedemenage-qa-automation QA
cd QA/02_Tests_Auto
npm install
npx playwright install chromium
cp .env.example .env                # optional, defaults work
npm test                            # full suite
npm run test:smoke                  # smoke tests
npm run test:securite               # security tests
npm run report                      # HTML report
```

Requirements: PHP and Composer dependencies installed for the app, Node.js 18+.

## Repository layout

```
00_Planning/        QA tracking sheet
01_Tests_Manuels/   test plans and scenarios (per test case)
02_Tests_Auto/      Playwright + TypeScript automation
```
