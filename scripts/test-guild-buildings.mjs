import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {motion:m,world:w,camp}=await loadGameModules();
const {createRumuDeck,createGuildBarracks}=await import('../outputs/game-tests/guild-buildings.mjs');
const {BARRACKS_LAYOUT:B,barracksWalkBounds,insideBarracks}=await import('../outputs/game-tests/guild-building-layout.mjs');
const deck=createRumuDeck(),beds=deck.children.filter(o=>o.name.startsWith('deck-bed-'));
assert.equal(beds.length,6);assert.equal(new Set(beds.map(b=>b.userData.role)).size,6);
for(const bed of beds){assert.equal(bed.position.y,3.2);const bounds=new THREE.Box3().setFromObject(bed);assert.ok(bounds.min.y>=3.2-1e-6&&bounds.max.x-bounds.min.x>1.1);assert.ok(Math.abs(bed.position.z)>1.5);}
const barracks=createGuildBarracks(true);assert.equal(barracks.root.position.x,4.5);assert.equal(barracks.root.position.z,-11);assert.equal(barracks.root.children.filter(o=>o.name.startsWith('barracks-bed-')).length,4);
assert.equal(barracks.root.getObjectByName('BARAK GUILD').userData.labelText,'BARAK GUILD');assert.ok(barracks.light.intensity>0);assert.equal(createGuildBarracks(false).light.intensity,0);
assert.ok(new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),B.yaw).dot(new THREE.Vector3(-B.x,0,-B.z).normalize())>.999);
for(const name of ['roof-left','roof-right']){const roof=barracks.root.getObjectByName(name),v=new THREE.Vector3(roof.position.x>0?-1:1,0,0).applyEuler(roof.rotation);assert.ok(v.y>0,'Roof rises toward ridge');}
let journeys=0;
for(let tier=0;tier<5;tier++)for(const task of w.ACTIVITIES)for(let slot=0;slot<2;slot++)for(let start=0;start<8;start++){
 const state=m.createMotion(start*Math.PI/4);state.rx=8.2+tier*1.6;state.rz=7+tier*1.4;let p=m.ringPoint(state.angle,state.rx,state.rz);const resident={bed:'QA',activity:task.activity,lastAction:100000};let arrived=false;
 for(let i=0;i<1100;i++){const next=m.advanceMotion(state,p,resident,slot,100000+i*50,.05).position;assert.ok(!insideBarracks(next));assert.ok(Math.hypot(next[0]-p[0],next[1]-p[1])<=.083);p=next;if(state.phase==='work'){arrived=true;break;}}
 assert.ok(arrived,task.id+' tier '+tier+' must arrive before expiry');
 for(let i=0;i<800;i++){p=m.advanceMotion(state,p,resident,undefined,160000+i*50,.05).position;assert.ok(!insideBarracks(p),'Return route clear');if(state.phase==='stroll')break;}
 journeys++;
}
for(let tier=0;tier<5;tier++)for(let i=0;i<=4000;i++)assert.ok(!insideBarracks(m.ringPoint(i/4000*Math.PI*2,8.2+tier*1.6,7+tier*1.4)),'Full idle ring clears barracks');
console.log('PASS: six fitted deck beds, four barracks beds, readable sign geometry, gable roof, facing, day/night lights, '+journeys+' work/return journeys and five complete stroll rings.');
