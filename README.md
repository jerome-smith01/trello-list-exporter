# Trello List Exporter

Privacy-first Trello Power-Up for exporting cards from a Trello list to JSON and CSV.

This project starts as a static GitHub Pages app. Early MVPs keep export processing in the browser and avoid storing Trello data on any project backend.

## Status

Planning and MVP 0 foundation.

## Implementation Plan

The living implementation artifact is maintained in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Security Baseline

- Do not commit Trello API keys, tokens, board exports, screenshots, or private card data.
- Do not add a backend or third-party data processor without an explicit security review.
- Keep dependencies minimal.
- Use HTTPS hosting through GitHub Pages before registering the Trello Power-Up.

## GitHub Pages

This repo is planned to deploy through GitHub Actions Pages. Once the GitHub repository exists, enable Pages with **Source: GitHub Actions** in repository settings.
