import * as THREE from 'three';
import {ROLE_OPTIONS} from './role-options';
import {BARRACKS_LAYOUT as B,RUMU_DECK_LAYOUT as D,RUMU_TERRACE_LAYOUT as E,WATCHTOWER_LAYOUT as T} from './guild-building-layout';
import {STAIR_WIDTH,STAIR_STEPS,type RestFrame} from './rest-motion';
const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true});
/** Ground-mounted steps: the foot stays on the ground, the landing follows Rumu. */
export function createDeckStairs(){
 const root=new THREE.Group();root.name='deck-stairs';const box=builder();
 const steps=Array.from({length:STAIR_STEPS},()=>box(root,[STAIR_WIDTH,.10,.28],[0,0,0],'#ad885c'));
 const beams=[-1,1].map(side=>({side,mesh:box(root,[.11,1,.13],[0,0,0],'#654b35'),rail:box(root,[.07,1,.07],[0,0,0],'#9a7851')}));
 const up=new THREE.Vector3(0,1,0);
 return {root,update(frame:RestFrame){
  const a=frame.stairsBase,b=frame.stairsTop,delta=b.clone().sub(a),length=delta.length(),mid=a.clone().add(b).multiplyScalar(.5);
  steps.forEach((step,i)=>{step.position.lerpVectors(a,b,(i+1)/STAIR_STEPS);step.position.y-=.05;});
  for(const {side,mesh,rail} of beams){mesh.position.copy(mid);mesh.position.x+=side*STAIR_WIDTH/2;mesh.scale.y=length;mesh.quaternion.setFromUnitVectors(up,delta.clone().normalize());rail.position.copy(mesh.position);rail.position.y+=.8;rail.scale.y=length;rail.quaternion.copy(mesh.quaternion);}
 }};
}
/** Open the old internal rail where the new front walkway meets the original bedrolls. */
export function openOriginalCampWalkway(rumu:THREE.Group){
 rumu.updateMatrixWorld(true);const inverse=rumu.matrixWorld.clone().invert();
 rumu.traverse(object=>{if(!(object instanceof THREE.Mesh)||!object.parent?.name.replaceAll('_',' ').startsWith('Camp static'))return;
  const geometry=object.geometry,positions=geometry.getAttribute('position'),index=geometry.index,matrix=inverse.clone().multiply(object.matrixWorld),kept:number[]=[];const groups:{start:number;count:number;materialIndex:number}[]=[];
  const original=geometry.groups.length?geometry.groups:[{start:0,count:index?.count??positions.count,materialIndex:0}];
  for(const group of original){const start=kept.length;for(let i=group.start;i<group.start+group.count;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k),points=ids.map(id=>new THREE.Vector3().fromBufferAttribute(positions,id).applyMatrix4(matrix));
    const internalRail=points.every(p=>p.y>3.30&&p.y<3.72&&Math.abs(p.z)>1.01&&Math.abs(p.z)<1.14);if(!internalRail)kept.push(...ids);
   }groups.push({start,count:kept.length-start,materialIndex:group.materialIndex??0});}
  geometry.setIndex(kept);geometry.clearGroups();for(const group of groups)geometry.addGroup(group.start,group.count,group.materialIndex);geometry.computeBoundingBox();
 });
}
function builder(){const mats=new Map<string,THREE.MeshStandardMaterial>();return (parent:THREE.Object3D,size:[number,number,number],pos:[number,number,number],color:string)=>{if(!mats.has(color))mats.set(color,material(color));const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mats.get(color));mesh.position.set(...pos);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};}
export function createRumuDeck(){
 const root=new THREE.Group();root.name='rumu-deck';const box=builder();
 for(const side of [-1,1]){const z=side*D.wingZ,y=D.upperFloorY;
  box(root,[D.length,.14,D.wingDepth],[D.centerX,y-.07,z],'#96704b');
  for(let i=0;i<14;i++)box(root,[.018,.006,D.wingDepth],[D.centerX-D.length/2+(i+.5)*D.length/14,y+.003,z],'#6e5138');
  box(root,[D.length,.10,.24],[D.centerX,D.floorY+.01,side*1.27],'#b29468');
  for(const x of [-2.55,-1.75,-.25,1.25,2.05]){
   box(root,[.12,.13,1.12],[x,y-.18,side*1.78],'#654b35');
   const brace=box(root,[.10,.10,1.12],[x,y-.43,side*1.72],'#75573c');brace.rotation.x=-side*.40;
   if(!(side<0&&x<-2))box(root,[.08,.52,.08],[x,y+.26,side*2.64],'#725239');
  }
  for(const railY of [.25,.51])box(root,[side<0?4.15:D.length,.065,.065],[side<0?.125:D.centerX,y+railY,side*2.64],'#a3845b');
  for(const x of [-2.66,2.16]){box(root,[.08,.52,.08],[x,y+.26,side*1.23],'#725239');for(const h of [.25,.51])box(root,[.065,.065,1.42],[x,y+h,z],'#a3845b');}
  for(let i=0;i<3;i++){
   const n=(side<0?0:3)+i,bed=new THREE.Group();bed.name='deck-bed-'+n;bed.userData.role=ROLE_OPTIONS[n].name;bed.position.set(-1.75+i*1.5,y,side*1.98);root.add(bed);
   box(bed,[1.12,.10,.58],[0,.15,0],'#654b35');for(const x of [-.48,.48])for(const z of [-.22,.22])box(bed,[.07,.15,.07],[x,.075,z],'#654b35');
   box(bed,[1.04,.09,.51],[0,.245,0],'#dfcfab');box(bed,[.69,.035,.52],[.17,.31,0],ROLE_OPTIONS[n].color);box(bed,[.22,.085,.38],[-.37,.33,0],'#f2e6cc');box(bed,[.075,.36,.60],[-.54,.28,0],'#805e40');
  }
 }
 // Rear crosswalk joins both wings without walking through the tent or Aru.
 box(root,[.50,.14,5.28],[-2.45,D.upperFloorY-.07,0],'#96704b');
 for(const z of [-1.11,1.11])box(root,[D.length,.12,.30],[D.centerX,D.floorY-.02,z],'#a3845b');
 const terrace=new THREE.Group();terrace.name='level-3-terrace';terrace.visible=false;root.add(terrace);
 box(terrace,[E.length,.14,E.depth],[E.centerX,D.upperFloorY-.07,0],'#96704b');
 for(let i=0;i<16;i++)box(terrace,[E.length,.008,.018],[E.centerX,D.upperFloorY+.004,-E.depth/2+(i+.5)*E.depth/16],'#6e5138');
 for(const z of [-2.6,0,2.6]){
  const a=new THREE.Vector3(-2.3,2.05,z),b=new THREE.Vector3(-4.35,3.04,z),delta=b.clone().sub(a);
  const brace=box(terrace,[.15,delta.length(),.15],a.clone().add(b).multiplyScalar(.5).toArray() as [number,number,number],'#654b35');brace.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 }
 for(const z of [-2.62,-1.32,0,1.32,2.62])box(terrace,[.09,.62,.09],[-4.60,D.upperFloorY+.31,z],'#725239');
 for(const h of [.29,.59]){
  box(terrace,[.07,.07,5.28],[-4.60,D.upperFloorY+h,0],'#a3845b');
  for(const side of [-1,1])box(terrace,[E.length,.07,.07],[E.centerX,D.upperFloorY+h,side*2.62],'#a3845b');
 }
 for(const [i,z] of E.bedZ.entries()){
  const bed=new THREE.Group();bed.name='deck-bed-'+(6+i);bed.position.set(E.bedX,D.upperFloorY,z);terrace.add(bed);
  box(bed,[1.12,.10,.58],[0,.15,0],'#654b35');for(const x of [-.48,.48])for(const zz of [-.22,.22])box(bed,[.07,.15,.07],[x,.075,zz],'#654b35');
  box(bed,[1.04,.09,.51],[0,.245,0],'#dfcfab');box(bed,[.69,.035,.52],[.17,.31,0],ROLE_OPTIONS[i].color);box(bed,[.22,.085,.38],[-.37,.33,0],'#f2e6cc');box(bed,[.075,.36,.60],[-.54,.28,0],'#805e40');
 }
 return root;
}
export function setRumuDeckLevel(root:THREE.Group,level:number){root.visible=level>=2;const terrace=root.getObjectByName('level-3-terrace');if(terrace)terrace.visible=level>=E.minLevel;}
const GLYPHS:Record<string,string[]>={B:['11110','10001','10001','11110','10001','10001','11110'],A:['01110','10001','10001','11111','10001','10001','10001'],R:['11110','10001','10001','11110','10100','10010','10001'],K:['10001','10010','10100','11000','10100','10010','10001'],G:['01111','10000','10000','10111','10001','10001','01110'],U:['10001','10001','10001','10001','10001','10001','01110'],I:['11111','00100','00100','00100','00100','00100','11111'],L:['10000','10000','10000','10000','10000','10000','11111'],D:['11110','10001','10001','10001','10001','10001','11110']};
Object.assign(GLYPHS,{M:['10001','11011','10101','10101','10001','10001','10001'],E:['11111','10000','10000','11110','10000','10000','11111'],N:['10001','11001','11001','10101','10011','10011','10001'],T:['11111','00100','00100','00100','00100','00100','00100']});
function signText(parent:THREE.Group,text='BARAK GUILD',height=3.08,depth=B.depth/2+.145,pixel=.041){const label=text,pixels:[number,number][]=[];let offset=0;for(const char of label){const glyph=GLYPHS[char];if(!glyph){offset+=3;continue;}glyph.forEach((row,y)=>[...row].forEach((p,x)=>{if(p==='1')pixels.push([offset+x,y]);}));offset+=6;}
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(pixel*.83,pixel*.83,.012),material('#fff1cb'),pixels.length),m=new THREE.Matrix4();pixels.forEach(([x,y],i)=>{m.makeTranslation((x-(offset-2)/2)*pixel,height+(3-y)*pixel,depth);mesh.setMatrixAt(i,m);});mesh.name=text;mesh.userData.labelText=text;parent.add(mesh);}
export function createGuildBarracks(night=false){
 const root=new THREE.Group();root.name='barak';root.position.set(B.x,0,B.z);root.rotation.y=B.yaw;const box=builder();
 box(root,[B.width,.18,B.depth],[0,.09,0],'#9a7a52');
 box(root,[B.width,2.65,.14],[0,1.505,-(B.depth/2-.07)],'#8a6b48');for(const x of [-2.53,2.53])box(root,[.14,2.65,B.depth],[x,1.505,0],'#8a6b48');
 for(const x of [-1.6,1.6])box(root,[2,2.65,.14],[x,1.505,(B.depth/2-.07)],'#8a6b48');box(root,[1.2,.25,.14],[0,2.705,(B.depth/2-.07)],'#8a6b48');
 for(const x of [-2.53,-.64,.64,2.53])box(root,[.17,2.68,.18],[x,1.52,(B.depth/2-.06)],'#654b35');
 for(const z of [-(B.depth/2-.06),(B.depth/2-.06)]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-2.6,B.eaves,z,2.6,B.eaves,z,0,B.ridge,z],3));geo.computeVertexNormals();const mat=material('#8a6b48');mat.side=THREE.DoubleSide;root.add(new THREE.Mesh(geo,mat));}
 const rise=B.ridge-B.eaves,half=B.roofWidth/2,slope=Math.atan2(rise,half);
 for(const side of [-1,1]){const roof=box(root,[Math.hypot(half,rise),.14,B.roofDepth],[side*half/2,(B.ridge+B.eaves)/2,0],'#ad8153');roof.rotation.z=-side*slope;roof.name=side<0?'roof-left':'roof-right';}
 box(root,[.16,.16,B.roofDepth],[0,B.ridge,0],'#654b35');box(root,[2.9,.48,.10],[0,3.08,(B.depth/2+.085)],'#654b35');signText(root);
 for(let i=0;i<4;i++){const bed=new THREE.Group();bed.name='barracks-bed-'+i;bed.position.set(i%2?-1.55:1.55,.18,i<2?-1.2:1.2);root.add(bed);
  box(bed,[.86,.12,2.15],[0,.24,0],'#654b35');for(const x of [-.35,.35])for(const z of [-.96,.96])box(bed,[.09,.24,.09],[x,.12,z],'#654b35');box(bed,[.78,.11,2.07],[0,.355,0],'#d7c59f');box(bed,[.80,.04,1.43],[0,.435,.31],ROLE_OPTIONS[i].color);box(bed,[.60,.10,.24],[0,.46,-.82],'#f2e6cc');}
 box(root,[.065,.4,.065],[0,2.47,.40],'#654b35');const lanternMaterial=new THREE.MeshStandardMaterial({color:'#f5d788',emissive:'#ffb833',emissiveIntensity:night?.9:.08,flatShading:true});const lantern=new THREE.Mesh(new THREE.OctahedronGeometry(.17),lanternMaterial);lantern.position.set(0,2.15,.4);root.add(lantern);
 const light=new THREE.PointLight('#ffb833',night?2.3:0,7,2);light.position.copy(lantern.position);root.add(light);
 return {root,light,lanternMaterial};
}

/** Voting selected the tower; lanterns are included as a complementary upgrade. */
export function createGuildWatchtower(night=false){
 const root=new THREE.Group();root.name='menara-lentera';root.position.set(T.x,0,T.z);root.rotation.y=T.yaw;
 root.userData.votingWinner='MENARA';root.userData.includesLanterns=true;
 const box=builder(),lights:{light:THREE.PointLight;material:THREE.MeshStandardMaterial}[]=[];
 box(root,[4.2,.22,4.2],[0,.11,0],'#8c8a76');
 for(const x of [-1.4,1.4])for(const z of [-1.4,1.4]){
  box(root,[.24,5.9,.24],[x,3.15,z],'#70513a');box(root,[.44,.38,.44],[x,.4,z],'#9a967e');
 }
 // Cross-braces keep the elevated deck visually supported on all four sides.
 for(const side of [-1,1])for(const axis of ['x','z'] as const){
  for(const tilt of [-1,1]){const brace=box(root,[.12,4.0,.12],axis==='x'?[side*1.4,2.0,0]:[0,2.0,side*1.4],'#98744d');if(axis==='x')brace.rotation.x=tilt*.60;else brace.rotation.z=tilt*.60;}
 }
 box(root,[3.6,.18,3.6],[0,T.platformY-.09,0],'#ad885c');
 for(const side of [-1,1])for(const h of [.4,.78]){
  box(root,[3.4,.09,.09],[0,T.platformY+h,side*1.65],'#bd9765');
  box(root,[.09,.09,3.4],[side*1.65,T.platformY+h,0],'#bd9765');
 }
 // Access ladder stops at a real opening in the rear railing.
 const ladder=new THREE.Group();ladder.name='tower-access-ladder';ladder.position.set(0,0,-1.75);root.add(ladder);
 for(const x of [-.43,.43])box(ladder,[.10,T.platformY,.10],[x,T.platformY/2,0],'#70513a');
 for(let i=0;i<14;i++)box(ladder,[.92,.09,.12],[0,.25+i*(T.platformY-.25)/13,0],'#bd9765');
 // Split the rear rails around the ladder so the landing is not sealed shut.
 for(const child of [...root.children])if(child instanceof THREE.Mesh&&child.geometry instanceof THREE.BoxGeometry&&Math.abs(child.position.z+1.65)<.01&&child.position.y>T.platformY){root.remove(child);child.geometry.dispose();}
 for(const x of [-1.08,1.08])for(const h of [.4,.78])box(root,[1.15,.09,.09],[x,T.platformY+h,-1.65],'#bd9765');
 const roof=new THREE.Mesh(new THREE.ConeGeometry(2.7,1.25,4),material('#657c70'));roof.name='tower-roof';roof.position.y=T.roofY;roof.rotation.y=Math.PI/4;roof.castShadow=true;root.add(roof);
 box(root,[2.85,.42,.12],[0,3.60,1.53],'#654b35');signText(root,'MENARA LENTERA',3.60,1.60,.028);
 function lantern(x:number,y:number,z:number,main=false){
  const cage=new THREE.Group();cage.name=main?'tower-main-lantern':'tower-entry-lantern';cage.position.set(x,y,z);root.add(cage);
  const size=main?.42:.22,glow=new THREE.MeshStandardMaterial({color:'#ffe1a0',emissive:'#ffb83f',emissiveIntensity:night?1.8:.15,roughness:.5,flatShading:true});
  const glass=new THREE.Mesh(new THREE.BoxGeometry(size,size*1.3,size),glow);cage.add(glass);
  for(const xx of [-1,1])for(const zz of [-1,1])box(cage,[.035,size*1.6,.035],[xx*size/2,0,zz*size/2],'#725239');
  for(const yy of [-1,1])box(cage,[size*1.25,.07,size*1.25],[0,yy*size*.8,0],'#725239');
  if(main){box(cage,[.05,.62,.05],[0,.62,0],'#725239');const light=new THREE.PointLight('#ffbd58',night?12:0,15,2);light.position.copy(cage.position);root.add(light);lights.push({light,material:glow});}
  else{const light=new THREE.PointLight('#ffc36a',night?3:0,5,2);light.position.copy(cage.position);root.add(light);lights.push({light,material:glow});}
 }
 lantern(0,5.35,0,true);
 for(const x of [-1.9,1.9]){box(root,[.12,2.2,.12],[x,1.1,2.5],'#70513a');box(root,[.35,.12,.35],[x,.06,2.5],'#8c8a76');lantern(x,2.35,2.5);}
 return {root,lights};
}
