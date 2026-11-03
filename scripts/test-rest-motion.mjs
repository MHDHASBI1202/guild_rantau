import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs';
import {loadGameModules} from './load-game-modules.mjs';
const {motion,world,camp,avatar,animation,roles,appearance}=await loadGameModules();
const r=await import('../outputs/game-tests/rest-motion.mjs'),layout=await import('../outputs/game-tests/guild-building-layout.mjs'),build=await import('../outputs/game-tests/guild-buildings.mjs');
// Derive the actual model frame from the shipped GLB, including parent transforms.
const binary=fs.readFileSync('public/assets/rumu.glb'),g=JSON.parse(binary.toString('utf8',20,20+binary.readUInt32LE(12))),parents={};
g.nodes.forEach((n,i)=>(n.children??[]).forEach(j=>parents[j]=i));
function matrix(i){const n=g.nodes[i],m=new T.Matrix4().compose(new T.Vector3(...(n.translation??[0,0,0])),new T.Quaternion(...(n.rotation??[0,0,0,1])),new T.Vector3(...(n.scale??[1,1,1])));return parents[i]===undefined?m:matrix(parents[i]).multiply(m);}
const bounds=new T.Box3(),rolls=[];
g.nodes.forEach((n,i)=>{if(n.mesh===undefined)return;for(const p of g.meshes[n.mesh].primitives){const a=g.accessors[p.attributes.POSITION],b=new T.Box3(new T.Vector3(...a.min),new T.Vector3(...a.max)).applyMatrix4(matrix(i));bounds.union(b);if(['Bedroll blue','Bedroll terracotta'].includes(g.materials[p.material]?.name))rolls.push(b);}});
const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
function frameFor(multiplier=1.08){const scale=12/Math.max(size.x,size.z)*multiplier;return r.createRestFrame(new T.Matrix4().makeScale(scale,scale,scale).setPosition(-center.x*scale,-bounds.min.y*scale,-center.z*scale));}
const frame=frameFor();layout.setStairWalkBounds(r.stairBounds(frame));
const env=camp.createCampEnvironment({...world.EMPTY_WORLD,...Object.fromEntries(world.IMPACTS.map(i=>[i.key,6]))}).root;
const props=env.children.filter(o=>o.name.startsWith('camp-')||['kolam','api-unggun'].includes(o.name)).map(o=>{const b=new T.Box3().setFromObject(o);return {minX:b.min.x-.35,maxX:b.max.x+.35,minZ:b.min.z-.35,maxZ:b.max.z+.35};});
const staging=restStaging();
function restStaging(){return r.ALL_BED_TARGETS.filter(b=>b.location!=='barracks').map(b=>{const path=r.routeToBed(new T.Vector3(9.8,.015,0),b,frame,props);assert.ok(path);const firstStair=path.findIndex(p=>p.space==='stairs');return path[firstStair-2].pos;});}
assert.equal(new Set(staging.map(p=>JSON.stringify(p))).size,staging.length,'Every deck/tent bed gets its own ground waiting spot');
const book=new r.BedReservations(),ids=Array.from({length:20},(_,i)=>'member-'+String(i).padStart(2,'0'));
book.sync(ids,r.availableBeds(2));assert.equal(book.owners.size,16);assert.equal(new Set([...book.owners.values()].map(b=>b.id)).size,16);
const before=[...book.owners].map(([id,b])=>[id,b.id]);book.sync([...ids].reverse(),r.availableBeds(2));assert.deepEqual([...book.owners].map(([id,b])=>[id,b.id]),before,'Polling order must not change beds');
book.sync(ids.slice(1),r.availableBeds(2));assert.ok(book.owners.has('member-16'),'Vacancy goes to waiting member');
assert.ok(r.availableBeds(1).every(b=>b.location==='barracks'),'Invisible deck beds cannot be reserved');
const deck=build.createRumuDeck();
for(const bed of r.ALL_BED_TARGETS){if(bed.location==='tent'){const b=rolls[Number(bed.id.at(-1))];assert.ok(b.containsPoint(new T.Vector3(bed.pos[0],bed.pos[1]-1e-6,bed.pos[2])),'Original roll target must lie on real GLB bed');}
 else{const mesh=bed.location==='deck'?deck.getObjectByName('deck-bed-'+bed.id.at(-1)):env.getObjectByName('barracks-bed-'+bed.id.at(-1));const center=mesh.getWorldPosition(new T.Vector3());if(bed.location==='barracks')center.applyMatrix4(env.getObjectByName(bed.barracksIndex?'barak-2':'barak').matrixWorld.clone().invert());assert.ok(Math.abs(center.x-bed.pos[0])<1e-5&&Math.abs(center.z-bed.pos[2])<1e-5,'Targets match actual bed geometry');}}
const stairs=build.createDeckStairs();stairs.update(frame);const steps=stairs.root.children.filter(m=>m.geometry.parameters.width===r.STAIR_WIDTH);assert.equal(steps.length,r.STAIR_STEPS);assert.ok(Math.abs(steps[0].position.y-.05-(frame.stairsBase.y+(frame.stairsTop.y-frame.stairsBase.y)/r.STAIR_STEPS-.10))<1e-6);
const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');const glbScene=(await new GLTFLoader().parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'')).scene;const campGroup=glbScene.getObjectByName('Camp_static_mesh');let beforeIndices=0;campGroup.traverse(o=>{if(o.isMesh)beforeIndices+=o.geometry.index.count;});build.openOriginalCampWalkway(glbScene);let afterIndices=0;campGroup.traverse(o=>{if(o.isMesh)afterIndices+=o.geometry.index.count;});assert.ok(afterIndices<beforeIndices,'Open internal rails for real original bedroll access');
const restAnimation=await import('../outputs/game-tests/rest-animation.mjs');let poseCases=0;
for(const role of roles.ROLES)for(const gender of ['laki-laki','perempuan'])for(const hair of appearance.HAIR_STYLES){
 const rig=avatar.createAvatar({name:'QA',bed:'QA',role,color:'#8baf9c',gender,hairStyle:hair.id}),kit=animation.createActivityKit(rig),original=new Map();rig.root.traverse(node=>original.set(node,node.visible));
 const state=r.startRest(new T.Vector3(9.8,.015,0),r.ALL_BED_TARGETS[0],frame,props);state.phase='sleep';const pose=r.sleepPose(state.bed,frame);rig.root.position.copy(pose.position);rig.root.quaternion.copy(pose.quaternion);
 restAnimation.animateRest(rig,kit,state,10,false,false,false);assert.equal(rig.cape.visible,false);assert.ok(kit.tools.every(t=>!t.node.visible));assert.equal(rig.leftLeg.rotation.x,.28);assert.equal(rig.root.userData.sleepEyes.visible,true);assert.equal(rig.head.getObjectByName('Mata putih').visible,false);assert.ok(rig.head.quaternion.angleTo(new T.Quaternion())<1e-6);
 state.phase='leave';restAnimation.animateRest(rig,kit,state,11,false,true,false);rig.root.traverse(node=>{if(/topi|helm|tudung|baret|jerami|caping|mahkota|pelindung pipi|tas herbal|ransel|gulungan alas|sayap|sarung pedang|pegangan pedang|gagang pedang/i.test(node.name)||node===rig.cape)assert.equal(node.visible,original.get(node),'Original equipped visibility restored after waking');});
 restAnimation.animateRest(rig,kit,state,12,true,true,true);assert.ok(kit.tools.every(t=>!t.node.visible),'Hands free on stairs');avatar.disposeAvatar(rig.root);poseCases++;
}
console.log('PASS: '+poseCases+' role/gender/hair sleep poses and equipment restoration; real GLB internal rail opened.');
let cases=0;
for(const bed of r.ALL_BED_TARGETS)for(let start=0;start<8;start++){
 const p2=motion.ringPoint(start*Math.PI/4),origin=new T.Vector3(p2[0],.015,p2[1]),p=origin.clone(),q=new T.Quaternion(),state=r.startRest(p,bed,frame,props);assert.ok(state,bed.id+' has reachable route');
 let slept=false;
 for(let i=0;i<3000;i++){const prev=p.clone();r.advanceRest(state,p,q,frame,.05,true);assert.ok(prev.distanceTo(p)<.101,'No vertical or horizontal teleport');if(state.phase==='sleep'){slept=true;break;}}
 assert.ok(slept,bed.id+' must reach sleep');const pose=r.sleepPose(bed,frame);assert.ok(p.distanceTo(pose.position)<1e-6);assert.ok(new T.Vector3(0,0,1).applyQuaternion(q).dot(new T.Vector3(0,1,0))>.999,'Sleep facing up, not lying sideways off bed');
 let done=false;for(let i=0;i<3000;i++){const prev=p.clone(),result=r.advanceRest(state,p,q,frame,.05,false);assert.ok(prev.distanceTo(p)<.101,'Waking must descend, never drop');if(result.done){done=true;break;}}
 assert.ok(done);assert.ok(p.distanceTo(origin)<1e-5,'Return along route to original ground point');cases++;
}
for(const multiplier of [1,1.16,1.25,1.35]){const f=frameFor(multiplier);layout.setStairWalkBounds(r.stairBounds(f));for(const bed of r.ALL_BED_TARGETS){const start=motion.ringPoint(.3),s=r.startRest(new T.Vector3(start[0],.015,start[1]),bed,f,props);assert.ok(s,'Route fits every Rumu size');const pose=r.sleepPose(bed,f),head=pose.position.clone().addScaledVector(new T.Vector3(0,1,0).applyQuaternion(pose.quaternion),1.75);assert.ok(head.y>bed.pos[1]||bed.location==='barracks');}}
// Cancel halfway up the stairs, then complete descent before resuming work.
layout.setStairWalkBounds(r.stairBounds(frame));const p=new T.Vector3(9.8,.015,0),q=new T.Quaternion(),s=r.startRest(p,r.ALL_BED_TARGETS[0],frame,props);for(let i=0;i<3000&&p.y<2;i++)r.advanceRest(s,p,q,frame,.05,true);assert.ok(p.y>=2);let done=false;for(let i=0;i<3000;i++){const prev=p.clone();const result=r.advanceRest(s,p,q,frame,.05,false);assert.ok(prev.distanceTo(p)<.101);if(result.done){done=true;break;}}assert.ok(done&&p.y===.015);
let workCases=0;
for(let tier=0;tier<5;tier++)for(const task of world.ACTIVITIES)for(let slot=0;slot<2;slot++)for(let start=0;start<8;start++){
 const state=motion.createMotion(start*Math.PI/4);state.rx=8.2+tier*1.6;state.rz=7+tier*1.4;let p=motion.ringPoint(state.angle,state.rx,state.rz),arrived=false;const resident={bed:'QA',activity:task.activity,lastAction:100000};
 for(let i=0;i<1100;i++){p=motion.advanceMotion(state,p,resident,slot,100000+i*50,.05).position;assert.ok(!layout.insideBarracks(p,r.stairBounds(frame)),'Daytime walks clear stairs');assert.ok((p[0]/6.2)**2+(p[1]/5.1)**2>1,'Daytime routes stay outside Rumu');if(state.phase==='work'){arrived=true;break;}}
 assert.ok(arrived);workCases++;
}
console.log('PASS: '+workCases+' daytime work routes with physical stairs present.');
layout.setStairWalkBounds(undefined);console.log('PASS: '+cases+' full sleep/wake journeys, cancellation on stairs, real GLB roll positions, all Rumu scales, unique stable bed reservations, capacity overflow, upright wake and continuous 3D movement.');


