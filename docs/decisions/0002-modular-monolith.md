# ADR 0002: Modular monolith

## Status

Accepted

## Context

MVP scope spans catalog, cart, checkout, and auth. We want clear boundaries without microservice overhead.

## Decision

Organize by vertical feature folders (`features/*`) with shared validation in `lib/validations/*` and pure helpers in `lib/domain/*`.

## Consequences

- Server actions colocate with their feature
- Pages stay thin and compose feature queries/components
- Cross-feature calls (cart merge on login) remain explicit imports
