export const BARRACKS_LAYOUT={x:4.5,z:-11,width:5.2,depth:5.4,eaves:2.83,ridge:3.68,roofWidth:5.7,roofDepth:5.9,yaw:Math.atan2(-4.5,11)} as const;
export const RUMU_DECK_LAYOUT={floorY:3.08,upperFloorY:3.20,centerX:-.25,length:4.9,wingDepth:1.48,wingZ:1.94} as const;
export const RUMU_TERRACE_LAYOUT={minLevel:3,centerX:-3.675,length:1.95,depth:5.36,bedX:-3.65,bedZ:[-1.98,-.66,.66,1.98]} as const;
export const WATCHTOWER_LAYOUT={x:-14.5,z:-12,yaw:Math.atan2(14.5,12),platformY:4.1,roofY:6.65} as const;
export type TowerLayout={x:number;z:number;yaw:number;platformY:number;roofY:number};
export type BarracksLayout={x:number;z:number;yaw:number;width:number;depth:number;eaves:number;ridge:number;roofWidth:number;roofDepth:number};
export const WATCHTOWER_LAYOUTS:TowerLayout[]=[WATCHTOWER_LAYOUT,{...WATCHTOWER_LAYOUT,x:17,z:-12,yaw:Math.atan2(-17,12)},{...WATCHTOWER_LAYOUT,x:0,z:20,yaw:Math.PI}];
export const BARRACKS_LAYOUTS:BarracksLayout[]=[BARRACKS_LAYOUT,{...BARRACKS_LAYOUT,x:4.5,z:-21,yaw:Math.atan2(-4.5,21)}];
/** Walkable switchback stairs: ground, half landing, upper flight, deck entrance. */
export const TOWER_STAIR_PATH:[number,number,number][]=[[-3.5,.015,2.8],[-3.5,2.05,-2],[-2.25,2.05,-2],[-2.25,4.1,.65],[-.85,4.1,.65]];
export type WalkPoint=[number,number];
export type WalkBounds={minX:number;maxX:number;minZ:number;maxZ:number};
let stairsBounds:WalkBounds|undefined;
export function setStairWalkBounds(bounds:WalkBounds|undefined){stairsBounds=bounds;loops.clear();}
export function walkObstacles(){return [...BARRACKS_LAYOUTS.map(b=>barracksWalkBounds(.45,b)),...WATCHTOWER_LAYOUTS.map(t=>watchtowerWalkBounds(.45,t)),...(stairsBounds?[stairsBounds]:[])];}
/** Includes the entrance stairs, roof, lantern posts and character clearance. */
export function watchtowerWalkBounds(clearance=.45,t:TowerLayout=WATCHTOWER_LAYOUT):WalkBounds{
 const c=Math.cos(t.yaw),s=Math.sin(t.yaw);
 const corners=[-4.2,2.4].flatMap(x=>[-2.6,3.5].map(z=>[t.x+x*c+z*s,t.z-x*s+z*c]));
 return {minX:Math.min(...corners.map(p=>p[0]))-clearance,maxX:Math.max(...corners.map(p=>p[0]))+clearance,minZ:Math.min(...corners.map(p=>p[1]))-clearance,maxZ:Math.max(...corners.map(p=>p[1]))+clearance};
}
/** Includes roof projection and a full character radius, not just the building origin. */
export function barracksWalkBounds(clearance=.45,b:BarracksLayout=BARRACKS_LAYOUT):WalkBounds{
 const c=Math.abs(Math.cos(b.yaw)),s=Math.abs(Math.sin(b.yaw));
 const x=(b.roofWidth*c+b.roofDepth*s)/2+clearance,z=(b.roofWidth*s+b.roofDepth*c)/2+clearance;
 return {minX:b.x-x,maxX:b.x+x,minZ:b.z-z,maxZ:b.z+z};
}
export function insideBarracks(p:WalkPoint,b=barracksWalkBounds()){return p[0]>b.minX&&p[0]<b.maxX&&p[1]>b.minZ&&p[1]<b.maxZ;}
export function crossesBarracks(a:WalkPoint,z:WalkPoint,b=barracksWalkBounds()){
 let lo=0,hi=1;
 for(const [p,q,min,max] of [[a[0],z[0],b.minX,b.maxX],[a[1],z[1],b.minZ,b.maxZ]]){
  const d=q-p;if(Math.abs(d)<1e-10){if(p<=min||p>=max)return false;continue;}
  let u=(min-p)/d,v=(max-p)/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>=hi-1e-9)return false;
 }
 return hi>1e-9&&lo<1-1e-9;
}
/** A tiny visibility graph around one building; no random jumps or deleted scenery. */
export function detourBarracks(start:WalkPoint,end:WalkPoint):WalkPoint[]{
 const obstacles=walkObstacles();if(obstacles.every(b=>!crossesBarracks(start,end,b)))return [end];
 const e=.04,nodes:WalkPoint[]=[start,end,...obstacles.flatMap(b=>[[b.minX-e,b.minZ-e],[b.maxX+e,b.minZ-e],[b.maxX+e,b.maxZ+e],[b.minX-e,b.maxZ+e]] as WalkPoint[])];
 const distance=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),done=new Set<number>();distance[0]=0;
 for(let n=0;n<nodes.length;n++){
  let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||distance[i]<distance[u]))u=i;
  if(u<0||!Number.isFinite(distance[u])||u===1)break;done.add(u);
  for(let v=0;v<nodes.length;v++){if(v===u||done.has(v)||obstacles.some(b=>crossesBarracks(nodes[u],nodes[v],b)))continue;
   const d=distance[u]+Math.hypot(nodes[v][0]-nodes[u][0],nodes[v][1]-nodes[u][1]);if(d<distance[v]){distance[v]=d;previous[v]=u;}
  }
 }
 if(previous[1]<0)return [end];
 const result:WalkPoint[]=[];for(let v=1;v!==0;v=previous[v])result.unshift(nodes[v]);return result;
}
export function avoidBarracks(path:WalkPoint[]):WalkPoint[]{
 if(!path.length)return [];const result:WalkPoint[]=[path[0]];
 for(const p of path.slice(1))result.push(...detourBarracks(result[result.length-1],p));return result;
}
type WalkLoop={points:WalkPoint[];lengths:number[];length:number};
const loops=new Map<string,WalkLoop>();
function safeLoop(rx:number,rz:number){
 const key=rx+','+rz,known=loops.get(key);if(known)return known;
 const raw:WalkPoint[]=Array.from({length:160},(_,i)=>{const angle=i/160*Math.PI*2;return [Math.cos(angle)*rx,Math.sin(angle)*rz] as WalkPoint;}).filter(p=>walkObstacles().every(b=>!insideBarracks(p,b)));
 const path=avoidBarracks([...raw,raw[0]]),lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
 const loop={points:path,lengths,length:lengths[lengths.length-1]};loops.set(key,loop);return loop;
}
export function safeRingPoint(angle:number,rx:number,rz:number):WalkPoint{
 const loop=safeLoop(rx,rz),d=((angle/(Math.PI*2)%1+1)%1)*loop.length;
 let i=1;while(i<loop.lengths.length-1&&loop.lengths[i]<d)i++;
 const a=loop.points[i-1],b=loop.points[i],u=(d-loop.lengths[i-1])/(loop.lengths[i]-loop.lengths[i-1]||1);
 return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
}
export function safeRingAngle(p:WalkPoint,rx:number,rz:number){
 const loop=safeLoop(rx,rz);let best=Infinity,along=0;
 for(let i=1;i<loop.points.length;i++){
  const a=loop.points[i-1],b=loop.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(length||1)));
  const d=(a[0]+dx*u-p[0])**2+(a[1]+dz*u-p[1])**2;if(d<best){best=d;along=loop.lengths[i-1]+Math.sqrt(length)*u;}
 }
 return along/loop.length*Math.PI*2;
}
