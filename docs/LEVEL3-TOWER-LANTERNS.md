# Rumu level 3: rear terrace and watchtower lanterns

Historical first rollout. The current counts, rendering budget and interactive
stairs supersede this version; see [MULTI-TOWER-PATROLS.md](MULTI-TOWER-PATROLS.md).

Requested outcome: expand the camp for level 3; MENARA won the community vote,
and lanterns are included because observation and lighting are both important.
This is not recorded as a tied vote and no vote counts are invented.

- Rear terrace opens at Rumu level 3 and remains available at higher levels.
  Four new role-colored beds bring shared scene capacity from 12 to 16.
  Original beds and IDs remain unchanged. The maximum of 12 simultaneously
  rendered characters remains unchanged for mobile performance.
  New bed allocations prioritize the terrace so it is actually used under that
  cap; existing occupied-bed reservations survive a level upgrade unchanged.
- Terrace has a solid floor, braces, perimeter rails and a central entrance.
  New sleep routes cross the rear walkway and terrace aisle, preserving the
  full stairs/settle/sleep/wake/descend flow and unique reservations.
- Ground watchtower stands at the shared layout coordinates, away from the
  barracks, stairs, pond and work stations. Its three lanterns comprise a main
  hanging lamp and two entrance lamps, with day/night emission and lights.
  New point lights do not cast shadows. The tower ladder is architectural;
  autonomous characters do not climb it in this update.
- Tower roof, entry lamps and ladder footprint are included in navigation.
  Trees clear the building footprint. Focused tower viewing hides obstructing
  tree canopies temporarily rather than removing the forest.
- The Menara camera button, build-result board, camp summary and Aru dialogue
  reflect the completed vote. No expired voting invitation is retained.

Validation: `test-level3-expansion.mjs` checks level gates, 16 unique reservations,
bed geometry, tower geometry coverage, three day/night lanterns, 8,000 stroll
points and 640 work routes. Existing building, rest and activity tests pass,
including 128 complete sleep/wake journeys, all current Rumu scales and 120
role/gender/hair sleep poses. TypeScript and the Cloudflare build also pass.

Visual QA uses a separate local D1 fixture under
`outputs/level3-expansion-preview/state`. Fixture characters are not deployed.
There are no database migrations, player-account/progression changes, changes
to login, or changes to the level thresholds in this update.
