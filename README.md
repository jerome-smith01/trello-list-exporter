# Trello List Exporter

Privacy-first Trello Power-Up for exporting cards from a Trello list to JSON and CSV.

This project starts as a public static GitHub Pages app. Early MVPs keep export processing in the browser and avoid storing Trello data on any project backend.

## Status

MVP 2 is in place: the GitHub Pages root acts as the Trello Power-Up connector, and `popup.html` now downloads the selected list as JSON from the Power-Up popup.

## Implementation Plan

The living implementation artifact is maintained in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Security Baseline

- Do not commit Trello API keys, tokens, board exports, screenshots, or private card data.
- Treat every tracked file as public.
- Do not add a backend or third-party data processor without an explicit security review.
- Keep dependencies minimal.
- Use HTTPS hosting through GitHub Pages before registering the Trello Power-Up.

## GitHub Pages

This repo is planned to deploy through GitHub Actions Pages. Once the GitHub repository exists, enable Pages with **Source: GitHub Actions** in repository settings.

The default Pages URL should be `https://jerome-smith01.github.io/trello-list-exporter/`. A custom `goodplusfast.com` subdomain can be added after the default deployment is working.

## Trello Setup

Enable the `list-actions` capability in the Trello Power-Up admin portal and point the connector URL at the GitHub Pages root. Use the icon in `assets/power-up-icon.svg` when configuring the Power-Up.
