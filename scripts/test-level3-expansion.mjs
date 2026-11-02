import assert from 'node:assert/strict';
import * as T from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {motion,world}=await loadGameModules();
const build=await import('../outputs/game-tests/guild-buildings.mjs');
const layout=await import('../outputs/game-tests/guild-building-layout.mjs');
const rest=await import('../outputs/game-tests/rest-motion.mjs');
const deck=build.createRumuDeck();
build.setRumuDeckLevel(deck,2);assert.equal(deck.getObjectByName('level-3-terrace').visible,false);assert.equal(rest.availableBeds(2).length,12);
build.setRumuDeckLevel(deck,3);assert.equal(deck.getObjectByName('level-3-terrace').visible,true);assert.equal(rest.availableBeds(3).length,16);
for(const bed of rest.ALL_BED_TARGETS.filter(b=>b.minLevel===3)){
 const mesh=deck.getObjectByName('deck-bed-'+bed.id.split('-')[1]);assert.ok(mesh);
 assert.equal(mesh.position.x,bed.pos[0]);assert.equal(mesh.position.z,bed.pos[2]);
 const bounds=new T.Box3().setFromObject(mesh);assert.ok(bounds.min.x>layout.RUMU_TERRACE_LAYOUT.centerX-layout.RUMU_TERRACE_LAYOUT.length/2+.15);
}
const book=new rest.BedReservations();book.sync(Array.from({length:20},(_,i)=>'QA-'+i),rest.availableBeds(3));
assert.equal(book.owners.size,16);assert.equal(new Set([...book.owners.values()].map(b=>b.id)).size,16);
const visibleIds=Array.from({length:12},(_,i)=>'visible-'+i),fresh=new rest.BedReservations(),upgrading=new rest.BedReservations();
fresh.sync(visibleIds,rest.availableBeds(3));assert.equal([...fresh.owners.values()].filter(b=>b.minLevel===3).length,4,'New terrace beds are actually used with the existing 12-avatar cap');
upgrading.sync(visibleIds,rest.availableBeds(2));const originalAssignments=[...upgrading.owners];
upgrading.sync(visibleIds,rest.availableBeds(3));assert.deepEqual([...upgrading.owners],originalAssignments,'Unlocking the terrace must not teleport sleeping members');
for(const night of [false,true]){
 const tower=build.createGuildWatchtower(night);assert.equal(tower.root.userData.votingWinner,'MENARA');assert.equal(tower.root.userData.includesLanterns,true);
 assert.equal(tower.root.getObjectByName('MENARA LENTERA').userData.labelText,'MENARA LENTERA');assert.equal(tower.lights.length,3);
 for(const entry of tower.lights){assert.equal(entry.light.intensity>0,night);assert.equal(entry.light.castShadow,false);}
 const bounds=new T.Box3().setFromObject(tower.root),walk=layout.watchtowerWalkBounds();
 assert.ok(bounds.min.x>=walk.minX&&bounds.max.x<=walk.maxX&&bounds.min.z>=walk.minZ&&bounds.max.z<=walk.maxZ,'Navigation covers all physical geometry');
}
let journeys=0;
for(let tier=0;tier<5;tier++){
 for(let i=0;i<1600;i++){
  const point=motion.ringPoint(i/1600*Math.PI*2,8.2+tier*1.6,7+tier*1.4);
  assert.ok(layout.walkObstacles().every(b=>!layout.insideBarracks(point,b)),'Idle routes clear tower and barracks');
 }
 for(const task of world.ACTIVITIES)for(let slot=0;slot<2;slot++)for(let start=0;start<8;start++){
  const state=motion.createMotion(start*Math.PI/4);state.rx=8.2+tier*1.6;state.rz=7+tier*1.4;
  let p=motion.ringPoint(state.angle,state.rx,state.rz),arrived=false;
  for(let i=0;i<1100;i++){
   p=motion.advanceMotion(state,p,{bed:'QA',activity:task.activity,lastAction:100000},slot,100000+i*50,.05).position;
   assert.ok(layout.walkObstacles().every(b=>!layout.insideBarracks(p,b)),'Work route stays outside tower and barracks');
   if(state.phase==='work'){arrived=true;break;}
  }
  assert.ok(arrived);journeys++;
 }
}
console.log('PASS: Level 3 terrace, 16 unique shared beds, level gates, tower + three day/night lanterns, geometry clearance, 8000 stroll points and '+journeys+' work routes.');
