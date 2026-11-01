// Presence belongs to a registered character, never to a browser or login session.
export const ACTIVE_MEMBER_WINDOW_MS=2*60*1000;
export const MEMBER_HEARTBEAT_INTERVAL_MS=45*1000;
export const MEMBER_HEARTBEAT_SQL='UPDATE members SET last_seen=? WHERE id=? AND last_seen<=?';
// One aggregate snapshot guarantees that active members are a subset of the total.
export const MEMBER_COUNTS_SQL='SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN last_seen>? THEN 1 ELSE 0 END),0) AS activeCount FROM members';
