# Audit tangga dan tidur malam

Antigravity commit reviewed: `54c58be`, relative to `73cf9ef`.

The changed files were the building layout, procedural buildings, world animation,
building tests, `/login`, `/signin`, and the Worker auth aliases. No database or
account progression changes were made by this repair.

## Corrections

- Replaced model-local coordinates mistakenly used as world positions. Beds and
  the stair landing resolve through Rumu's live matrix, including scale and sway.
- Replaced the reversed, body-intersecting ladder with ground-mounted wooden
  stairs, an open railing entrance, widened aisles and a rear crosswalk.
- Measured the two original bedrolls from `rumu.glb`; opened their internal rail
  connection while retaining the tent, original bedrolls and other camp props.
- Extended the barracks depth and beds to fit an adult avatar. Entry and internal
  routes use the building's actual rotation and doorway.
- One reservation per visible member ID and one occupant per available bed;
  reservations survive polling order changes. No modulo reuse of occupied beds.
  These are scene reservations, not permanent database bed ownership. The existing
  account bed ID and maximum of 12 visible avatars remain unchanged.
- Twelve available beds at Level 2+: six deck, four barracks, two original rolls.
  Hidden deck facilities cannot be reserved before their level unlocks. Excess
  occupants wait for an available bed rather than sharing an occupied one.
- Added complete entry, settling, sleeping, rising and exit states. Dawn or a new
  task reverses the traversed route before returning to ground activities.
  Travel speed accounts for all three dimensions; no height interpolation/drop.
- Closed eyes, relaxed arms, supported heels and stowed loose gear while lying
  down. Equipped visibility is restored on waking. Stair users leave hands free.
- Retained Antigravity's useful login aliases, restricted matching to exact known
  URLs and preserved the local development sign-in handler.

## Verification

- `node scripts/test-rest-motion.mjs`: 96 complete sleep/wake journeys, mid-stair
  cancellation, real GLB bedroll positions and internal gate, geometry targets,
  frame alignment at each Rumu size, capacity overflow and stable reservations,
  120 role/gender/hair poses and gear restoration, 640 daytime routes with stairs.
- `node scripts/test-guild-buildings.mjs`: existing geometry and 640 work/return
  routes; full strolling rings, roof, facing, sign and lantern checks.
- `node scripts/test-activity-animation.mjs`
- `node scripts/test-equipment-contact.mjs`
- `node scripts/test-google-auth.mjs`
- `node scripts/test-legacy-auth-redirects.mjs`
- TypeScript check and Cloudflare production build.
- Local visual fixture: 12 residents slept in distinct beds, queued for the stairs,
  then rose and walked down at dawn. The fixture is removed before production build.

This is a bounded verification of the current camp layout, not a guarantee against
all future buildings or character-to-character collisions. Update the shared
layout, navigation and regression tests together when expanding the camp.
