# TODO - Website interest APIs + React integration

## Backend
- [ ] Verify Interest model supports `accepted` and `rejected` statuses (enum already exists).
- [ ] Ensure website routes implement:
  - [x] `POST /website/requests/:requestId/accept` (authGuard)
  - [x] `POST /website/requests/:requestId/reject` (authGuard)
  - [ ] Add/verify any swagger docs (optional)

## Frontend
- [ ] Wire `ProfileCard.tsx` buttons to API calls:
  - [ ] Send Interest
  - [ ] Accept Interest
  - [ ] Reject Interest
- [ ] Ensure contract uses correct `requestId` (interest id) and updates local UI state.
- [ ] Add loading/error handling.

## Testing
- [ ] Run backend lint/test (if available).
- [ ] Smoke test by accepting/rejecting from website UI.

