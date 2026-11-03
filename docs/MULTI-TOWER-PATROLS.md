# Expanded camp and tower interaction (2026-11-03)

Current scene: three lantern watchtowers, two barracks, 20 shared beds at Rumu
level 3+, and up to 20 rendered member characters. Registered/online counts and
server-side rewards are independent of that rendering budget.

All watchtowers use the shared switchback-stair geometry and route coordinates:
18 physical treads per flight, two flights, a half landing and an open deck gate.
The old decorative ladder has been replaced. Navigation includes all buildings
and their stair footprints. Both barracks expose distinct beds, transforms and
sleep-entry routes; original member and bed IDs are preserved.

Each tower has one reservation across approach, ascent, watch/inspection,
descent and return. Explicit "Jaga menara" requests receive priority and can
request an ambient visitor to descend before handing over the tower. Guards
and explorers also rotate ambient watches. A resting member wakes and walks
down Rumu's stairs before joining a tower shift. A new task reverses the path
already traversed; it never teleports the member off the structure. Appearance
updates retain their ongoing tower visit. Removing a visible member releases
their reservation.

Ambient patrols grant no XP or resources and make no API calls. The existing
guard activity ID, cooldown and server-owned reward rules remain unchanged.
Held gear is stowed while climbing; watching uses lookout or map inspection
poses. The camera button cycles through all three towers.

Tower entrance lanterns use emissive materials rather than extra scene point
lights. Three tower lights, two barracks lights and one campfire light keep the
point-light budget at six, with no added point-light shadows.

Validation: `test-tower-patrol.mjs`, `test-rest-motion.mjs`,
`test-level3-expansion.mjs`, `test-guild-buildings.mjs`, and
`test-activity-animation.mjs`, plus TypeScript and a production build. Tests cover
48 complete tower trips, 9 interrupted trips, safe handover, reservations,
geometry coverage, day/night lamps, 160 sleep/wake journeys and 20-bed capacity.

No database migrations, player progression resets, authentication changes, or
changes to the registered-member display count are part of this update.
