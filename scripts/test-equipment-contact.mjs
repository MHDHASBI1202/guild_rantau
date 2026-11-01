import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {avatar:a,animation,world:w,roles,cosmetics:c}=await loadGameModules();
const heldNames={Peramu:'Ikatan herbal',Penjelajah:'Peta tergulung',Perajin:'Palu perajin',Petani:'Penyiram tanaman',Penyihir:'Tongkat sihir'};
for(const [role,name] of Object.entries(heldNames)){
 const rig=a.createAvatar({name:'QA',role,color:'#8baf9c',bed:'QA'}),tool=rig.root.getObjectByName(name);
 assert.ok([rig.leftHand,rig.rightHand].includes(tool.parent),'Role tools attach to a wrist');
 for(const t of [0,.4,1.2,3.8]){
  a.animateAvatar(rig,t,true);rig.root.updateMatrixWorld(true);
  assert.ok(tool.getWorldPosition(new THREE.Vector3()).distanceTo(tool.parent.getWorldPosition(new THREE.Vector3()))<.17,'Tool grip stays with its hand during walking');
  const seam=rig.cape.geometry.getAttribute('position');for(let i=0;i<9;i++)assert.equal(seam.getZ(i),rig.cape.userData.restPositions[i*3+2],'Cloak top seam stays pinned');
 }
 a.disposeAvatar(rig.root);
}
for(const role of roles.ROLES){
 const rig=a.createAvatar({name:'QA',role,color:'#8baf9c',bed:'QA'});
 for(const side of [-1,1]){const goal=new THREE.Vector3(side*.22,1.07,.40);a.reachHand(rig,side,goal);rig.root.updateMatrixWorld(true);const hand=side===-1?rig.leftHand:rig.rightHand;assert.ok(hand.getWorldPosition(new THREE.Vector3()).distanceTo(goal)<1e-6,'Hand reaches a reachable work target exactly');}
 a.disposeAvatar(rig.root);
}
const rig=a.createAvatar({name:'QA',role:'Perajin',color:'#8baf9c',bed:'QA'}),kit=animation.createActivityKit(rig);
animation.animateActivity(rig,kit,.81,'build',.81);rig.root.updateMatrixWorld(true);
const hammerHead=kit.items.get('build').children[1],bounds=new THREE.Box3().setFromObject(hammerHead);
assert.ok(Math.abs(bounds.min.y-(w.WORK_HEIGHT+.05))<.025,'Hammer makes contact with the workpiece without sinking through the table');
animation.animateActivity(rig,kit,1,'plant',4,true);assert.equal(kit.particles.visible,false,'Reduced motion disables falling water and spell effects');
animation.animateActivity(rig,kit,2,'plant',5,false,false,false);assert.equal(kit.particles.visible,false,'Idle inspection does not water an imaginary station');
a.disposeAvatar(rig.root);
const barterModels={rompi_pengrajin:'Rompi rimba',caping:'Caping bambu',lentera_ranting:'Lentera ranting',lumut_purba:'Permata lumut'};
for(const role of roles.ROLES)for(const item of c.ITEMS.filter(i=>i.barter))for(const gender of ['laki-laki','perempuan']){
 const avatar=a.createAvatar({name:'QA',role,gender,color:'#8baf9c',bed:'QA',hairStyle:'panjang',outfit:{...c.DEFAULT_LOADOUT,[item.slot]:item.id}});
 assert.ok(avatar.root.getObjectByName(barterModels[item.id]),'Preserve the newer barter cosmetic model');
 if(item.id==='caping')assert.equal(avatar.root.userData.hairFit,'brim','Caping uses the same fitted hair envelope as a brimmed hat');
 a.animateAvatar(avatar,.8,true);a.disposeAvatar(avatar.root);
}
console.log('PASS: wrist attachments in walking poses, pinned cloak seam, exact hand reach for six roles, hammer/workpiece contact and reduced-motion effects.');
