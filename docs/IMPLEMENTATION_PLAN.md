# Trello List Exporter Implementation Plan

## Summary

This is the living implementation artifact for `trello-list-exporter`, a privacy-first Trello Power-Up that exports cards from a Trello list menu to JSON and CSV.

Project defaults:

- GitHub repo name: `trello-list-exporter`
- Repository visibility: public
- Hosting: GitHub Pages
- Deployment: GitHub Actions
- Architecture: Power-Up first
- Cost: free
- Privacy posture: browser-only exports for early MVPs, no third-party MCP service, no backend until justified

## Current Status

- MVP 0 complete: repo, Pages workflow, docs, and security baseline are in place.
- MVP 1 complete: the connector registers `list-actions` and opens a popup shell.
- Next up: MVP 2 JSON export.

## Product Requirements

The Power-Up must add an `Export list...` action to the Trello list `...` menu. Clicking the action opens a Trello popup that lets the user download the selected list as JSON or CSV.

Early MVPs must keep all export processing in the browser. Trello board data must not be sent to a project backend or any third-party data processor. REST API authorization is deferred until a later verification MVP proves that the Trello Power-Up client library is insufficient.

The source repository is public. The project must therefore treat all tracked files as publishable artifacts and must never include private Trello board data, API tokens, screenshots from private boards, or local configuration with secrets.

Initial exported card fields:

- Card ID
- Card short ID, when available
- Card name
- Description
- Labels
- Members, when available
- Start date
- Due date
- Due completion state
- Card URL
- Position
- Last activity date
- Attachment metadata, when available

Later exports should include an Antigravity-friendly handoff file that summarizes bugs and includes structured context suitable for pasting or importing into an AI development workflow.

## Architecture

The initial implementation is a static web app hosted on GitHub Pages.

Core components:

- `index.html`: Trello Power-Up connector page that calls `TrelloPowerUp.initialize`.
- Export popup page: Trello iframe popup opened from the `list-actions` capability.
- Client-side serializers: shared utilities for JSON, CSV, filename generation, attachment metadata normalization, and Antigravity handoff formatting.
- Tests: serializer and filename tests that run without Trello.

The MVP implementation must avoid runtime dependencies unless they clearly reduce security or maintenance risk. Static HTML, CSS, and JavaScript are preferred until the app needs a build step.

## MVP Roadmap

### MVP 0: Git, GitHub Pages, Docs, Security Baseline

Recommended Codex model: `GPT-5.4-Mini`, Medium reasoning.

Deliverables:

- Initialize local Git repo on `main`.
- Add this implementation artifact.
- Add `README.md`.
- Add `.gitignore`.
- Add `.github/workflows/pages.yml`.
- Document GitHub Pages deployment.
- Document security baseline.

Security checklist:

- No secrets committed.
- No Trello API keys or tokens committed.
- No sample board data with private user content committed.
- GitHub Pages must serve over HTTPS.
- Dependencies should remain at zero unless a specific need is justified.

Acceptance criteria:

- `docs/IMPLEMENTATION_PLAN.md` exists.
- Git repo is initialized on `main`.
- GitHub Pages workflow exists.
- Security baseline is documented.

### MVP 1: Private Trello Power-Up Shell

Recommended Codex model: `GPT-5.4-Mini`, Medium reasoning.

Deliverables:

- Add static Power-Up connector page.
- Register the `list-actions` capability.
- Add a single action labeled `Export list...`.
- Open a Trello popup for export controls.
- Add minimal icon assets if required by Trello configuration.

Security checklist:

- Connector must not load third-party scripts except Trello Power-Up client library.
- Do not request Trello REST API authorization.
- Do not persist board, list, card, or member data.
- Do not log private Trello data to console in production code.

Acceptance criteria:

- The private Power-Up can be registered in Trello.
- `Export list...` appears in the list `...` menu.
- Clicking the action opens a popup.

### MVP 2: JSON Export

Recommended Codex model: `GPT-5.5`, Medium reasoning.

Deliverables:

- Read the selected list and visible cards through the Trello Power-Up client library.
- Normalize data into a stable export shape.
- Download a `.json` file locally from the browser.
- Generate safe filenames from board/list names and timestamp.

Security checklist:

- Export must happen entirely in the browser.
- No network calls except Trello/client-library calls required by the Power-Up.
- No persistent storage of exported data.
- Filenames must be sanitized to avoid unsafe characters.

Acceptance criteria:

- Empty list exports valid JSON.
- Multi-card list exports valid JSON.
- Exported data includes the selected list identity and cards.

### MVP 3: CSV Export and Tests

Recommended Codex model: `GPT-5.5`, Medium reasoning.

Deliverables:

- Add CSV serializer with stable columns.
- Escape commas, quotes, newlines, and empty values correctly.
- Include UTF-8 BOM if testing shows better Excel compatibility.
- Add serializer tests with fixture cards.

Security checklist:

- CSV formula injection must be considered for cells starting with `=`, `+`, `-`, or `@`.
- Fixture data must be synthetic.
- Tests must not require Trello credentials.

Acceptance criteria:

- CSV opens in Excel and Google Sheets.
- CSV escaping tests pass.
- No private board data is included in fixtures.

### MVP 4: UX Polish and Edge Cases

Recommended Codex model: `GPT-5.4-Mini`, Medium reasoning.

Deliverables:

- Add loading, success, and error states.
- Show selected list name and card count before download.
- Handle empty lists clearly.
- Keep popup UI compact and Trello-like.
- Add user-facing privacy note in the popup or linked docs.

Security checklist:

- Error messages must not expose tokens, raw stack traces, or sensitive data.
- UI must not encourage sharing exported data with third parties.
- Keep controls limited to explicit user-triggered exports.

Acceptance criteria:

- User can understand what will be exported before downloading.
- Common failures are handled gracefully.
- No layout issues in the Trello popup iframe.

### MVP 5: Attachment Metadata and Antigravity Handoff

Recommended Codex model: `GPT-5.5`, Medium reasoning.

Deliverables:

- Include attachment metadata exposed by Trello, such as name, URL, MIME type, and preview flags when available.
- Add `handoff.md` generation for Antigravity workflows.
- Structure handoff content around title, status/list, labels, description, expected behavior, actual behavior, steps to reproduce, attachments, acceptance criteria, and Trello URL.

Security checklist:

- Do not download attachment bytes unless a later MVP explicitly adds authorized support.
- Warn users that attachment URLs may expose access according to Trello permissions.
- Do not embed auth tokens in generated files.

Acceptance criteria:

- Exported metadata identifies screenshot attachments where Trello exposes enough information.
- Handoff markdown is usable as direct AI development context.

### MVP 6: REST API Authorization Verification

Recommended Codex model: `GPT-5.5`, High reasoning.

Deliverables:

- Compare Power-Up client-library coverage against Trello REST API coverage.
- Verify whether REST auth is required for checklists, custom fields, comments, archived cards, and attachment downloads.
- Document the minimum required scopes if auth is needed.
- Decide whether REST auth belongs in the Power-Up, a local-only tool, or not at all.

Security checklist:

- No implementation of auth until the review is complete.
- Tokens must never be committed, logged, or stored in shared Power-Up data.
- Any token storage design must define scope, visibility, expiration, revocation, and threat model.

Acceptance criteria:

- Decision record exists documenting whether REST API authorization is needed.
- If auth is needed, implementation risks and scope are documented before code is written.

### MVP 7: Public Power-Up Readiness

Recommended Codex model: `GPT-5.5`, High reasoning.

Deliverables:

- Prepare public listing checklist.
- Add privacy page.
- Add support/contact page.
- Add changelog.
- Add screenshots and icon assets.
- Review Atlassian/Trello public Power-Up guidelines.

Security checklist:

- Public docs must accurately describe data handling.
- Privacy page must state whether data leaves the browser.
- No claims should imply Atlassian endorsement.

Acceptance criteria:

- Project can be reviewed against Trello public Power-Up submission expectations.
- Remaining public launch blockers are documented.

### MVP 8: Optional Private Local Bridge

Recommended Codex model: `GPT-5.5`, High reasoning.

Deliverables:

- Design a private local-only bridge for Trello-to-Antigravity workflows if needed.
- Keep it separate from the public/static Power-Up.
- Potential capabilities: read backlog cards, read card attachments, move card to `Ready for Testing`, and add comments.

Security checklist:

- Local bridge must be opt-in.
- Trello write access must be explicit and least-privilege where Trello supports it.
- No third-party MCP services.
- Secrets must live only in local untracked config.

Acceptance criteria:

- A private workflow exists for Antigravity without introducing a hosted third-party sync service.
- The Power-Up remains usable without the local bridge.

## GitHub and Pages Setup

Manual GitHub repository settings:

- Repository name: `trello-list-exporter`
- Visibility: Public
- Initialize with README: No
- Add `.gitignore`: No
- Add license: No initially
- Default branch: `main`

After the repository exists, add the remote URL locally:

```powershell
git remote add origin <REMOTE_URL>
git push -u origin main
```

Enable GitHub Pages:

- Repository Settings > Pages
- Source: GitHub Actions
- Expected URL: `https://<github-user>.github.io/trello-list-exporter/`

Use the GitHub Pages HTTPS URL as the Trello Power-Up connector base once MVP 1 exists.

Optional custom domain path:

- Use a subdomain such as `trello-export.goodplusfast.com`.
- Add the custom domain in GitHub Pages settings after the default Pages deployment works.
- Add the required DNS record with the domain provider or DNS host.
- Keep Enforce HTTPS enabled once GitHub provisions the certificate.
- Add a `CNAME` file in the deployed site when the custom domain is finalized.

## Test Plan

Static checks:

- Confirm GitHub Pages workflow exists.
- Confirm the app is served over HTTPS.
- Confirm no secrets are present in tracked files.

Unit tests:

- JSON export shape.
- CSV escaping for commas, quotes, newlines, empty fields, and formula-like values.
- Filename sanitization.
- Attachment metadata normalization.

Manual Trello QA:

- Empty list.
- Single-card list.
- Multi-card list.
- Cards with labels, due dates, members, long descriptions, multiline descriptions, commas, and quotes.
- Cards with screenshot attachments.
- Large list.
- CSV import into Excel and Google Sheets.
- JSON validation in a text editor.

Security QA:

- Confirm export does not call non-Trello third-party services.
- Confirm generated files are created locally in the browser.
- Confirm no token or board data is persisted unexpectedly.
- Confirm error messages do not expose sensitive data.

## Assumptions

- The repository is public, but all Trello data, credentials, exports, and local configuration remain private and untracked.
- The Power-Up remains free.
- GitHub Pages is sufficient for the initial MVP.
- No backend is introduced before a documented security review.
- REST API authorization is deferred until MVP 6.
- Antigravity sync is handled later through a private local bridge, not a third-party MCP provider.
