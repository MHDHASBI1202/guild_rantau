import * as THREE from 'three';
import assert from 'node:assert/strict';
import {loadGameModules} from './load-game-modules.mjs';
const {motion:m,world:w,animation:a,avatar:v,roles,appearance,camp}=await loadGameModules();
const now=100000;const environment=camp.createCampEnvironment({...w.EMPTY_WORLD,...Object.fromEntries(w.IMPACTS.map(i=>[i.key,6]))}).root;environment.updateMatrixWorld(true);const furniture=environment.children.map(g=>new THREE.Box3().setFromObject(g).expandByScalar(.30));
for(const task of w.ACTIVITIES){
 const resident={bed:'QA',activity:task.activity,lastAction:now};assert.equal(m.recentActivity(resident,now).id,task.id);assert.equal(m.recentActivity(resident,now+55000),undefined);
 for(let slot=0;slot<2;slot++)for(let start=0;start<8;start++){
  let position=m.ringPoint(start*Math.PI/4),state=m.createMotion(start*Math.PI/4),arrived=false;
  for(let i=0;i<1000;i++){const before=[...position],result=m.advanceMotion(state,position,resident,slot,now+i*50,.05);position=result.position;assert.ok(Math.hypot(position[0]-before[0],position[1]-before[1])<=.083,'Movement must remain continuous');assert.ok(furniture.every(b=>position[0]<b.min.x||position[0]>b.max.x||position[1]<b.min.z||position[1]>b.max.z),'Walking body clearance must avoid camp furniture');assert.ok((position[0]/6.2)**2+(position[1]/5.1)**2>1,'Routes must stay outside Rumu clearance oval');if(state.phase==='work'){arrived=true;break;}}
  assert.ok(arrived,task.id+' must reach its work station before expiring');const dock=m.dockPoint(task.impact,slot);assert.ok(Math.hypot(position[0]-dock[0],position[1]-dock[1])<.001);
  const pathBefore=state.path; m.advanceMotion(state,position,{...resident},slot,now+30000,.05);assert.equal(state.phase,'work','A polling refresh must not restart walking');assert.equal(state.path,pathBefore);
  m.advanceMotion(state,position,resident,undefined,now+56000,.05);assert.ok(['return','stroll'].includes(state.phase));
 }
}
const queue=Array.from({length:12},(_,i)=>({bed:'Q'+i,activity:w.ACTIVITIES[0].activity,lastAction:now+i}));assert.equal(m.workSlots(queue,now+200).size,2);assert.deepEqual([...m.workSlots(queue,now+200).keys()],['Q0','Q1']);
assert.equal(m.recentActivity({bed:'Q',activity:'Tiba di kamp',lastAction:now},now),undefined);
let cases=0;
for(const role of roles.ROLES)for(const hair of appearance.HAIR_STYLES)for(const task of w.ACTIVITIES){
 const rig=v.createAvatar({name:'QA',bed:'QA',role,color:'#8baf9c',hairStyle:hair.id}),kit=a.createActivityKit(rig);
 for(const t of [0,.8,2.4]){a.animateActivity(rig,kit,t,task.id,5+t);assert.ok(kit.items.get(task.id).visible);assert.equal([...kit.items.values()].filter(g=>g.visible).length,1);assert.equal(rig.leftLeg.rotation.x,0);assert.equal(rig.rightLeg.rotation.x,0);assert.ok(Math.abs(rig.head.rotation.y)<=.21);rig.root.updateMatrixWorld(true);rig.root.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite));});}
 const held=kit.items.get(task.id),toolBox=new THREE.Box3().setFromObject(held);
 rig.head.traverse(o=>{if(o.isMesh&&o.userData.hairPart){const points=o.geometry.getAttribute('position');for(let i=0;i<points.count;i++){const point=new THREE.Vector3().fromBufferAttribute(points,i).applyMatrix4(o.matrixWorld);if(point.y>=toolBox.min.y&&point.y<=toolBox.max.y&&point.x>=toolBox.min.x&&point.x<=toolBox.max.x)assert.ok(point.z<toolBox.min.z-.015,'Hair at hand height must clear held equipment');}}});

 assert.ok([rig.leftHand,rig.rightHand].includes(held.parent),'Work tools must be attached to an actual hand');
 a.animateActivity(rig,kit,1,task.id,5,true);const reduced=rig.rightArm.rotation.x;a.animateActivity(rig,kit,100,task.id,5,true);assert.equal(rig.rightArm.rotation.x,reduced);
 a.animateActivity(rig,kit,3,undefined,0);assert.equal(kit.root.visible,false);for(const tool of kit.tools)assert.equal(tool.node.visible,tool.visible,'Role equipment must return after work');
 v.disposeAvatar(rig.root);cases++;
}
v.disposeAvatar(environment);
console.log(`PASS: 128 routed journeys, Rumu clearance, continuity, expiry/return, poll stability, two-worker queues, ${cases} role/hair/activity rigs, role-tool restore and reduced motion.`);
