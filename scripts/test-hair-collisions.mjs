import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {avatar:a,cosmetics:c,appearance:l,roles:catalog}=await loadGameModules();
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ignored=new Set(['Alis']);
function edges(mesh){const g=mesh.geometry,p=g.attributes.position,index=g.index,vertices=[];for(let i=0;i<p.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));const result=[];for(let i=0;i<(index?.count??p.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);for(let j=0;j<3;j++)result.push([vertices[ids[j]],vertices[ids[(j+1)%3]]]);}return result;}
const ray=new THREE.Raycaster(),direction=new THREE.Vector3();
function cuts(source,target){const materials=Array.isArray(target.material)?target.material:[target.material],sides=materials.map(m=>m.side);materials.forEach(m=>m.side=THREE.DoubleSide);let collision=false;
 for(const [v,w] of edges(source)){const length=v.distanceTo(w);if(length<.0001)continue;direction.copy(w).sub(v).normalize();ray.set(v,direction);ray.near=.0001;ray.far=length-.0001;if(ray.intersectObject(target,false).length){collision=true;break;}}
 materials.forEach((m,i)=>m.side=sides[i]);return collision;
}
let cases=0;const failures=new Map(),headPairs=new Set();
const insideHead=(o,head)=>{for(let p=o;p;p=p.parent)if(p===head)return true;return false;};
const hats=c.ITEMS.filter(i=>i.slot==='topi');
// Cover every hair/role/hat/accessory pair; cycle shirts through all combinations.
for(const [hi,h] of l.HAIR_STYLES.entries())for(const [ri,role] of catalog.ROLES.entries())for(const [ti,hat] of hats.entries())for(const [ai,acc] of c.ITEMS.filter(i=>i.slot==='aksesori').entries()){
 const shirt=c.ITEMS.filter(i=>i.slot==='baju')[(hi+ri+ti+ai)%6];
 const rig=a.createAvatar({name:'QA',role,color:'#8baf9c',bed:'QA',gender:hi%2?'perempuan':'laki-laki',hairStyle:h.id,outfit:{...c.DEFAULT_LOADOUT,topi:hat.id,aksesori:acc.id,baju:shirt.id}});
 for(const t of [0,1.2,3.8]){
  a.animateAvatar(rig,t,true);rig.root.updateMatrixWorld(true);const hair=[],targets=[];
  rig.root.traverse(o=>{if(!(o instanceof THREE.Mesh)||!visible(o))return;if(o.userData.hairPart)hair.push(o);else if(!ignored.has(o.name)&&o.name!=='Ikat kuncir')targets.push(o);});
  const bounds=new Map([...hair,...targets].map(o=>[o,new THREE.Box3().setFromObject(o)]));
  for(const x of hair)for(const y of targets){if(!bounds.get(x).intersectsBox(bounds.get(y)))continue;
   if(insideHead(y,rig.head)){const key=`${h.id}/${role}/${hat.id}/${acc.id==='kacamata'}/${x.name}/${y.name}/${y.position.x}`;if(headPairs.has(key))continue;headPairs.add(key);}
   if(cuts(x,y)||cuts(y,x)){const key=x.name+' / '+y.name;if(!failures.has(key))failures.set(key,`${h.id}/${role}/${hat.id}/${acc.id}/${shirt.id} t=${t}`);}}
 }
 a.disposeAvatar(rig.root);cases++;
}
console.log({cases,failures:Object.fromEntries(failures)});
assert.equal(failures.size,0,'Hair surfaces must not cross visible clothing, accessories, headwear, capes or backpacks in sampled walking poses');
