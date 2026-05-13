# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is a greenfield project. As of this writing, the only tracked file besides this one is `README.md`, which states the intent:

> Captain's Cottage landing page and blog

There is no source code, package manifest, build configuration, test suite, or CI pipeline yet. Do not assume any framework, language, or tooling — none has been chosen.

## What to do on first substantive change

When the first real work lands (e.g. scaffolding a site generator, choosing a framework, adding a package manifest), update this file in the same change to record:

- The chosen stack and why (e.g. static site generator vs. SPA vs. server-rendered).
- Install / build / dev-server / test / lint commands, including how to run a single test.
- The top-level layout once it exists (content vs. code vs. assets), and any non-obvious conventions for adding a new blog post or page.

Until then, keep edits to this file truthful — don't add commands or architecture descriptions that aren't backed by files in the repo.
