import * as THREE from 'three';
import {createHair} from './hair-model';
import {DEFAULT_HAIR,DEFAULT_SKIN,isLongHair,type HairStyle,type SkinTone} from './appearance-options';
import type {Gender} from './character-options';
import {DEFAULT_LOADOUT,findItem,type Loadout} from './cosmetics';
export type AvatarSpec={name:string;role:string;color:string;bed:string;outfit?:Loadout;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone};
export type AvatarRig={root:THREE.Group;head:THREE.Group;leftLeg:THREE.Group;rightLeg:THREE.Group;leftArm:THREE.Group;rightArm:THREE.Group;leftForearm:THREE.Group;rightForearm:THREE.Group;leftHand:THREE.Group;rightHand:THREE.Group;cape:THREE.Mesh;role:string};
export const UPPER_ARM=.29,LOWER_ARM=.28;
/** Two bone reach in avatar space. The wrist stays aligned with its held object. */
export function reachHand(rig:AvatarRig,side:-1|1,target:THREE.Vector3,blend=1){
 const arm=side===-1?rig.leftArm:rig.rightArm,forearm=side===-1?rig.leftForearm:rig.rightForearm,hand=side===-1?rig.leftHand:rig.rightHand;
 const delta=target.clone().sub(arm.position),distance=THREE.MathUtils.clamp(delta.length(),.04,UPPER_ARM+LOWER_ARM-.002),direction=delta.normalize();
 const pole=new THREE.Vector3(side*.5,-1,-.18);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const along=(UPPER_ARM**2-LOWER_ARM**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,UPPER_ARM**2-along**2));
 const elbow=direction.clone().multiplyScalar(along).addScaledVector(pole,height),down=new THREE.Vector3(0,-1,0);
 const upperRotation=new THREE.Quaternion().setFromUnitVectors(down,elbow.clone().normalize());
 const lowerRotation=new THREE.Quaternion().setFromUnitVectors(down,direction.multiplyScalar(distance).sub(elbow).normalize());
 arm.quaternion.slerp(upperRotation,blend);forearm.quaternion.slerp(upperRotation.clone().invert().multiply(lowerRotation),blend);
 hand.quaternion.copy(arm.quaternion).multiply(forearm.quaternion).invert();
}
export function createAvatar(spec:AvatarSpec):AvatarRig{
 const outfit={...DEFAULT_LOADOUT,...spec.outfit};const gender=spec.gender??'laki-laki';
 const longHair=isLongHair(spec.hairStyle??DEFAULT_HAIR)&&!(outfit.topi==='peran'&&spec.role==='Peramu');
 const root=new THREE.Group();root.name='Anggota '+spec.name;root.userData.bed=spec.bed;root.userData.role=spec.role;root.userData.gender=gender;
 const materials=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,flatShading:true,roughness:.86}));return materials.get(color)!;};
 const mesh=(geo:THREE.BufferGeometry,color:string,parent:THREE.Object3D,x=0,y=0,z=0,name='')=>{const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;};
 const box=(p:THREE.Object3D,c:string,size:number[],pos:number[],name='')=>{
  let geometry:THREE.BufferGeometry=new THREE.BoxGeometry(...size as [number,number,number]);
  if(['Lengan tunik','Lengan bawah','Celana','Betis','Sepatu bot','Sol sepatu','Manset'].includes(name)){
   const [w,h,d]=size,r=Math.min(.025,w*.15,h*.15),x=-w/2,y=-h/2,shape=new THREE.Shape();
   shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
   geometry.dispose();geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:2});geometry.translate(0,0,-d/2);
  }
  return mesh(geometry,c,p,...pos as [number,number,number],name);
 };
 const ball=(p:THREE.Object3D,c:string,r:number,pos:number[],scale=[1,1,1],name='')=>{const m=mesh(new THREE.SphereGeometry(r,8,6),c,p,...pos as [number,number,number],name);m.scale.set(...scale as [number,number,number]);return m;};
 const group=(p:THREE.Object3D,x:number,y:number,z:number,name:string)=>{const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;};
 const skin=spec.skinTone??DEFAULT_SKIN,hair='#49372e',leather='#785640',dark='#414d4b',cream='#e9e2cb',metal='#a9b5b4',gold='#c9a568';
 mesh(new THREE.CylinderGeometry(.26,.31,.56,7),cream,root,0,1.1,0,'Tunik linen');
 mesh(new THREE.CylinderGeometry(.315,.325,.095,10),leather,root,0,.86,0,'Sabuk kulit');box(root,gold,[.10,.085,.025],[0,.86,.333],'Gesper');
 mesh(new THREE.CylinderGeometry(.085,.10,.17,7),skin,root,0,1.48,0,'Leher');
 const head=group(root,0,1.75,0,'Kepala');ball(head,skin,.30,[0,0,0],[.92,1,.85],'Wajah');
 for(const side of [-1,1]){const ear=ball(head,skin,.075,[side*.265,-.025,0],[.65,1,.7],'Telinga');ear.visible=!['bob','panjang','sebahu','gelombang'].includes(spec.hairStyle??DEFAULT_HAIR);ball(head,'#f8f3df',.050,[side*.11,.015,.236],[.85,1,.30],'Mata putih');ball(head,'#343d36',.027,[side*.11,.015,.250],[.8,1,.3],'Pupil');ball(head,'#ffffff',.010,[side*.10,.028,.259],[1,1,.3],'Kilau mata');const brow=box(head,hair,[.112,gender==='perempuan'?.018:.026,.027],[side*.11,.105,.225],'Alis');brow.rotation.z=side*-.10;}
 ball(head,skin,.054,[0,-.045,.26],[.7,.8,.8],'Hidung');const smile=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.075,-.123,.224),new THREE.Vector3(0,-.14,.24),new THREE.Vector3(.075,-.123,.224)]),new THREE.LineBasicMaterial({color:'#9a6c54'}));head.add(smile);
 const hairRig=createHair({style:spec.hairStyle??DEFAULT_HAIR,role:spec.role,hat:outfit.topi,color:hair,glasses:outfit.aksesori==='kacamata'});head.add(hairRig);root.userData.hairFit=hairRig.userData.hairFit;root.userData.hairStyle=spec.hairStyle??DEFAULT_HAIR;root.userData.skinTone=skin;
 const leg=(side:number)=>{const p=group(root,side*.14,.79,0,'Kaki '+side);box(p,dark,[.19,.34,.22],[0,-.16,0],'Celana');box(p,dark,[.17,.22,.19],[0,-.42,0],'Betis');box(p,leather,[.23,.23,.32],[0,-.665,.045],'Sepatu bot');box(p,'#483d32',[.24,.06,.34],[0,-.76,.05],'Sol sepatu');box(p,gold,[.03,.045,.018],[side*.08,-.61,.21],'Gesper sepatu');return p;};
 const leftLeg=leg(-1),rightLeg=leg(1);
 const arm=(side:number)=>{const p=group(root,side*.30,1.31,0,'Lengan '+side);ball(p,cream,.14,[0,-.04,0],[.9,1.1,1],'Bahu');box(p,cream,[.17,.25,.20],[0,-.16,0],'Lengan tunik');const elbow=group(p,0,-UPPER_ARM,0,'Siku '+side);ball(elbow,skin,.075,[0,0,0],[1,1,1],'Sambungan siku');box(elbow,skin,[.14,.20,.16],[0,-.11,0],'Lengan bawah');box(elbow,leather,[.16,.07,.18],[0,-.21,0],'Manset');const hand=group(elbow,0,-LOWER_ARM,0,'Genggaman '+side);ball(hand,skin,.09,[0,0,0],[.85,1,.85],'Tangan');ball(hand,skin,.037,[-side*.065,.01,.035],[.8,1.2,1],'Ibu jari');return {arm:p,elbow,hand};};
 const left=arm(-1),right=arm(1),leftArm=left.arm,rightArm=right.arm,leftForearm=left.elbow,rightForearm=right.elbow,leftHand=left.hand,rightHand=right.hand;
 // The top seam stays pinned to the shoulders; only the lower cloth can sway.
 const capePoints:number[]=[],capeIndices:number[]=[];
 for(let row=0;row<=6;row++)for(let column=0;column<=8;column++){const v=row/6,u=column/8*2-1;capePoints.push(u*(.24+v*.10),-v*.68,-.045-v*.065+u*u*.055);if(row<6&&column<8){const i=row*9+column;capeIndices.push(i,i+9,i+1,i+1,i+9,i+10);}}
 const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute(capePoints,3));capeGeo.setIndex(capeIndices);capeGeo.computeVertexNormals();const cape=mesh(capeGeo,spec.color,root,0,1.37,-.225,'Jubah pilihan anggota');cape.userData.restPositions=new Float32Array(capePoints);const capeMat=mat(spec.color).clone();capeMat.side=THREE.DoubleSide;cape.material=capeMat;
 // Colored shoulders and front clasp keep the selected color readable from every side.
 for(const side of [-1,1])ball(side===-1?leftArm:rightArm,spec.color,.15,[0,-.015,-.015],[1,.46,1.15],'Mantel bahu');ball(root,gold,.035,[0,1.35,.255],[1,1,.4],'Pengait jubah');
 for(const side of [-1,1]){const seam=new THREE.QuadraticBezierCurve3(new THREE.Vector3(side*.24,1.37,-.22),new THREE.Vector3(side*.24,1.43,.12),new THREE.Vector3(0,1.35,.25));mesh(new THREE.TubeGeometry(seam,10,.018,4,false),spec.color,root,0,0,0,'Tepi mantel');}
 if(spec.role==='Penjaga'){
  mesh(new THREE.SphereGeometry(.34,12,6,0,Math.PI*2,0,1.2),metal,head,0,0,-.015,'Helm penjaga');mesh(new THREE.TorusGeometry(.317,.014,4,12),metal,head,0,.123,-.015,'Tepi helm').rotation.x=Math.PI/2;box(head,'#788d8d',[.045,.025,.32],[0,.336,-.015],'Bubungan helm');
  for(const side of [-1,1])box(head,metal,[.075,.22,.13],[side*.295,-.005,-.045],'Pelindung pipi');
  box(root,'#94a5a2',[.42,.29,.055],[0,1.20,.283],'Pelindung dada');
  const shield=group(leftArm,-.19,-.35,.18,'Perisai penjaga');const shape=new THREE.Shape();shape.moveTo(-.24,.29);shape.lineTo(.24,.29);shape.lineTo(.23,-.10);shape.lineTo(0,-.33);shape.lineTo(-.23,-.10);shape.closePath();const outer=mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false}),metal,shield,0,0,0,'Bingkai perisai');outer.rotation.y=-.12;const wood=mesh(new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:false}),spec.color,shield,0,0,.015);wood.scale.set(.82,.82,1);ball(shield,gold,.07,[0,.015,.10],[1,1,.35],'Pusat perisai');box(shield,leather,[.14,.10,.04],[.15,-.20,-.13],'Pegangan perisai');
  const scabbard=box(root,leather,[.09,.48,.11],[.36,.64,-.30],'Sarung pedang');scabbard.rotation.z=-.18;const beltHook=new THREE.Vector3(.32,.90,-.05),sheathHook=new THREE.Vector3(.40,.89,-.30);const swordStrap=mesh(new THREE.CylinderGeometry(.025,.025,beltHook.distanceTo(sheathHook),5),leather,root,...beltHook.clone().add(sheathHook).multiplyScalar(.5).toArray() as [number,number,number],'Ikat sarung pedang');swordStrap.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sheathHook.clone().sub(beltHook).normalize());box(root,leather,[.06,.14,.06],[.40,.98,-.30],'Pegangan pedang');box(root,gold,[.18,.035,.09],[.40,.90,-.30],'Gagang pedang tersarung');
 }else if(spec.role==='Peramu'){
  const hood=ball(head,'#768b65',.338,[0,.08,-.12],[1.05,1.04,.78],'Tudung peramu');
  // Opening stays clear of the face, with a soft gathered collar.
  mesh(new THREE.TorusGeometry(.20,.055,4,9,Math.PI), '#a8b891',root,0,1.42,.10,'Kerah peramu').rotation.x=Math.PI/2;
  const bag=box(root,leather,[.38,.43,.19],[0,1.10,-.50],'Tas herbal');box(root,'#a8b58a',[.40,.12,.21],[0,1.30,-.50],'Tutup tas herbal');
  for(const side of [-1,1]){const strap=box(root,leather,[.045,.45,.04],[side*.18,1.17,.30],'Tali tas');strap.rotation.z=side*.12;const bottle=mesh(new THREE.CylinderGeometry(.055,.065,.16,6),side===-1?'#85b3a1':'#d1b16a',root,side*.145,.77,.35,'Botol ramuan');box(root,leather,[.07,.045,.07],[side*.145,.87,.35],'Sumbat botol');}
  const herbs=group(rightArm,.02,-.52,.12,'Ikatan herbal');for(let i=0;i<4;i++){const stem=mesh(new THREE.CylinderGeometry(.012,.012,.29,4),'#5f8050',herbs,(i-1.5)*.04,.11,0);stem.rotation.z=(i-1.5)*-.18;const leaf=ball(herbs,i%2?'#a4b776':'#738f5f',.075,[(i-1.5)*.055,.23,0],[.55,1.4,.3],'Daun obat');leaf.rotation.z=(i-1.5)*-.2;}
 }else if(spec.role==='Penjelajah'){
  mesh(new THREE.CylinderGeometry(.38,.40,.045,10),'#6f8160',head,0,.19,-.015,'Pinggir topi');mesh(new THREE.CylinderGeometry(.255,.305,.23,10),'#6f8160',head,0,.34,-.015,'Topi penjelajah');box(head,leather,[.48,.04,.025],[0,.255,.285],'Pita topi');const feather=ball(head,'#d8bd83',.11,[.255,.43,-.015],[.35,1.5,.18],'Bulu topi');feather.rotation.z=-.4;
  box(root,leather,[.39,.44,.20],[0,1.10,-.50],'Ransel perjalanan');const roll=mesh(new THREE.CylinderGeometry(.11,.11,.47,7),'#a7b2a1',root,0,1.39,-.51,'Gulungan alas tidur');roll.rotation.z=Math.PI/2;
  const sash=box(root,leather,[.065,.58,.035],[0,1.12,.31],'Tali selempang');sash.rotation.z=.42;box(root,leather,[.21,.22,.10],[.13,.84,.37],'Tas peta');box(root,gold,[.04,.04,.03],[.13,.87,.43],'Kancing tas');
  const scroll=mesh(new THREE.CylinderGeometry(.05,.05,.28,7),cream,leftArm,-.02,-.53,.13,'Peta tergulung');scroll.rotation.z=.4;mesh(new THREE.CylinderGeometry(.018,.018,.34,5),leather,leftArm,-.02,-.53,.13,'Batang peta').rotation.z=.4;
  mesh(new THREE.CylinderGeometry(.065,.065,.018,8),gold,root,0,1.31,.34,'Kompas').rotation.x=Math.PI/2;
 }else if(spec.role==='Perajin'){
  mesh(new THREE.CylinderGeometry(.38,.38,.045,10),'#89765b',head,0,.19,-.015,'Pinggir topi kerja');mesh(new THREE.CylinderGeometry(.26,.30,.20,10),'#a18a65',head,0,.31,-.015,'Topi kerja');
  box(root,leather,[.36,.43,.04],[0,1.06,.292],'Celemek perajin');box(root,gold,[.07,.08,.03],[0,1.18,.32],'Kancing celemek');
  const hammer=group(rightArm,.10,-.50,.26,'Palu perajin');box(hammer,leather,[.045,.35,.045],[0,.05,0],'Gagang palu');box(hammer,metal,[.25,.12,.12],[0,.23,0],'Kepala palu');
  for(const side of [-1,1])box(root,leather,[.12,.16,.1],[side*.23,.82,.23],'Kantong perkakas');
 }else if(spec.role==='Petani'){
  mesh(new THREE.CylinderGeometry(.43,.44,.045,10),'#cdb477',head,0,.19,-.015,'Pinggir topi ladang');mesh(new THREE.CylinderGeometry(.25,.30,.22,10),'#d6bd81',head,0,.32,-.015,'Topi ladang');
  const can=group(rightArm,.18,-.52,.16,'Penyiram tanaman');mesh(new THREE.CylinderGeometry(.11,.13,.21,8),'#8da99b',can,0,0,0,'Badan penyiram');const spout=box(can,metal,[.07,.07,.20],[0,.04,.15],'Corong penyiram');spout.rotation.x=-.35;
  box(root,'#b59a66',[.19,.21,.11],[.22,.84,.28],'Kantong benih');box(root,'#a1b67c',[.09,.09,.025],[.22,.86,.35],'Tanda tunas');
 }else if(spec.role==='Penyihir'){
  mesh(new THREE.CylinderGeometry(.39,.40,.045,10),'#817497',head,0,.19,-.015,'Pinggir topi sihir');mesh(new THREE.ConeGeometry(.30,.60,9),'#8f81a7',head,0,.51,-.015,'Topi sihir');
  const staff=group(rightArm,.13,-.18,.16,'Tongkat sihir');mesh(new THREE.CylinderGeometry(.022,.03,1.60,7),leather,staff,0,.15,0,'Batang tongkat');const gem=mesh(new THREE.OctahedronGeometry(.12,0),'#a7d7dc',staff,0,1.08,0,'Kristal tongkat');gem.scale.y=1.4;
  box(root,'#8f81a7',[.20,.25,.09],[-.24,.82,.25],'Buku mantra');box(root,gold,[.025,.21,.02],[-.29,.82,.31],'Jilid buku mantra');
 }
 if(spec.role==='Peramu'||spec.role==='Penjelajah')for(const side of [-1,1]){
  const front=(outfit.baju==='zirah'||outfit.baju==='surya')?.325:.28,back=longHair?-.525:-.405;
  const strapCurve=new THREE.CubicBezierCurve3(new THREE.Vector3(side*.17,1.17,front),new THREE.Vector3(side*.42,1.67,.13),new THREE.Vector3(side*.42,1.43,back),new THREE.Vector3(side*.17,1.27,back));
  mesh(new THREE.TubeGeometry(strapCurve,18,.023,5,false),leather,root,0,0,0,'Tali bahu ransel');
 }

 const shirt=findItem('baju',outfit.baju),pants=findItem('celana',outfit.celana),gear=findItem('perlengkapan',outfit.perlengkapan);
 const gearNames=new Set(['Helm penjaga','Tepi helm','Bubungan helm','Pelindung pipi','Pelindung dada','Bingkai perisai','Pusat perisai','Pengait jubah','Gagang pedang tersarung','Tas herbal','Tutup tas herbal','Tali tas','Ransel perjalanan','Tas peta','Kancing tas','Kompas','Pita topi']);
 root.traverse(o=>{if(o instanceof THREE.Mesh){if(gear&&outfit.perlengkapan!=='standar'&&gearNames.has(o.name))o.material=mat(gear.color);if(shirt&&['Tunik linen','Bahu','Lengan tunik'].includes(o.name))o.material=mat(shirt.color);if(pants&&['Celana','Betis'].includes(o.name))o.material=mat(pants.color);}});
 if(outfit.baju==='surya'){capeMat.color.set(shirt!.color);root.traverse(o=>{if(o instanceof THREE.Mesh&&o.name==='Mantel bahu')o.material=mat(shirt!.color);});}
 if(outfit.baju==='senja')mesh(new THREE.CylinderGeometry(.16,.19,.17,8),'#955342',root,0,1.42,0,'Kerah mantel senja');
 if(outfit.baju==='rompi_pengrajin'){box(root,'#5a6b4e',[.44,.32,.06],[0,1.18,.285],'Rompi rimba');box(root,'#7a5a3a',[.08,.06,.03],[.12,1.24,.325],'Kantong bekal rompi');box(root,'#7a5a3a',[.08,.06,.03],[-.12,1.24,.325],'Kantong bekal rompi kiri');}
 if(outfit.baju==='zirah'||outfit.baju==='surya'){const c=shirt!.color;box(root,c,[.45,.34,.055],[0,1.19,.285],'Zirah kosmetik');for(const side of [-1,1])ball(side===-1?leftArm:rightArm,c,.17,[side*.025,.04,0],[1.12,.55,1.25],'Pelindung bahu kosmetik');root.traverse(o=>{if(o.name==='Mantel bahu'||o.name==='Pelindung dada')o.visible=false;});box(root,outfit.baju==='surya'?'#fff1b2':'#e3ebed',[.09,.13,.025],[0,1.22,.325],'Lambang dada');}
 if(['rimba','bahari'].includes(outfit.celana))for(const [side,part] of [[-1,leftLeg],[1,rightLeg]] as const)box(part,pants!.color,[.07,.13,.19],[side*.12,-.17,0],'Kantong celana');
 if(['ksatria','astral'].includes(outfit.celana))for(const part of [leftLeg,rightLeg]){ball(part,outfit.celana==='astral'?'#d7b46b':'#bfced4',.115,[0,-.34,.105],[.9,1.15,.35],'Pelindung lutut');if(outfit.celana==='astral')box(part,'#d7b46b',[.16,.15,.04],[0,-.53,.13],'Pelindung tulang kering');}
 if(outfit.topi!=='peran'){
  const names=new Set(['Helm penjaga','Tepi helm','Bubungan helm','Pelindung pipi','Tudung peramu','Pinggir topi','Topi penjelajah','Pita topi','Bulu topi','Pinggir topi kerja','Topi kerja','Pinggir topi ladang','Topi ladang','Pinggir topi sihir','Topi sihir']);head.traverse(o=>{if(names.has(o.name))o.visible=false;});
  if(outfit.topi==='baret'){const beret=mesh(new THREE.SphereGeometry(.345,12,6,0,Math.PI*2,0,Math.PI/2),'#9a6380',head,.025,.225,-.015,'Baret kosmetik');beret.scale.set(1.05,.52,1);mesh(new THREE.CylinderGeometry(.29,.29,.045,10,1,true),'#85516d',head,0,.205,-.015,'Pita baret');ball(head,gold,.035,[.24,.25,.235],[1,1,.4],'Pin baret');}
  if(outfit.topi==='jerami'){mesh(new THREE.CylinderGeometry(.42,.43,.045,10),'#d1b97d',head,0,.19,-.015,'Tepi jerami');mesh(new THREE.CylinderGeometry(.255,.305,.23,10),'#c4aa6c',head,0,.34,-.015,'Topi jerami');mesh(new THREE.CylinderGeometry(.30,.305,.04,10,1,true),leather,head,0,.255,-.015,'Pita jerami');}
  if(outfit.topi==='caping'){mesh(new THREE.ConeGeometry(.45,.19,10),'#c8b17a',head,0,.26,-.015,'Caping bambu');mesh(new THREE.TorusGeometry(.42,.015,4,12),'#6e8055',head,0,.175,-.015,'Pinggir daun caping').rotation.x=Math.PI/2;ball(head,'#e0caa0',.04,[0,.36,-.015],[1,1,1],'Puncak caping');}
  if(outfit.topi==='kristal'||outfit.topi==='mahkota'){const c=outfit.topi==='kristal'?'#7bc7cc':gold;mesh(new THREE.TorusGeometry(.30,.017,4,12),c,head,0,.12,-.012,'Lingkar mahkota').rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const crystal=mesh(new THREE.OctahedronGeometry(i===0?.12:.09,0),outfit.topi==='kristal'?'#9be2df':'#e6b254',head,Math.sin(a)*.30,.30,Math.cos(a)*.30-.012,'Permata mahkota');crystal.scale.set(.5,1.35,.5);}}
 }
 if(outfit.aksesori==='syal'){mesh(new THREE.CylinderGeometry(.145,.17,.12,8),'#e2d7b8',root,0,1.45,.015,'Syal krem');const tail=box(root,'#e2d7b8',[.11,.28,.05],[.10,1.25,.305],'Ujung syal');tail.rotation.z=-.13;}
 if(outfit.aksesori==='kacamata'){for(const side of [-1,1])mesh(new THREE.TorusGeometry(.077,.013,4,12),gold,head,side*.11,.015,.278,'Kacamata bundar');box(head,gold,[.07,.018,.02],[0,.02,.28],'Jembatan kacamata');}
 if(outfit.aksesori==='daun')for(const side of [-1,1]){const leaf=ball(head,'#8ca874',.075,[side*.32,-.13,.085],[.45,1.35,.25],'Anting daun');leaf.rotation.z=side*.25;}
 if(outfit.aksesori==='lentera_ranting'){const lantern=group(root,.23,.82,.32,'Lentera ranting');box(lantern,leather,[.04,.12,.04],[0,.08,0],'Pengikat lentera ke sabuk');box(lantern,'#ffd778',[.10,.14,.10],[0,-.04,.035],'Badan lentera');box(lantern,'#4d3928',[.12,.025,.12],[0,.035,.035],'Tutup lentera');box(lantern,'#4d3928',[.12,.025,.12],[0,-.12,.035],'Alas lentera');}
 if(outfit.aksesori==='bulan'){mesh(new THREE.TorusGeometry(.065,.018,4,14,Math.PI*1.45),'#b0d6df',root,0,1.18,.325,'Liontin bulan');const chain=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.10,1.45,.13),new THREE.Vector3(-.06,1.34,.30),new THREE.Vector3(0,1.23,.325),new THREE.Vector3(.06,1.34,.30),new THREE.Vector3(.10,1.45,.13)]),new THREE.LineBasicMaterial({color:'#afbec4'}));root.add(chain);}
 if(outfit.aksesori==='aurora')for(const side of [-1,1]){const wing=mesh(new THREE.OctahedronGeometry(.40,0),side===1?'#91c9c2':'#aac7de',root,side*.40,1.20,-.35,'Sayap aurora');wing.scale.set(.58,1.25,.12);wing.rotation.z=side*-.42;}
 if(['perak','fajar'].includes(outfit.perlengkapan))for(const side of [-1,1]){const gem=mesh(new THREE.OctahedronGeometry(.065,0),outfit.perlengkapan==='fajar'?'#f1cf7b':'#9ac9dc',root,side*.28,1.38,.13,'Permata perlengkapan');gem.scale.set(.75,1,.5);}
 if(outfit.perlengkapan==='lumut_purba')for(const side of [-1,1]){ball(side===-1?leftArm:rightArm,'#52967f',.07,[0,.04,.13],[.8,1.1,.6],'Permata lumut');box(side===-1?leftArm:rightArm,'#68523c',[.05,.18,.05],[0,-.04,.12],'Ranting purba');}
 // Keep decorative front layers above an equipped chest plate.
 if(outfit.aksesori==='syal'||outfit.baju==='senja')root.traverse(o=>{if(o.name==='Kerah peramu'||(outfit.aksesori==='syal'&&o.name==='Kerah mantel senja'))o.visible=false;});
 const armored=outfit.baju==='zirah'||outfit.baju==='surya';root.traverse(o=>{if(o.name==='Tali selempang')o.position.z=armored?.335:.29;if(o.name==='Tali tas')o.position.z=armored?.335:.29;if(o.name==='Kompas')o.position.z=armored?.36:.315;if(o.name==='Pengait jubah')o.position.z=armored?.33:.255;});
 // Give loose long hair its own space between the cloak and the backpack.
 if(longHair)for(const o of root.children)if(['Tas herbal','Tutup tas herbal','Ransel perjalanan','Gulungan alas tidur'].includes(o.name))o.position.z-=.12;
 if(['bob','panjang','sebahu','gelombang'].includes(spec.hairStyle??DEFAULT_HAIR))head.traverse(o=>{if(o.name==='Anting daun'){o.position.z=.17;o.position.x=Math.sign(o.position.x)*.34;}});
 root.userData.longHair=longHair;
 // Handheld equipment follows the wrist, not an unrelated point on the torso.
 const hold=(name:string,hand:THREE.Group,pos:[number,number,number],rotation:[number,number,number]=[0,0,0])=>{const object=root.getObjectByName(name);if(object){hand.add(object);object.position.set(...pos);object.rotation.set(...rotation);object.userData.grip=true;}};
 hold('Ikatan herbal',rightHand,[0,0,.02]);hold('Peta tergulung',leftHand,[0,0,.025],[0,0,Math.PI/2]);hold('Batang peta',leftHand,[0,0,.025],[0,0,Math.PI/2]);
 hold('Palu perajin',rightHand,[0,0,.025],[.38,0,0]);
 hold('Penyiram tanaman',rightHand,[0,-.14,.055]);hold('Tongkat sihir',rightHand,[0,0,.025]);
 const watering=root.getObjectByName('Penyiram tanaman');if(watering){const handle=mesh(new THREE.TorusGeometry(.095,.018,5,10,Math.PI),metal,watering,0,.105,0,'Pegangan penyiram');handle.rotation.y=Math.PI/2;}
 const shield=root.getObjectByName('Perisai penjaga');if(shield){leftForearm.add(shield);shield.position.set(-.20,-.12,.045);shield.rotation.set(0,-.12,0);box(leftForearm,leather,[.23,.055,.035],[-.10,-.19,-.035],'Tali perisai ke manset');}
 if(outfit.aksesori==='aurora'){box(root,leather,[.32,.24,.05],[0,1.22,-.30],'Dudukan sayap');for(const side of [-1,1])box(root,gold,[.22,.045,.05],[side*.23,1.23,-.32],'Sambungan sayap');}
 // Bridge the scarf to its collar instead of leaving a separate floating strip.
 if(outfit.aksesori==='syal'){const seam=new THREE.QuadraticBezierCurve3(new THREE.Vector3(.07,1.47,.14),new THREE.Vector3(.10,1.40,.28),new THREE.Vector3(.10,1.35,.305));mesh(new THREE.TubeGeometry(seam,8,.048,5,false),'#e2d7b8',root,0,0,0,'Lipatan syal');}
 const rig={root,head,leftLeg,rightLeg,leftArm,rightArm,leftForearm,rightForearm,leftHand,rightHand,cape,role:spec.role};root.userData.rig=rig;return rig;
}
export function animateAvatar(rig:AvatarRig,time:number,walking:boolean,reduced=false){
 const t=reduced?0:time;const stride=walking&&!reduced?Math.sin(t*5.4)*.43:0;
 rig.leftLeg.rotation.x=stride;rig.rightLeg.rotation.x=-stride;
 rig.leftArm.rotation.set(rig.role==='Penjaga'?-.22-stride*.12:-stride*.55-.06,0,0);rig.rightArm.rotation.set(stride*(rig.role==='Penjaga'?.12:.55)-.08,0,0);
 rig.leftForearm.rotation.set(-.10,0,0);rig.rightForearm.rotation.set(-.14,0,0);rig.leftHand.rotation.set(0,0,0);rig.rightHand.rotation.set(0,0,0);
 if(rig.role==='Penyihir'){rig.rightArm.rotation.z=.34;rig.rightHand.quaternion.copy(rig.rightArm.quaternion).multiply(rig.rightForearm.quaternion).invert();}
 rig.head.rotation.x=0;rig.head.rotation.y=Math.sin(t*.7)*(rig.root.userData.longHair?.025:.10);rig.head.rotation.z=Math.sin(t*1.1)*(rig.root.userData.longHair?.005:.015);
 const cloth=rig.cape.geometry.getAttribute('position'),rest=rig.cape.userData.restPositions as Float32Array;for(let i=0;i<cloth.count;i++){const v=-rest[i*3+1]/.68;cloth.setZ(i,rest[i*3+2]-(reduced?0:Math.sin(t*2.2-v*1.8)*.016*v*v+(walking?.012*v:0)));}cloth.needsUpdate=true;
}
export function disposeAvatar(root:THREE.Object3D){const materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());}
