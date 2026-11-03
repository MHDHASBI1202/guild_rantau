import * as THREE from 'three';
import {reachHand,type AvatarRig} from './avatar-model';
import {animateActivity,type ActivityKit} from './activity-animation';
import type {TowerVisit} from './tower-patrol';
export function animateTowerVisit(rig:AvatarRig,kit:ActivityKit,visit:TowerVisit,time:number,reduced:boolean,moving:boolean,climbing:boolean){
 const watching=visit.phase==='watch';
 animateActivity(rig,kit,time,watching?(visit.kind==='guard'?'guard':'explore'):undefined,watching?visit.watchElapsed:0,reduced,moving,watching);
 if(climbing){for(const tool of kit.tools)tool.node.visible=false;reachHand(rig,-1,new THREE.Vector3(-.53,.85,.10));reachHand(rig,1,new THREE.Vector3(.53,.85,.10));}
 if(watching&&!reduced)rig.head.rotation.y+=Math.sin(time*.6)*.20;
}
