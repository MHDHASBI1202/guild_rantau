import assert from 'node:assert/strict';
import * as T from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {world,camp,motion,avatar,animation}=await loadGameModules();
const patrol=await import('../outputs/game-tests/tower-patrol.mjs'),layout=await import('../outputs/game-tests/guild-building-layout.mjs'),rest=await import('../outputs/game-tests/rest-motion.mjs');
const {animateTowerVisit}=await import('../outputs/game-tests/tower-animation.mjs');
const {MAX_VISIBLE_MEMBERS}=await import('../outputs/game-tests/scene-limits.mjs');
const environment=camp.createCampEnvironment({...world.EMPTY_WORLD,...Object.fromEntries(world.IMPACTS.map(i=>[i.key,6]))},true).root;
assert.equal(MAX_VISIBLE_MEMBERS,20);assert.equal(layout.WATCHTOWER_LAYOUTS.length,3);assert.equal(layout.BARRACKS_LAYOUTS.length,2);assert.equal(rest.availableBeds(3).length,20);
assert.equal(environment.children.filter(o=>o.name.startsWith('menara-lentera')).length,3);assert.equal(environment.children.filter(o=>o.name==='barak'||o.name==='barak-2').length,2);
let physicalSteps=0,pointLights=0;environment.traverse(o=>{if(o.name==='tower-stair-tread')physicalSteps++;if(o.isPointLight)pointLights++;});
assert.equal(physicalSteps,108);assert.ok(pointLights<=6,'Bound point-light cost for 20 avatars');
for(const tower of environment.children.filter(o=>o.name.startsWith('menara-lentera'))){
 const bounds=new T.Box3().setFromObject(tower,true),safe=layout.watchtowerWalkBounds(.45,layout.WATCHTOWER_LAYOUTS[tower.userData.towerIndex]);
 assert.ok(bounds.min.x>=safe.minX&&bounds.max.x<=safe.maxX&&bounds.min.z>=safe.minZ&&bounds.max.z<=safe.maxZ);
}
const roofs=[];environment.traverse(o=>{if(o.name==='tower-roof')roofs.push(o);});
assert.equal(roofs.length,3,'Every tower has a roof');
for(const roof of roofs){assert.equal(roof.visible,true);assert.equal(roof.material.transparent,false);assert.equal(roof.material.opacity,1);}
const props=environment.children.filter(o=>o.name.startsWith('camp-')||['kolam','api-unggun'].includes(o.name)).map(o=>{const b=new T.Box3().setFromObject(o);return {minX:b.min.x-.35,maxX:b.max.x+.35,minZ:b.min.z-.35,maxZ:b.max.z+.35};});
const book=new patrol.TowerReservations();
for(let i=0;i<3;i++)assert.notEqual(book.claim('guard-'+i,new T.Vector3(9,.015,0)),undefined);
assert.equal(book.claim('waiting',new T.Vector3()),undefined);const old=[...book.owners];book.sync(['guard-2','guard-1','guard-0']);assert.deepEqual([...book.owners],old);
book.sync(['guard-2','guard-1']);assert.notEqual(book.claim('waiting',new T.Vector3()),undefined);
let trips=0,cancellations=0;
for(let tower=0;tower<3;tower++){
 const entry=patrol.towerEntry(tower);assert.ok(layout.walkObstacles().every(b=>!layout.insideBarracks([entry.x,entry.z],b)),'Tower approach starts outside collision rectangles');
 for(const kind of ['guard','inspection'])for(let start=0;start<8;start++){
  const p2=motion.ringPoint(start*Math.PI/4),origin=new T.Vector3(p2[0],.015,p2[1]),position=origin.clone(),q=new T.Quaternion();
  const state=patrol.startTowerVisit(position,tower,kind,props);assert.ok(state,`Reachable tower ${tower} from ${start}`);
  let watched=false,climbed=false,descended=false,done=false;
  for(let step=0;step<5000;step++){
   const previous=position.clone(),result=patrol.advanceTowerVisit(state,position,q,.05);
   assert.ok(position.distanceTo(previous)<=.078,'No horizontal/vertical teleport');assert.ok(position.y>=.014);
   if(state.phase==='watch'){watched=true;assert.ok(Math.abs(position.y-4.1)<1e-5,'Feet stand on real tower floor');}
   climbed||=state.phase==='climb';descended||=state.phase==='descend';
   if(result.done){done=true;break;}
  }
  assert.ok(done&&watched&&climbed&&descended);assert.ok(position.distanceTo(origin)<1e-5);trips++;
 }
 for(const cancelHeight of [.6,2.5,4.1]){
  const p2=motion.ringPoint(.3),origin=new T.Vector3(...[p2[0],.015,p2[1]]),position=origin.clone(),q=new T.Quaternion(),state=patrol.startTowerVisit(position,tower,'guard',props);assert.ok(state);
  for(let i=0;i<3000&&position.y<cancelHeight-.01;i++)patrol.advanceTowerVisit(state,position,q,.05);
  assert.ok(position.y>=cancelHeight-.01);let done=false;
  for(let i=0;i<3000;i++){const previous=position.clone(),result=patrol.advanceTowerVisit(state,position,q,.05,false);assert.ok(previous.distanceTo(position)<=.078);if(result.done){done=true;break;}}
  assert.ok(done&&position.distanceTo(origin)<1e-5);cancellations++;
 }
}
for(const role of ['Penjaga','Penjelajah','Perajin']){
 const rig=avatar.createAvatar({name:'QA',bed:'QA',role,color:'#8baf9c',gender:'laki-laki'}),kit=animation.createActivityKit(rig),state=patrol.startTowerVisit(new T.Vector3(9.8,.015,0),0,'guard',props);assert.ok(state);
 state.phase='climb';animateTowerVisit(rig,kit,state,10,false,true,true);assert.ok(kit.tools.every(t=>!t.node.visible));
 state.phase='watch';animateTowerVisit(rig,kit,state,11,false,false,false);assert.ok(Number.isFinite(rig.head.rotation.y));
 for(const reduced of [true,false])animateTowerVisit(rig,kit,state,12,reduced,false,false);
 avatar.disposeAvatar(rig.root);
}
// A player-requested watch can request an ambient visitor to descend first.
const origin=new T.Vector3(9.8,.015,0),position=origin.clone(),q=new T.Quaternion(),outgoing=patrol.startTowerVisit(origin,1,'inspection',props);assert.ok(outgoing);
for(let i=0;i<3000&&position.y<1;i++)patrol.advanceTowerVisit(outgoing,position,q,.05);
outgoing.yielding=true;let yielded=false;
for(let i=0;i<3000;i++){const before=position.clone(),result=patrol.advanceTowerVisit(outgoing,position,q,.05);assert.ok(position.distanceTo(before)<=.078);if(result.done){yielded=true;break;}}
assert.ok(yielded&&position.distanceTo(origin)<1e-5,'Hand over a tower only after safely descending');
console.log('PASS: 3 towers, 2 barracks, 20 visible members/beds, 108 stair treads, bounded lighting, '+trips+' complete patrol trips, '+cancellations+' safe mid-trip cancellations, stable one-person tower reservations and tool/animation checks.');
