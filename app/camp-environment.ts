import * as THREE from 'three';
import {visualCount,STATIONS,stationFrame,WORK_HEIGHT,type ImpactKey,type WorldProgress} from './world-progress';
/** Bounded visual growth; exact lifetime contributions remain in the database. */
export function createCampEnvironment(progress:WorldProgress){
 const root=new THREE.Group();root.name='Dampak gotong royong';
 const materials=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(c:string)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.9}));return materials.get(c)!;};
 const box=(p:THREE.Group,size:[number,number,number],pos:[number,number,number],color:string)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;};
 const part=(key:ImpactKey)=>{const [x,z]=STATIONS[key].position;const g=new THREE.Group();g.name='camp-'+key;g.position.set(x,0,z);g.userData.contributions=progress[key];root.add(g);return g;};
 // Permanent stations give every activity a real, reachable contact surface even on day one.
 for(const key of Object.keys(STATIONS) as ImpactKey[])for(let slot=0;slot<2;slot++){
  const frame=stationFrame(key,slot),station=new THREE.Group();station.name=`work-${key}-${slot}`;station.position.set(...[frame.surface[0],0,frame.surface[1]] as [number,number,number]);station.rotation.y=frame.yaw;root.add(station);
  if(key==='farm'){
   box(station,[.76,.12,.42],[0,.08,0],'#9a7b52');box(station,[.66,.03,.32],[0,.155,0],'#66553e');
   for(const x of [-.22,0,.22]){box(station,[.025,.20,.025],[x,.26,0],'#708f59');const leaf=box(station,[.14,.035,.09],[x,.33,0],'#99b873');leaf.rotation.z=.25;}
  }else if(key==='magic'){
   box(station,[.52,.16,.42],[0,.08,0],'#8e9a98');const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.18,0),mat('#a9c4df'));crystal.position.y=.58;crystal.scale.y=2.1;station.add(crystal);
  }else if(key==='comfort'){
   box(station,[.76,.13,.42],[0,WORK_HEIGHT-.1,0],'#8c7454');for(const x of [-.28,.28])box(station,[.09,WORK_HEIGHT-.16,.32],[x,(WORK_HEIGHT-.16)/2,0],'#8c7454');box(station,[.73,.07,.40],[0,WORK_HEIGHT,0],'#c9b58f');
  }else if(key==='defense'){
   box(station,[.14,.92,.14],[0,.46,0],'#8d7b5d');box(station,[.62,.09,.08],[0,.77,0],'#b29a70');
  }else{
   box(station,[.76,.09,.42],[0,WORK_HEIGHT-.045,0],'#a48258');for(const x of [-.28,.28])for(const z of [-.13,.13])box(station,[.065,WORK_HEIGHT-.09,.065],[x,(WORK_HEIGHT-.09)/2,z],'#8d7251');
   if(key==='craft')box(station,[.30,.05,.23],[.10,WORK_HEIGHT+.025,0],'#c6a77b');
   if(key==='exploration')box(station,[.55,.012,.32],[0,WORK_HEIGHT+.008,0],'#eadfba');
   if(key==='herbs'){box(station,[.30,.04,.23],[0,WORK_HEIGHT+.02,0],'#84966d');for(const x of [-.10,0,.10])box(station,[.03,.10,.03],[x,WORK_HEIGHT+.08,0],'#a4bb85');}
   if(key==='wood'){const log=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.48,7),mat('#b78b5e'));log.rotation.z=Math.PI/2;log.position.set(0,WORK_HEIGHT+.08,0);station.add(log);}
  }
 }
 const wood=part('wood');for(let i=0;i<visualCount(progress.wood);i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.25,7),mat('#93704c'));log.rotation.z=Math.PI/2;log.position.set(0,.23+Math.floor(i/3)*.43,(i%3-1)*.43);log.castShadow=true;wood.add(log);}
 const herbs=part('herbs');if(progress.herbs){box(herbs,[1.5,.13,.7],[0,1.1,0],'#8b7454');for(const x of [-.62,.62])box(herbs,[.10,1.2,.1],[x,.6,0],'#8b7454');for(let i=0;i<visualCount(progress.herbs);i++){const vial=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.28,6),mat(i%2?'#d6bb70':'#88b8a4'));vial.position.set(-.55+i*.22,1.31,0);herbs.add(vial);}}
 const defense=part('defense');for(let i=0;i<visualCount(progress.defense);i++){box(defense,[.14,1.15,.16],[i*.45-1.1,.575,0],'#8d7b5d');if(i<visualCount(progress.defense)-1)box(defense,[.45,.12,.10],[i*.45-.87,.68,0],'#b29a70');}
 const comfort=part('comfort');for(let i=0;i<visualCount(progress.comfort);i++)box(comfort,[.65,.12,1.1],[(i%3)*.85,.08,Math.floor(i/3)*1.4],i%2?'#b4b991':'#c6a982');
 const exploration=part('exploration');for(let i=0;i<visualCount(progress.exploration);i++){const g=new THREE.Group();g.position.set(i*.7-1.7,0,Math.sin(i)*.4);exploration.add(g);box(g,[.07,.75,.07],[0,.38,0],'#87785b');box(g,[.42,.19,.08],[.12,.68,0],'#c9b886');}
 const craft=part('craft');if(progress.craft){box(craft,[1.55,.14,1.4],[0,.9,0],'#a48258');for(const x of [-.6,.6])for(const z of [-.55,.55])box(craft,[.12,.9,.12],[x,.45,z],'#8d7251');for(let i=0;i<visualCount(progress.craft);i++)box(craft,[.35,.3,.35],[(i%3)*.42-.42,1.12+Math.floor(i/3)*.32,0],i%2?'#a6b2b0':'#bb9a64');}
 const farm=part('farm');for(let i=0;i<visualCount(progress.farm);i++){const x=(i%3)*.7,z=Math.floor(i/3)*.7;box(farm,[.6,.10,.6],[x,.02,z],'#907b53');box(farm,[.04,.36,.04],[x,.22,z],'#75965e');for(const side of [-1,1]){const leaf=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),mat('#9cbf78'));leaf.scale.set(1,.35,.5);leaf.rotation.z=side*.5;leaf.position.set(x+side*.12,.32,z);farm.add(leaf);}}
 const magic=part('magic');for(let i=0;i<visualCount(progress.magic);i++){const x=(i%3)*.7,z=Math.floor(i/3)*.7;const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshStandardMaterial({color:'#a9c4df',emissive:'#7a85c7',emissiveIntensity:.7,flatShading:true}));crystal.position.set(x,.6,z);crystal.scale.y=1.8;magic.add(crystal);box(magic,[.45,.16,.45],[x,.1,z],'#8e9a98');}
 return root;
}
