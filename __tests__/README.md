# Test Suite for Autonomous i18n Agent

This directory contains the test suite for the Autonomous i18n Agent MVP, covering the main objectives outlined in `architecture.md`.

## Test Structure

### Unit/Integration Tests (`__tests__/`)

- **API Routes** (`api/`): Tests for Next.js API route handlers
  - `jobs.test.ts`: Job creation, validation, and listing
  - `jobs-[jobId].test.ts`: Individual job fetching
  - `jobs-[jobId]-run.test.ts`: Pipeline execution trigger and idempotency

- **Agent Pipeline** (`agent/`): Core pipeline orchestration tests
  - `pipeline.test.ts`: Step execution order, status transitions, error handling

- **Step Implementations** (`agent/steps/`): Individual step tests
  - `2-scan.test.ts`: Hardcoded string detection logic
  - `3-setup-i18n.test.ts`: i18n infrastructure scaffolding

- **Components** (`components/`): React component tests
  - `JobProgress.test.tsx`: Pipeline progress UI
  - `StepRow.test.tsx`: Individual step status display
  - `ResultCard.test.tsx`: Job result and PR link display

### E2E Tests (`e2e/`)

- `golden-path.spec.ts`: Full user flow from form submission to job completion

## Running Tests

```bash
# Run all unit/integration tests
npm run test

# Watch mode for development
npm run test:watch

# Run E2E tests (requires app to be running)
npm run test:e2e
```

## Test Coverage

The test suite validates:

1. **Job Creation & API Layer**: URL validation, GitHub repo checks, job persistence
2. **Pipeline Orchestration**: Step execution order, status management, error handling
3. **String Scanning**: Detection of hardcoded strings, exclusion logic
4. **i18n Setup**: Configuration file generation, Next.js routing setup
5. **Frontend Components**: Real-time updates, status display, PR link rendering
6. **End-to-End Flow**: Complete user journey from form to PR

## Mocking Strategy

- **Supabase**: Mocked at the client level to avoid real database calls
- **GitHub API (Octokit)**: Mocked to return predictable responses
- **Gemini API**: Mocked in transform step tests
- **Step Modules**: Mocked in pipeline tests to verify orchestration without side effects

## Fixtures

Test fixtures are located in `__tests__/fixtures/`:
- `scan/`: Sample TSX files for string detection tests
