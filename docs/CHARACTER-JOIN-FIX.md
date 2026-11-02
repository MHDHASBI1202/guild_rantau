# Character creation regression after sub-role support

The sub-role change called `starterWardrobe()` during signup without importing
it. Authenticated new players therefore hit a server exception before the
character insert and received an empty/non-JSON failure in the creation form.

The fix imports the existing initializer, retains all six roles and 18
specializations, and preserves the current character data format. Guild API
exceptions now return JSON with an appropriate HTTP error status. The creation
form and main guild actions translate empty/truncated/non-JSON replies into
readable messages rather than exposing `Unexpected end of JSON input`.

No production database migration, reset, fixture insertion, or player-account
change is needed.

## Validation

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --pretty false`.
- Production build: `node scripts/build-cloudflare.mjs`.
- Existing definitions: `node scripts/test-subroles.mjs`.
- Response parsing: `node scripts/test-guild-response.mjs`.
- Actual production Worker served locally against a separate local D1 database:
  `node scripts/test-character-join-regression.mjs`.
- All 18 specializations create and persist characters. Missing/invalid
  specializations fall back to the correct default. Duplicate signup returns
  JSON 409; malformed requests, missing sessions, and foreign origins return
  JSON 400/401/403. An induced local database failure returns JSON 500.
- A pre-existing local fixture retains its XP, resources, equipment and tickets.

The integration test expects the production build on `127.0.0.1:5186`, with
local migrations applied using `--persist-to outputs/character-join-regression/state`.
It seeds synthetic accounts and temporarily renames/restores a table ONLY in
that isolated local database. Never point it at production or a real player's
local database. Test reports remain in ignored `outputs/character-join-regression`.

Live verification reads public endpoints only; authenticated signup is covered
by the isolated integration test rather than creating fake players in production.
