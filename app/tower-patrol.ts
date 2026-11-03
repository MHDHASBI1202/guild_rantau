import * as THREE from 'three';
import {WATCHTOWER_LAYOUTS,TOWER_STAIR_PATH,walkObstacles,insideBarracks,type WalkBounds} from './guild-building-layout';
import {groundRoute} from './rest-motion';

type PatrolPoint={position:THREE.Vector3;stairs:boolean};
export type TowerVisit={tower:number;kind:'guard'|'inspection';phase:'approach'|'climb'|'watch'|'descend'|'return';path:PatrolPoint[];visited:PatrolPoint[];remaining:number;watchElapsed:number;manual:boolean;yielding:boolean;returning:boolean};
export function towerMatrix(index:number){const t=WATCHTOWER_LAYOUTS[index];return new THREE.Matrix4().makeRotationY(t.yaw).setPosition(t.x,0,t.z);}
export function towerPoint(index:number,point:[number,number,number]){return new THREE.Vector3(...point).applyMatrix4(towerMatrix(index));}
export function towerEntry(index:number){
 // Start outside the conservative collision rectangle, then use the dedicated access corridor.
 let z=TOWER_STAIR_PATH[0][2]+.8,p=towerPoint(index,[-3.5,.015,z]);
 for(let i=0;i<24&&walkObstacles().some(b=>insideBarracks([p.x,p.z],b));i++){z+=.4;p=towerPoint(index,[-3.5,.015,z]);}
 return p;
}
/** One visitor owns the whole stair/deck trip. Ownership is stable across polling. */
export class TowerReservations{
 readonly owners=new Map<number,string>();
 sync(ids:string[]){const present=new Set(ids);for(const [tower,id] of this.owners)if(!present.has(id))this.owners.delete(tower);}
 claim(id:string,position:THREE.Vector3){
  for(const [tower,owner] of this.owners)if(owner===id)return tower;
  const free=WATCHTOWER_LAYOUTS.map((_,i)=>i).filter(i=>!this.owners.has(i)).sort((a,b)=>towerEntry(a).distanceToSquared(position)-towerEntry(b).distanceToSquared(position));
  if(!free.length)return;this.owners.set(free[0],id);return free[0];
 }
 release(id:string){for(const [tower,owner] of this.owners)if(owner===id)this.owners.delete(tower);}
}
export function startTowerVisit(position:THREE.Vector3,tower:number,kind:TowerVisit['kind'],props:WalkBounds[]=[]):TowerVisit|undefined{
 const entry=towerEntry(tower),route=groundRoute([position.x,position.z],[entry.x,entry.z],props);if(!route)return;
 const path:PatrolPoint[]=route.map(([x,z])=>({position:new THREE.Vector3(x,.015,z),stairs:false}));
 path.push({position:towerPoint(tower,TOWER_STAIR_PATH[0]),stairs:false});
 for(let segment=1;segment<TOWER_STAIR_PATH.length;segment++){
  const a=new THREE.Vector3(...TOWER_STAIR_PATH[segment-1]),b=new THREE.Vector3(...TOWER_STAIR_PATH[segment]);
  const steps=Math.abs(b.y-a.y)>.1?18:1;
  for(let i=1;i<=steps;i++)path.push({position:a.clone().lerp(b,i/steps).applyMatrix4(towerMatrix(tower)),stairs:true});
 }
 path.push({position:towerPoint(tower,[.75,4.1,.65]),stairs:false});
 return {tower,kind,phase:'approach',path,visited:[{position:position.clone(),stairs:false}],remaining:kind==='guard'?16:10,watchElapsed:0,manual:false,yielding:false,returning:false};
}
/** Reverse the traversed path before resuming work: no falling or teleporting off a tower. */
export function advanceTowerVisit(state:TowerVisit,position:THREE.Vector3,rotation:THREE.Quaternion,dt:number,continueVisit=true){
 dt=Math.min(.1,Math.max(0,dt));let moving=false,climbing=false;
 if((!continueVisit||state.yielding)&&!state.returning){state.returning=true;state.path=[...state.visited].reverse();}
 if(state.phase==='watch'&&!state.returning){
  state.remaining-=dt;state.watchElapsed+=dt;const t=WATCHTOWER_LAYOUTS[state.tower];rotation.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,t.yaw+Math.PI,0)),1-Math.exp(-dt*6));
  if(state.remaining<=0){state.returning=true;state.path=[...state.visited].reverse();}
 }
 if(state.phase!=='watch'||state.returning){
  let distance=dt*1.55;
  while(state.path.length&&distance>0){
   const next=state.path[0],delta=next.position.clone().sub(position),length=delta.length();
   const stairs=next.stairs||position.y>.1;climbing||=stairs;state.phase=state.returning?(stairs?'descend':'return'):(stairs?'climb':'approach');
   if(length>1e-6){moving=true;rotation.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.atan2(delta.x,delta.z),0)),1-Math.exp(-dt*10));}
   if(length<=distance){position.copy(next.position);state.path.shift();if(!state.returning)state.visited.push(next);distance-=length;}
   else{position.addScaledVector(delta,distance/length);distance=0;}
  }
  if(!state.path.length){if(state.returning)return {done:true,moving:false,climbing:false};state.phase='watch';}
 }
 return {done:false,moving,climbing};
}
