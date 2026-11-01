import {ACTIVITIES,STATIONS,type ImpactKey} from './world-progress';

export const ACTIVITY_WINDOW_MS = 55000;
export type Point = [number, number];
export type ResidentActivity = {
  bed: string;
  activity: string;
  role?: string;
  lastAction?: number;
};

export function recentActivity(r: ResidentActivity, now: number) {
  const age = now - (r.lastAction ?? 0);
  return r.lastAction && age >= -5000 && age < ACTIVITY_WINDOW_MS
    ? ACTIVITIES.find(a => a.activity === r.activity)
    : undefined;
}

export function workSlots(residents: ResidentActivity[], now: number) {
  const slots = new Map<string, number>(),
    counts = new Map<string, number>();
  for (const r of [...residents].sort(
    (a, b) => (a.lastAction ?? 0) - (b.lastAction ?? 0) || a.bed.localeCompare(b.bed)
  )) {
    const a = recentActivity(r, now);
    if (!a) continue;
    const count = counts.get(a.id) ?? 0;
    if (count < 2) slots.set(r.bed, count);
    counts.set(a.id, count + 1);
  }
  return slots;
}

export const ROLE_SPECIALTIES: Record<string, string> = {
  'Penjaga': 'guard',
  'Peramu': 'herbs',
  'Penjelajah': 'explore',
  'Perajin': 'build',
  'Petani': 'plant',
  'Penyihir': 'ward',
};

export function bedHash(bed: string): number {
  let h = 0;
  for (let i = 0; i < bed.length; i++) h = (h << 5) - h + bed.charCodeAt(i);
  return Math.abs(h);
}

export const ringPoint = (angle: number, rx = 9.8, rz = 8.4): Point => [
  Math.cos(angle) * rx,
  Math.sin(angle) * rz,
];
export const ringAngle = (p: Point, rx = 9.8, rz = 8.4) =>
  Math.atan2(p[1] / rz, p[0] / rx);

export function dockPoint(key: ImpactKey, slot: number): Point {
  const s = STATIONS[key],
    dx = s.position[0] - s.dock[0],
    dz = s.position[1] - s.dock[1],
    d = Math.hypot(dx, dz) || 1;
  return [s.dock[0] - (dz / d) * slot * 0.95, s.dock[1] + (dx / d) * slot * 0.95];
}

export function routeToDock(start: Point, key: ImpactKey, slot = 0, rx = 9.8, rz = 8.4): Point[] {
  const dock = dockPoint(key, slot),
    a = ringAngle(start, rx, rz),
    b = ringAngle(dock, rx, rz);
  let delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / 0.12));
  const path: Point[] = [ringPoint(a, rx, rz)];
  for (let i = 1; i <= steps; i++) path.push(ringPoint(a + (delta * i) / steps, rx, rz));
  path.push(dock);
  return path;
}

export type MotionPhase = 'stroll' | 'travel' | 'work' | 'return' | 'queue' | 'idle';

export type MotionState = {
  angle: number;
  path: Point[];
  stamp: number;
  slot: number;
  action?: typeof ACTIVITIES[number];
  phase: MotionPhase;
  workTime: number;
  idleTimer: number;
  idleDuration: number;
  idleAction?: string;
  rx: number;
  rz: number;
};

export function createMotion(angle: number, bed = ''): MotionState {
  const h = bedHash(bed);
  const rx = 8.2 + (h % 5) * 1.6;
  const rz = 7.0 + (h % 5) * 1.4;
  return {
    angle,
    path: [],
    stamp: 0,
    slot: -1,
    phase: 'stroll',
    workTime: 0,
    idleTimer: h % 6,
    idleDuration: 8 + (h % 6),
    rx,
    rz,
  };
}

/** Advances by real distance; alternates between stroll and role-specific idle when inactive. */
export function advanceMotion(
  m: MotionState,
  position: Point,
  resident: ResidentActivity,
  slot: number | undefined,
  now: number,
  dt: number
) {
  const h = bedHash(resident.bed);
  if (!m.rx || !m.rz) {
    m.rx = 8.2 + (h % 5) * 1.6;
    m.rz = 7.0 + (h % 5) * 1.4;
    m.idleTimer ??= h % 6;
    m.idleDuration ??= 8 + (h % 6);
  }

  const active = recentActivity(resident, now),
    nextSlot = slot ?? -1;
  const roleSpecialty = resident.role ? ROLE_SPECIALTIES[resident.role] || 'guard' : 'guard';

  // 1. If real user task is active:
  if (active && slot !== undefined && (m.stamp !== resident.lastAction || m.slot !== slot)) {
    m.stamp = resident.lastAction!;
    m.slot = slot;
    m.action = active;
    m.path = routeToDock(position, active.impact, slot, m.rx, m.rz);
    m.phase = 'travel';
    m.workTime = 0;
    m.idleAction = undefined;
  } else if ((!active || slot === undefined) && ['travel', 'work'].includes(m.phase)) {
    // Finished user task: return to ring path
    m.angle = ringAngle(position, m.rx, m.rz);
    m.path = [ringPoint(m.angle, m.rx, m.rz)];
    m.phase = 'return';
    m.action = undefined;
    m.slot = -1;
    m.idleAction = undefined;
  }

  let x = position[0],
    z = position[1],
    moving = false;

  // 2. Path-following (travel or return):
  if (m.path.length) {
    let remaining = Math.min(0.1, Math.max(0, dt)) * 1.65;
    while (m.path.length && remaining > 0) {
      const p = m.path[0],
        dx = p[0] - x,
        dz = p[1] - z,
        d = Math.hypot(dx, dz);
      if (d <= remaining) {
        x = p[0];
        z = p[1];
        m.path.shift();
        remaining -= d;
      } else {
        x += (dx / d) * remaining;
        z += (dz / d) * remaining;
        remaining = 0;
      }
      moving = true;
    }
    if (!m.path.length) {
      if (m.phase === 'travel' && active) {
        m.phase = 'work';
        m.workTime = 0;
      } else {
        m.phase = active && nextSlot < 0 ? 'queue' : 'stroll';
        m.angle = ringAngle([x, z], m.rx, m.rz);
        m.idleTimer = 0;
        m.idleDuration = 7 + (h % 5);
      }
    }
  } else if (m.phase === 'work') {
    // In active assigned job
    m.workTime += Math.min(0.1, Math.max(0, dt));
    moving = false;
  } else {
    // 3. IDLE ROUTINE: Alternate between strolling and role-specific action
    const stepDt = Math.min(0.1, Math.max(0, dt));
    m.idleTimer = (m.idleTimer ?? 0) + stepDt;

    if (m.phase === 'idle') {
      // Stopped, performing their role idle activity
      moving = false;
      m.workTime += stepDt;
      m.idleAction = roleSpecialty;
      [x, z] = ringPoint(m.angle, m.rx, m.rz);

      if (m.idleTimer >= m.idleDuration) {
        // Time to resume stroll
        m.phase = 'stroll';
        m.idleTimer = 0;
        m.idleDuration = 8 + ((h + Math.floor(now / 15000)) % 6); // 8-13s walk
        m.idleAction = undefined;
      }
    } else {
      // Strolling along the ring path
      m.phase = active && nextSlot < 0 ? 'queue' : 'stroll';
      m.idleAction = undefined;
      m.angle += stepDt * 0.14;
      [x, z] = ringPoint(m.angle, m.rx, m.rz);
      moving = true;

      if (!active && m.idleTimer >= m.idleDuration) {
        // Time to pause and do role-specific idle action
        m.phase = 'idle';
        m.idleTimer = 0;
        m.idleDuration = 8 + ((h + Math.floor(now / 22000)) % 7); // 8-14s role action
        m.workTime = 0;
        m.idleAction = roleSpecialty;
        moving = false;
      }
    }
  }

  return {
    position: [x, z] as Point,
    moving,
    phase: m.phase,
    action: m.action,
    idleAction: m.idleAction,
  };
}
