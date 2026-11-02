import * as THREE from 'three';
import {BARRACKS_LAYOUT as B,RUMU_DECK_LAYOUT as D,RUMU_TERRACE_LAYOUT as E,walkObstacles,type WalkBounds,type WalkPoint} from './guild-building-layout';

export type Point3=[number,number,number];
export type BedTarget={id:string;location:'deck'|'barracks'|'tent';pos:Point3;heading:WalkPoint;bedName:string;minLevel?:number};
// Surface centres in the owning model's coordinates. Original rolls were measured from rumu.glb.
export const ALL_BED_TARGETS:BedTarget[]=[
 ...Array.from({length:6},(_,i)=>({id:'deck-'+i,location:'deck' as const,pos:[-1.75+(i%3)*1.5,D.upperFloorY+.3275,i<3?-1.98:1.98] as Point3,heading:[-1,0] as WalkPoint,bedName:'Deck Ranjang '+(i+1)})),
 ...Array.from({length:4},(_,i)=>({id:'barak-'+i,location:'barracks' as const,pos:[i%2?-1.55:1.55,.635,i<2?-1.2:1.2] as Point3,heading:[0,-1] as WalkPoint,bedName:'Barak Ranjang '+(i+1)})),
 ...[.40,1.13].map((x,i)=>({id:'tent-'+i,location:'tent' as const,pos:[x,3.24,.27] as Point3,heading:[0,-1] as WalkPoint,bedName:'Ranjang Awal '+(i+1)})),
 ...E.bedZ.map((z,i)=>({id:'deck-'+(6+i),location:'deck' as const,pos:[E.bedX,D.upperFloorY+.3275,z] as Point3,heading:[-1,0] as WalkPoint,bedName:'Teras Belakang '+(i+1),minLevel:E.minLevel})),
];
export function availableBeds(level:number){return ALL_BED_TARGETS.filter(b=>level>=(b.minLevel??(b.location==='barracks'?1:2))).sort((a,b)=>(b.minLevel??0)-(a.minLevel??0));}
/** Reservations follow stable member IDs, never array indices or modulo arithmetic. */
export class BedReservations{
 readonly owners=new Map<string,BedTarget>();
 sync(ids:string[],beds:BedTarget[]){const valid=new Set(beds.map(b=>b.id)),present=new Set(ids);
  for(const [id,bed] of this.owners)if(!present.has(id)||!valid.has(bed.id))this.owners.delete(id);
  const used=new Set([...this.owners.values()].map(b=>b.id));
  for(const id of [...present].sort()){if(this.owners.has(id))continue;const bed=beds.find(b=>!used.has(b.id));if(bed){used.add(bed.id);this.owners.set(id,bed);}}
  return this.owners;
 }
}
export const STAIR_TOP:Point3=[-2.45,D.upperFloorY,-2.64];
export const STAIR_RUN=8,STAIR_WIDTH=1.15,STAIR_STEPS=32;
export type RestFrame={rumu:THREE.Matrix4;scale:number;stairsBase:THREE.Vector3;stairsTop:THREE.Vector3};
export function createRestFrame(matrix:THREE.Matrix4):RestFrame{
 const top=new THREE.Vector3(...STAIR_TOP).applyMatrix4(matrix),base=top.clone();base.y=.015;base.z-=STAIR_RUN;
 return {rumu:matrix.clone(),scale:new THREE.Vector3().setFromMatrixScale(matrix).x,stairsBase:base,stairsTop:top};
}
export function updateRestFrame(frame:RestFrame,matrix:THREE.Matrix4){frame.rumu.copy(matrix);frame.stairsTop.set(...STAIR_TOP).applyMatrix4(matrix);}
export function stairBounds(frame:RestFrame):WalkBounds{return {minX:frame.stairsBase.x-STAIR_WIDTH/2-.4,maxX:frame.stairsBase.x+STAIR_WIDTH/2+.4,minZ:frame.stairsBase.z-.4,maxZ:frame.stairsTop.z+.4};}
export type Waypoint={space:'world'|'rumu'|'stairs';pos:Point3};
const point=(pos:Point3,space:Waypoint['space']='world'):Waypoint=>({space,pos});
const barakMatrix=new THREE.Matrix4().makeRotationY(B.yaw).setPosition(B.x,0,B.z);
export function bedMatrix(bed:BedTarget,frame:RestFrame){return bed.location==='barracks'?barakMatrix:frame.rumu;}
export function resolvePoint(p:Waypoint,frame:RestFrame){
 if(p.space==='stairs'){const v=frame.stairsBase.clone().lerp(frame.stairsTop,p.pos[0]);v.y=frame.stairsBase.y+(frame.stairsTop.y-frame.stairsBase.y)*p.pos[0];return v;}
 const v=new THREE.Vector3(...p.pos);return p.space==='rumu'?v.applyMatrix4(frame.rumu):v;
}
export function sleepPose(bed:BedTarget,frame:RestFrame){
 const matrix=bedMatrix(bed,frame),center=new THREE.Vector3(...bed.pos).applyMatrix4(matrix),head=new THREE.Vector3(bed.heading[0],0,bed.heading[1]).transformDirection(matrix),up=new THREE.Vector3(0,1,0).transformDirection(matrix),right=head.clone().cross(up).normalize();
 return {position:center.addScaledVector(head,-.95).addScaledVector(up,.34),quaternion:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,head,up))};
}

/** Ground-only navigation samples the swept path against Rumu, furniture and both buildings. */
export function groundRoute(start:WalkPoint,end:WalkPoint,props:WalkBounds[]=[]):WalkPoint[]|undefined{
 const obstacles=[...walkObstacles(),...props],blocked=(x:number,z:number)=>(x/6.25)**2+(z/5.15)**2<1||obstacles.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);
 const clear=(a:WalkPoint,b:WalkPoint)=>{const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.12);for(let i=0;i<=n;i++){const u=n?i/n:0;if(blocked(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u))return false;}return true;};
 if(clear(start,end))return [end];
 const size=113,step=.45,half=(size-1)/2,coords=(id:number):WalkPoint=>[(id%size-half)*step,(Math.floor(id/size)-half)*step];
 const near=(p:WalkPoint)=>{const x=Math.round(p[0]/step)+half,z=Math.round(p[1]/step)+half;let best=-1,d=Infinity;for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=size||zz>=size)continue;const id=zz*size+xx,q=coords(id),dist=Math.hypot(q[0]-p[0],q[1]-p[1]);if(dist<d&&clear(p,q)){best=id;d=dist;}}return best;};
 const first=near(start),last=near(end);if(first<0||last<0)return;
 const distances=new Float64Array(size*size).fill(Infinity),previous=new Int32Array(size*size).fill(-1),closed=new Uint8Array(size*size),heap:{id:number;score:number}[]=[];
 const push=(id:number,score:number)=>{let i=heap.length;heap.push({id,score});while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0],tail=heap.pop()!;if(heap.length){heap[0]=tail;let i=0;while(true){let j=i*2+1;if(j>=heap.length)break;if(j+1<heap.length&&heap[j+1].score<heap[j].score)j++;if(heap[i].score<=heap[j].score)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}return top.id;};
 distances[first]=0;push(first,0);
 while(heap.length){const id=pop();if(closed[id])continue;if(id===last)break;closed[id]=1;const p=coords(id),x=id%size,z=Math.floor(id/size);
  for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){if(x+dx<0||x+dx>=size||z+dz<0||z+dz>=size)continue;const next=id+dz*size+dx;if(closed[next])continue;const q=coords(next);if(!clear(p,q))continue;const d=distances[id]+Math.hypot(dx,dz)*step;if(d<distances[next]){distances[next]=d;previous[next]=id;push(next,d+Math.hypot(q[0]-end[0],q[1]-end[1]));}}
 }
 if(first!==last&&previous[last]<0)return;
 const raw:WalkPoint[]=[end];for(let id=last;id!==first;id=previous[id])raw.unshift(coords(id));raw.unshift(coords(first));
 const result:WalkPoint[]=[];let a=start;while(raw.length){let i=raw.length-1;while(i>0&&!clear(a,raw[i]))i--;a=raw[i];result.push(a);raw.splice(0,i+1);}return result;
}
export function routeToBed(start:THREE.Vector3,bed:BedTarget,frame:RestFrame,props:WalkBounds[]=[]):Waypoint[]|undefined{
 const onDeck=bed.location!=='barracks',slot=bed.location==='tent'?6+Number(bed.id.at(-1)):Number(bed.id.at(-1)),entry=onDeck?frame.stairsBase.clone().add(new THREE.Vector3((slot%3-1)*1.1,0,-1.2-Math.floor(slot/3))):new THREE.Vector3(0,.015,B.depth/2+2.3).applyMatrix4(barakMatrix);
 const ground=groundRoute([start.x,start.z],[entry.x,entry.z],props);if(!ground)return;
 const path=ground.map(([x,z])=>point([x,.015,z]));
 if(onDeck){path.push(point(frame.stairsBase.toArray()));for(let i=1;i<=STAIR_STEPS;i++)path.push(point([i/STAIR_STEPS,0,0],'stairs'));
  const side=bed.pos[2]<0?-1:1,z=side*1.43;
  if(bed.minLevel===E.minLevel){path.push(point([-2.45,D.upperFloorY,0],'rumu'),point([-2.85,D.upperFloorY,0],'rumu'),point([-2.85,D.upperFloorY,bed.pos[2]],'rumu'),point([bed.pos[0]+.95/frame.scale,D.upperFloorY,bed.pos[2]],'rumu'));return path;}
  path.push(point([-2.45,D.upperFloorY,z],'rumu'));
  if(bed.location==='tent'){path.push(point([-2.45,D.upperFloorY,1.43],'rumu'),point([bed.pos[0],D.upperFloorY,1.43],'rumu'),point([bed.pos[0],D.floorY,1.05],'rumu'));}
  else path.push(point([bed.pos[0]+.95/frame.scale,D.upperFloorY,z],'rumu'));
 }else{
  const local:Point3[]=[[0,.18,B.depth/2-.5],[0,.18,bed.pos[2]+.7],[bed.pos[0]-Math.sign(bed.pos[0])*.8,.18,bed.pos[2]+.7]];
  path.push(...local.map(p=>point(new THREE.Vector3(...p).applyMatrix4(barakMatrix).toArray())));
 }
 return path;
}
export type RestState={phase:'enter'|'settle'|'sleep'|'rise'|'leave';bed:BedTarget;path:Waypoint[];visited:Waypoint[];blend:number;origin:THREE.Vector3;fromRotation:THREE.Quaternion;duration:number};
export function startRest(start:THREE.Vector3,bed:BedTarget,frame:RestFrame,props:WalkBounds[]=[]):RestState|undefined{
 const path=routeToBed(start,bed,frame,props);if(!path)return;
 return {phase:'enter',bed,path,visited:[point([start.x,.015,start.z])],blend:0,origin:start.clone(),fromRotation:new THREE.Quaternion(),duration:1};
}
export function advanceRest(state:RestState,position:THREE.Vector3,rotation:THREE.Quaternion,frame:RestFrame,dt:number,wantsSleep:boolean){
 dt=Math.min(.1,Math.max(0,dt));let moving=false,climbing=false,done=false;
 if(!wantsSleep&&['enter','settle','sleep'].includes(state.phase)){
  state.origin.copy(position);state.fromRotation.copy(rotation);state.blend=0;
  if(state.phase==='enter'){state.phase='leave';state.path=[...state.visited].reverse();}
  else{state.phase='rise';state.duration=Math.max(.9,position.distanceTo(resolvePoint(state.visited.at(-1)!,frame))/1.2);}
 }
 if(state.phase==='sleep'){const pose=sleepPose(state.bed,frame);position.copy(pose.position);rotation.copy(pose.quaternion);}
 else if(state.phase==='settle'||state.phase==='rise'){
  state.blend=Math.min(1,state.blend+dt/state.duration);const pose=sleepPose(state.bed,frame),rising=state.phase==='rise',target=rising?resolvePoint(state.visited.at(-1)!,frame):pose.position;
  const q=rising?new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.atan2(target.x-state.origin.x,target.z-state.origin.z),0)):pose.quaternion;
  const u=state.blend*state.blend*(3-2*state.blend);position.lerpVectors(state.origin,target,u);rotation.slerpQuaternions(state.fromRotation,q,u);
  if(state.blend===1){if(rising){state.phase='leave';state.path=[...state.visited].reverse();}else state.phase='sleep';}
 }else{
  let distance=dt*1.65;
  while(state.path.length&&distance>0){const next=state.path[0],target=resolvePoint(next,frame),delta=target.clone().sub(position),length=delta.length();climbing||=next.space==='stairs';
   if(length>1e-5){moving=true;const yaw=Math.atan2(delta.x,delta.z);rotation.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,0)),1-Math.exp(-dt*10));}
   if(length<=distance){position.copy(target);state.path.shift();if(state.phase==='enter')state.visited.push(next);distance-=length;}else{position.addScaledVector(delta,distance/length);distance=0;}
  }
  if(!state.path.length){if(state.phase==='leave')done=true;else{state.phase='settle';state.blend=0;state.origin.copy(position);state.fromRotation.copy(rotation);state.duration=Math.max(.9,position.distanceTo(sleepPose(state.bed,frame).position)/1.2);}}
 }
 return {moving,climbing,done};
}
