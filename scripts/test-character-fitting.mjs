import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {cosmetics:c,avatar:a,appearance:looks,roles:catalog}=await loadGameModules();
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
function headHair(rig){rig.root.updateMatrixWorld(true);const inverse=rig.head.matrixWorld.clone().invert(),vertices=[];rig.head.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.hairPart&&visible(o)){const position=o.geometry.getAttribute('position');for(let i=0;i<position.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse));}});return vertices;}
let cases=0;
for(const gender of ['laki-laki','perempuan'])for(const {id:hairStyle} of looks.HAIR_STYLES)for(const role of catalog.ROLES)for(const hat of c.ITEMS.filter(i=>i.slot==='topi'))for(const accessory of ['polos','kacamata']){
 const outfit={...c.DEFAULT_LOADOUT,topi:hat.id,aksesori:accessory,baju:'zirah'};
 const rig=a.createAvatar({name:'QA',role,color:'#8baf9c',gender,hairStyle,outfit,bed:'QA'});assert.equal(rig.root.userData.gender,gender);const hair=headHair(rig),mode=rig.root.userData.hairFit;
 if(['helmet','hood','brim','beret'].includes(mode))assert.equal(rig.root.getObjectByName('Rambut puncak'),undefined);
 if(mode==='helmet')assert.ok(hair.every(v=>v.y<.11),'Hair must remain below the helmet rim');
 if(mode==='hood')assert.equal(hair.length,0,'Covered hair must remain inside the hood');
 if(mode==='brim'||mode==='beret')assert.ok(hair.every(v=>v.y<.16),'Visible hair must remain below the brim/band');
 if(mode==='crown')for(const v of hair.filter(v=>v.y>=.103&&v.y<=.137))assert.ok(Math.hypot(v.x,v.z+.012)<.283,'Hair must stay inside crown ring');
 if(accessory==='kacamata')for(const o of rig.head.children.filter(o=>o.name.startsWith('Poni')&&visible(o))){o.geometry.computeBoundingBox();const box=o.geometry.boundingBox.clone().applyMatrix4(o.matrix);assert.ok(box.min.y>.113,'Fringe must stay above glasses');}
 assert.equal(rig.root.userData.hairStyle,hairStyle);if(looks.isLongHair(hairStyle)&&hairStyle!=='sebahu'&&mode!=='hood')assert.ok(Math.min(...hair.map(v=>v.y))<-.70,'Long hair must visibly extend below shoulders');if(hairStyle==='gundul')assert.equal(hair.length,0);
 for(let t=0;t<=2;t+=.2){a.animateAvatar(rig,t,true);rig.root.updateMatrixWorld(true);if(role==='Penjaga'){const shield=new THREE.Box3().setFromObject(rig.root.getObjectByName('Perisai penjaga')),chest=new THREE.Box3().setFromObject(rig.root.getObjectByName('Zirah kosmetik'));assert.ok(shield.max.x<chest.min.x-.01,'Shield must clear chest armor while walking');const sword=new THREE.Box3().setFromObject(rig.root.getObjectByName('Sarung pedang')),arm=new THREE.Box3().setFromObject(rig.rightArm);assert.ok(sword.max.z<arm.min.z-.04,'Sword must clear the walking hand');}}
 a.disposeAvatar(rig.root);cases++;
}
console.log(`PASS: ${cases} gender/role/headwear/glasses combinations, fitted hair clearance, hood opening, crown clearance and walking shield/sword clearance.`);
