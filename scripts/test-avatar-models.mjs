import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {avatar:{createAvatar,animateAvatar,disposeAvatar}}=await loadGameModules();
const equipment={Penjaga:'Perisai penjaga',Peramu:'Ikatan herbal',Penjelajah:'Peta tergulung'};
for(const [role,part] of Object.entries(equipment))for(const color of ['#e99552','#8baf9c','#8f9fc8','#c68cab']){
 const rig=createAvatar({name:'QA',role,color,bed:'QA-bed'});
 assert.equal(rig.root.userData.bed,'QA-bed');assert.equal(rig.root.userData.role,role);
 assert.ok(rig.root.getObjectByName(part),`${role} equipment missing`);
 const cloak=rig.root.getObjectByName('Jubah pilihan anggota');assert.equal('#'+cloak.material.color.getHexString(),color);
 rig.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(rig.root);
 assert.ok(bounds.min.y>=-.02&&bounds.min.y<=.02,'Boots must touch the floor');
 assert.ok(bounds.max.y>1.9&&bounds.max.y<2.5,'Consistent human scale');
 animateAvatar(rig,.4,true);assert.ok(Math.abs(rig.leftLeg.rotation.x)>.1);assert.equal(rig.leftLeg.rotation.x,-rig.rightLeg.rotation.x);
 animateAvatar(rig,1,true,true);assert.equal(rig.leftLeg.rotation.x,0,'Reduced-motion preference');
 rig.root.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite));});disposeAvatar(rig.root);
}
console.log('PASS: 12 role/color combinations, equipment, cloak color, scale, floor contact, walk rig and reduced motion.');
