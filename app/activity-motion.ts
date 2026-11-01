import {ACTIVITIES,STATIONS,type ImpactKey} from './world-progress';
export const ACTIVITY_WINDOW_MS=55000;
export type Point=[number,number];
export type ResidentActivity={bed:string;activity:string;lastAction?:number};
export function recentActivity(r:ResidentActivity,now:number){const age=now-(r.lastAction??0);return r.lastAction&&age>=-5000&&age<ACTIVITY_WINDOW_MS?ACTIVITIES.find(a=>a.activity===r.activity):undefined;}
export function workSlots(residents:ResidentActivity[],now:number){const slots=new Map<string,number>(),counts=new Map<string,number>();for(const r of [...residents].sort((a,b)=>(a.lastAction??0)-(b.lastAction??0)||a.bed.localeCompare(b.bed))){const a=recentActivity(r,now);if(!a)continue;const count=counts.get(a.id)??0;if(count<2)slots.set(r.bed,count);counts.set(a.id,count+1);}return slots;}
export const ringPoint=(angle:number):Point=>[Math.cos(angle)*6.8,Math.sin(angle)*5.8];
export const ringAngle=(p:Point)=>Math.atan2(p[1]/5.8,p[0]/6.8);
export function dockPoint(key:ImpactKey,slot:number):Point{const s=STATIONS[key],dx=s.position[0]-s.dock[0],dz=s.position[1]-s.dock[1],d=Math.hypot(dx,dz);return [s.dock[0]-dz/d*slot*.95,s.dock[1]+dx/d*slot*.95];}
export function routeToDock(start:Point,key:ImpactKey,slot=0):Point[]{const dock=dockPoint(key,slot),a=ringAngle(start),b=ringAngle(dock);let delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));const steps=Math.max(1,Math.ceil(Math.abs(delta)/.13));const path:Point[]=[ringPoint(a)];for(let i=1;i<=steps;i++)path.push(ringPoint(a+delta*i/steps));path.push(dock);return path;}
export type MotionState={angle:number;path:Point[];stamp:number;slot:number;action?:typeof ACTIVITIES[number];phase:'stroll'|'travel'|'work'|'return'|'queue';workTime:number};
export function createMotion(angle:number):MotionState{return {angle,path:[],stamp:0,slot:-1,phase:'stroll',workTime:0};}
/** Advances by real distance; a poll never restarts an already running activity. */
export function advanceMotion(m:MotionState,position:Point,resident:ResidentActivity,slot:number|undefined,now:number,dt:number){
 const active=recentActivity(resident,now),nextSlot=slot??-1;
 if(active&&slot!==undefined&&(m.stamp!==resident.lastAction||m.slot!==slot)){
  m.stamp=resident.lastAction!;m.slot=slot;m.action=active;m.path=routeToDock(position,active.impact,slot);m.phase='travel';m.workTime=0;
 }else if((!active||slot===undefined)&&['travel','work'].includes(m.phase)){
  m.angle=ringAngle(position);m.path=[ringPoint(m.angle)];m.phase='return';m.action=undefined;m.slot=-1;
 }
 let x=position[0],z=position[1],moving=false;
 if(m.path.length){let remaining=Math.min(.1,Math.max(0,dt))*1.65;while(m.path.length&&remaining>0){const p=m.path[0],dx=p[0]-x,dz=p[1]-z,d=Math.hypot(dx,dz);if(d<=remaining){x=p[0];z=p[1];m.path.shift();remaining-=d;}else{x+=dx/d*remaining;z+=dz/d*remaining;remaining=0;}moving=true;}
  if(!m.path.length){if(m.phase==='travel'&&active){m.phase='work';m.workTime=0;}else{m.phase=active&&nextSlot<0?'queue':'stroll';m.angle=ringAngle([x,z]);}}
 }else if(m.phase==='work'){m.workTime+=Math.min(.1,Math.max(0,dt));}
 else{m.phase=active&&nextSlot<0?'queue':'stroll';m.angle+=Math.min(.1,Math.max(0,dt))*.16;[x,z]=ringPoint(m.angle);moving=true;}
 return {position:[x,z] as Point,moving,phase:m.phase,action:m.action};
}
