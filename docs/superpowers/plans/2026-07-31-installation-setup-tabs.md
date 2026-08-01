# Installation Setup Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform `/setup` into a single-screen, tabbed installation form and expose the same company, appearance, and system-preference fields in Super Admin, with fixed EZ Soft support contacts and the first user as `SA_MASTER`.

**Architecture:** Extend the existing setup payload and organization configuration rather than creating a second configuration path. The setup keeps all tab state in one form and submits one atomic payload; Super Admin reads and updates the persisted fields through the existing organization endpoints. Fixed support contacts are display-only application constants.

**Tech Stack:** Next.js/React, React Hook Form, Zod, NestJS, class-validator, TypeORM, Vitest.

## Global Constraints

- Do not add a user-facing organization slug.
- Do not expose support email or phone as editable organization fields.
- Defaults are `pt-BR`, `America/Sao_Paulo`, and `DD/MM/YYYY`.
- The setup-created administrator must use the `SA_MASTER` role.
- Do not modify `apps/web/src/components/ui/`.

### Task 1: Extend the setup contract and persisted defaults

**Files:**
- Modify: `apps/api/src/auth/dto/register.dto.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/web/src/modules/auth/request-access-validation.ts`
- Modify: `apps/web/src/modules/auth/request-access-payload.ts`
- Modify: `apps/web/src/environments.ts`
- Test: existing auth setup service tests and new focused setup contract assertions

- [x] Add validated setup fields for logo/icon/favicon, primary/secondary colors, theme, density, locale, timezone, and date format.
- [x] Apply the specified defaults server-side so omitted values are still correct.
- [x] Persist the configuration on the created organization and explicitly create the user as `SA_MASTER`.
- [x] Add fixed EZ Soft support constants for display only.

### Task 2: Replace the two-step setup view with one tabbed form

**Files:**
- Modify: `apps/web/src/views/Setup.tsx`
- Modify: `apps/web/src/views/Setup.test.tsx`

- [x] Create tabs for company data, appearance, system preferences, administrator, and review.
- [x] Keep one form state and validate each tab before moving forward.
- [x] Pre-fill locale, timezone, and date format.
- [x] Show fixed support contacts without editable inputs.
- [x] Preserve full-page navigation after successful setup and existing setup-status behavior.

### Task 3: Expose the same configuration in Super Admin

**Files:**
- Modify: `apps/api/src/modules/super-admin/dto/update-organization.dto.ts`
- Modify: `apps/api/src/modules/super-admin/super-admin.service.ts`
- Modify: `apps/web/src/lib/api/super-admin.ts`
- Modify: `apps/web/src/modules/super-admin/update-organization-validation.ts`
- Modify: `apps/web/src/modules/super-admin/edit-organization-dialog.tsx`
- Add/modify: focused Super Admin component/service tests

- [x] Return and update appearance and system-preference fields through the existing organization endpoint.
- [x] Reuse the same defaults and validation rules.
- [x] Remove editable support fields and keep support contacts informational.
- [x] Add the new sections to the existing editor without changing organization status behavior.

### Task 4: Verify

- [x] Run focused web setup and Super Admin tests.
- [x] Run API setup and Super Admin tests.
- [x] Run targeted lint and typecheck for changed sources.
- [x] Inspect the final diff and report any environment limitation.
