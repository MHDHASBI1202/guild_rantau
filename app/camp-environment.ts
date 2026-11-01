import * as THREE from 'three';
import {visualCount,STATIONS,type ImpactKey,type WorldProgress} from './world-progress';

export type CampAnim={flames:THREE.Mesh[];smokePool:THREE.Mesh[];emberLight:THREE.PointLight;pond:THREE.Mesh};

/** Bounded visual growth; exact lifetime contributions remain in the database. */
export function createCampEnvironment(progress:WorldProgress):{root:THREE.Group;anim:CampAnim}{
 const root=new THREE.Group();root.name='Dampak gotong royong';
 const materials=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(c:string)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.9}));return materials.get(c)!;};
 const box=(p:THREE.Group,size:[number,number,number],pos:[number,number,number],color:string)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;};
 const part=(key:ImpactKey)=>{const [x,z]=STATIONS[key].position;const g=new THREE.Group();g.name='camp-'+key;g.position.set(x,0,z);g.userData.contributions=progress[key];root.add(g);return g;};
 const wood=part('wood');for(let i=0;i<visualCount(progress.wood);i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.25,7),mat('#93704c'));log.rotation.z=Math.PI/2;log.position.set(0,.23+Math.floor(i/3)*.43,(i%3-1)*.43);log.castShadow=true;wood.add(log);}
 const herbs=part('herbs');if(progress.herbs){box(herbs,[1.5,.13,.7],[0,1.1,0],'#8b7454');for(const x of [-.62,.62])box(herbs,[.10,1.2,.1],[x,.6,0],'#8b7454');for(let i=0;i<visualCount(progress.herbs);i++){const vial=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.28,6),mat(i%2?'#d6bb70':'#88b8a4'));vial.position.set(-.55+i*.22,1.31,0);herbs.add(vial);}}
 const defense=part('defense');for(let i=0;i<visualCount(progress.defense);i++){box(defense,[.14,1.15,.16],[i*.45-1.1,.575,0],'#8d7b5d');if(i<visualCount(progress.defense)-1)box(defense,[.45,.12,.10],[i*.45-.87,.68,0],'#b29a70');}
 const comfort=part('comfort');for(let i=0;i<visualCount(progress.comfort);i++)box(comfort,[.65,.12,1.1],[(i%3)*.85,.08,Math.floor(i/3)*1.4],i%2?'#b4b991':'#c6a982');
 const exploration=part('exploration');for(let i=0;i<visualCount(progress.exploration);i++){const g=new THREE.Group();g.position.set(i*.7-1.7,0,Math.sin(i)*.4);exploration.add(g);box(g,[.07,.75,.07],[0,.38,0],'#87785b');box(g,[.42,.19,.08],[.12,.68,0],'#c9b886');}
 const craft=part('craft');if(progress.craft){box(craft,[1.55,.14,1.4],[0,.9,0],'#a48258');for(const x of [-.6,.6])for(const z of [-.55,.55])box(craft,[.12,.9,.12],[x,.45,z],'#8d7251');for(let i=0;i<visualCount(progress.craft);i++)box(craft,[.35,.3,.35],[(i%3)*.42-.42,1.12+Math.floor(i/3)*.32,0],i%2?'#a6b2b0':'#bb9a64');}
 const farm=part('farm');for(let i=0;i<visualCount(progress.farm);i++){const x=(i%3)*.7,z=Math.floor(i/3)*.7;box(farm,[.6,.10,.6],[x,.02,z],'#907b53');box(farm,[.04,.36,.04],[x,.22,z],'#75965e');for(const side of [-1,1]){const leaf=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),mat('#9cbf78'));leaf.scale.set(1,.35,.5);leaf.rotation.z=side*.5;leaf.position.set(x+side*.12,.32,z);farm.add(leaf);}}
 const magic=part('magic');for(let i=0;i<visualCount(progress.magic);i++){const x=(i%3)*.7,z=Math.floor(i/3)*.7;const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshStandardMaterial({color:'#a9c4df',emissive:'#7a85c7',emissiveIntensity:.7,flatShading:true}));crystal.position.set(x,.6,z);crystal.scale.y=1.8;magic.add(crystal);box(magic,[.45,.16,.45],[x,.1,z],'#8e9a98');}

 // === Api unggun / Campfire — pusat kehangatan kamp ===
 const fire=new THREE.Group();fire.name='api-unggun';fire.position.set(-1.2,0,4.2);root.add(fire);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const s=new THREE.Mesh(new THREE.DodecahedronGeometry(.18,0),mat('#8a7f75'));s.position.set(Math.cos(a)*.56,.10,Math.sin(a)*.56);s.castShadow=true;fire.add(s);}
 for(let i=0;i<3;i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.92,7),mat('#6b5040'));log.rotation.z=Math.PI/2;log.rotation.y=(i/3)*Math.PI;log.position.y=.09;log.castShadow=true;fire.add(log);}
 const flames:THREE.Mesh[]=['#ff9933','#ff5511','#ffcc00','#ff4422','#ffaa22'].map((col,i)=>{
  const fl=new THREE.Mesh(new THREE.ConeGeometry(.08+i*.022,.20+i*.10,5),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.90}));
  fl.position.set(Math.cos(i/5*Math.PI*2)*.07,.18+i*.03,Math.sin(i/5*Math.PI*2)*.07);
  fl.userData.phaseOffset=i*1.27;fire.add(fl);return fl;
 });
 const emberLight=new THREE.PointLight('#ff7722',2.8,11,1.5);emberLight.position.set(-1.2,1.2,4.2);root.add(emberLight);

 // Bangku kayu di dekat api unggun
 for(const angle of [-.8,.8,2.4]){
  const bench=new THREE.Mesh(new THREE.BoxGeometry(.4, .2, 1.3), mat('#7c634a'));
  bench.position.set(-1.2+Math.cos(angle)*1.7, .1, 4.2+Math.sin(angle)*1.7);
  bench.rotation.y=-angle+Math.PI/2;
  bench.castShadow=true;root.add(bench);
 }

 // === Kolam / Pond yang lebih luas dan asri ===
 const pondMat=new THREE.MeshStandardMaterial({color:'#6a98aa',roughness:.15,metalness:.25,transparent:true,opacity:.82});
 const pond=new THREE.Mesh(new THREE.CircleGeometry(2.6,12),pondMat);
 pond.name='kolam';pond.rotation.x=-Math.PI/2;pond.position.set(-5.5,.01,-5.5);pond.receiveShadow=true;root.add(pond);
 for(let i=0;i<5;i++){
  const a=(i/5)*Math.PI*2;const lily=new THREE.Mesh(new THREE.CircleGeometry(.3,8),mat(i%2?'#7a9e5a':'#658a47'));
  lily.rotation.x=-Math.PI/2;lily.position.set(-5.5+Math.cos(a)*1.4,.018,-5.5+Math.sin(a)*1.4);root.add(lily);
 }
 // Batu-batu tepi kolam
 for(let i=0;i<8;i++){
  const a=(i/8)*Math.PI*2;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.22+Math.sin(i)*.08,0),mat('#7d8c7c'));
  rock.position.set(-5.5+Math.cos(a)*2.55,.08,-5.5+Math.sin(a)*2.55);rock.castShadow=true;root.add(rock);
 }

 // === Asap dari api unggun ===
 const smokePool:THREE.Mesh[]=Array.from({length:8},(_,i)=>{
  const s=new THREE.Mesh(new THREE.SphereGeometry(.15+i*.03,5,4),new THREE.MeshBasicMaterial({color:'#c0b8a8',transparent:true,opacity:0}));
  s.userData.phaseOffset=i/8;root.add(s);return s;
 });

 return {root,anim:{flames,smokePool,emberLight,pond}};
}
