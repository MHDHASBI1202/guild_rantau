import * as THREE from 'three';
import {createHair} from './hair-model';
import {DEFAULT_HAIR,DEFAULT_SKIN,isLongHair,type HairStyle,type SkinTone} from './appearance-options';
import type {Gender} from './character-options';
import {DEFAULT_LOADOUT,findItem,type Loadout} from './cosmetics';
export type AvatarSpec={name:string;role:string;color:string;bed:string;outfit?:Loadout;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone};
export type AvatarRig={root:THREE.Group;head:THREE.Group;leftLeg:THREE.Group;rightLeg:THREE.Group;leftArm:THREE.Group;rightArm:THREE.Group;cape:THREE.Mesh;role:string};
export function createAvatar(spec:AvatarSpec):AvatarRig{
 const outfit={...DEFAULT_LOADOUT,...spec.outfit};const gender=spec.gender??'laki-laki';
 const longHair=isLongHair(spec.hairStyle??DEFAULT_HAIR)&&!(outfit.topi==='peran'&&spec.role==='Peramu');
 const root=new THREE.Group();root.name='Anggota '+spec.name;root.userData.bed=spec.bed;root.userData.role=spec.role;root.userData.gender=gender;
 const materials=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,flatShading:true,roughness:.86}));return materials.get(color)!;};
 const mesh=(geo:THREE.BufferGeometry,color:string,parent:THREE.Object3D,x=0,y=0,z=0,name='')=>{const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;};
 const box=(p:THREE.Object3D,c:string,size:number[],pos:number[],name='')=>mesh(new THREE.BoxGeometry(...size as [number,number,number]),c,p,...pos as [number,number,number],name);
 const ball=(p:THREE.Object3D,c:string,r:number,pos:number[],scale=[1,1,1],name='')=>{const m=mesh(new THREE.SphereGeometry(r,8,6),c,p,...pos as [number,number,number],name);m.scale.set(...scale as [number,number,number]);return m;};
 const group=(p:THREE.Object3D,x:number,y:number,z:number,name:string)=>{const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;};
 const skin=spec.skinTone??DEFAULT_SKIN,hair='#49372e',leather='#785640',dark='#414d4b',cream='#e9e2cb',metal='#a9b5b4',gold='#c9a568';
 mesh(new THREE.CylinderGeometry(.26,.31,.56,7),cream,root,0,1.1,0,'Tunik linen');
 mesh(new THREE.CylinderGeometry(.315,.325,.095,10),leather,root,0,.86,0,'Sabuk kulit');box(root,gold,[.10,.085,.025],[0,.86,.333],'Gesper');
 mesh(new THREE.CylinderGeometry(.085,.10,.17,7),skin,root,0,1.48,0,'Leher');
 const head=group(root,0,1.75,0,'Kepala');ball(head,skin,.30,[0,0,0],[.92,1,.85],'Wajah');
 for(const side of [-1,1]){const ear=ball(head,skin,.075,[side*.265,-.025,0],[.65,1,.7],'Telinga');ear.visible=!['bob','panjang','sebahu','gelombang'].includes(spec.hairStyle??DEFAULT_HAIR);ball(head,'#f8f3df',.061,[side*.11,.015,.223],[.85,1.15,.4],'Mata putih');ball(head,'#343d36',.035,[side*.11,.015,.245],[.8,1.1,.3],'Pupil');ball(head,'#ffffff',.013,[side*.10,.032,.256],[1,1,.3],'Kilau mata');const brow=box(head,hair,[.112,gender==='perempuan'?.018:.026,.027],[side*.11,.105,.225],'Alis');brow.rotation.z=side*-.10;}
 ball(head,skin,.054,[0,-.045,.26],[.7,.8,.8],'Hidung');const smile=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.075,-.123,.224),new THREE.Vector3(0,-.14,.24),new THREE.Vector3(.075,-.123,.224)]),new THREE.LineBasicMaterial({color:'#9a6c54'}));head.add(smile);
 const hairRig=createHair({style:spec.hairStyle??DEFAULT_HAIR,role:spec.role,hat:outfit.topi,color:hair,glasses:outfit.aksesori==='kacamata'});head.add(hairRig);root.userData.hairFit=hairRig.userData.hairFit;root.userData.hairStyle=spec.hairStyle??DEFAULT_HAIR;root.userData.skinTone=skin;
 const leg=(side:number)=>{const p=group(root,side*.14,.79,0,'Kaki '+side);box(p,dark,[.19,.34,.22],[0,-.16,0],'Celana');box(p,dark,[.17,.22,.19],[0,-.42,0],'Betis');box(p,leather,[.23,.23,.32],[0,-.665,.045],'Sepatu bot');box(p,'#483d32',[.24,.06,.34],[0,-.76,.05],'Sol sepatu');box(p,gold,[.03,.045,.018],[side*.08,-.61,.21],'Gesper sepatu');return p;};
 const leftLeg=leg(-1),rightLeg=leg(1);
 const arm=(side:number)=>{const p=group(root,side*.30,1.31,0,'Lengan '+side);ball(p,cream,.14,[side*.025,-.04,0],[.9,1.1,1],'Bahu');box(p,cream,[.17,.26,.20],[side*.03,-.20,0],'Lengan tunik');box(p,skin,[.14,.20,.16],[side*.03,-.40,.015],'Lengan bawah');box(p,leather,[.16,.09,.18],[side*.03,-.48,.015],'Manset');ball(p,skin,.096,[side*.03,-.57,.02],[.85,1,.85],'Tangan');return p;};
 const leftArm=arm(-1),rightArm=arm(1);
 const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.27,1.40,-.33,.27,1.40,-.33,-.35,.76,-.39,.35,.76,-.39,0,.70,-.40],3));capeGeo.setIndex([0,2,4,0,4,1,1,4,3]);capeGeo.computeVertexNormals();const cape=mesh(capeGeo,spec.color,root,0,0,0,'Jubah pilihan anggota');const capeMat=mat(spec.color).clone();capeMat.side=THREE.DoubleSide;cape.material=capeMat;
 // Colored shoulders and front clasp keep the selected color readable from every side.
 for(const side of [-1,1])ball(root,spec.color,.17,[side*.28,1.35,-.015],[1,.46,1.15],'Mantel bahu');ball(root,gold,.045,[.16,1.33,.25],[1,1,.4],'Pengait jubah');
 if(spec.role==='Penjaga'){
  mesh(new THREE.SphereGeometry(.34,12,6,0,Math.PI*2,0,1.2),metal,head,0,0,-.015,'Helm penjaga');mesh(new THREE.TorusGeometry(.317,.014,4,12),metal,head,0,.123,-.015,'Tepi helm').rotation.x=Math.PI/2;box(head,'#788d8d',[.045,.025,.32],[0,.336,-.015],'Bubungan helm');
  for(const side of [-1,1])box(head,metal,[.075,.22,.13],[side*.295,-.005,-.045],'Pelindung pipi');
  box(root,'#94a5a2',[.42,.29,.055],[0,1.20,.315],'Pelindung dada');
  const shield=group(leftArm,-.19,-.35,.18,'Perisai penjaga');const shape=new THREE.Shape();shape.moveTo(-.24,.29);shape.lineTo(.24,.29);shape.lineTo(.23,-.10);shape.lineTo(0,-.33);shape.lineTo(-.23,-.10);shape.closePath();const outer=mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false}),metal,shield,0,0,0,'Bingkai perisai');outer.rotation.y=-.12;const wood=mesh(new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:false}),spec.color,shield,0,0,.015);wood.scale.set(.82,.82,1);ball(shield,gold,.07,[0,.015,.10],[1,1,.35],'Pusat perisai');box(shield,leather,[.14,.10,.04],[.15,-.20,-.13],'Pegangan perisai');
  const scabbard=box(root,leather,[.09,.48,.11],[.36,.64,-.48],'Sarung pedang');scabbard.rotation.z=-.18;const beltHook=new THREE.Vector3(.32,.90,-.05),sheathHook=new THREE.Vector3(.40,.89,-.48);const swordStrap=mesh(new THREE.CylinderGeometry(.025,.025,beltHook.distanceTo(sheathHook),5),leather,root,...beltHook.clone().add(sheathHook).multiplyScalar(.5).toArray() as [number,number,number],'Ikat sarung pedang');swordStrap.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sheathHook.clone().sub(beltHook).normalize());box(root,leather,[.06,.14,.06],[.40,.98,-.48],'Pegangan pedang');box(root,gold,[.18,.035,.09],[.40,.90,-.48],'Gagang pedang tersarung');
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
  box(root,leather,[.36,.43,.04],[0,1.06,.37],'Celemek perajin');box(root,gold,[.07,.08,.03],[0,1.18,.40],'Kancing celemek');
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
 if(spec.role==='Peramu'||spec.role==='Penjelajah')for(const side of [-1,1]){const front=(outfit.baju==='zirah'||outfit.baju==='surya')?.39:.30;const strapCurve=longHair?new THREE.CubicBezierCurve3(new THREE.Vector3(side*.18,1.35,front),new THREE.Vector3(side*.40,1.48,.10),new THREE.Vector3(side*.40,1.48,-.60),new THREE.Vector3(side*.18,1.33,-.62)):new THREE.QuadraticBezierCurve3(new THREE.Vector3(side*.18,1.35,front),new THREE.Vector3(side*.18,1.68,-.06),new THREE.Vector3(side*.18,1.33,-.40));mesh(new THREE.TubeGeometry(strapCurve,12,.018,4,false),leather,root,0,0,0,'Tali bahu ransel');}
 const shirt=findItem('baju',outfit.baju),pants=findItem('celana',outfit.celana),gear=findItem('perlengkapan',outfit.perlengkapan);
 const gearNames=new Set(['Helm penjaga','Tepi helm','Bubungan helm','Pelindung pipi','Pelindung dada','Bingkai perisai','Pusat perisai','Pengait jubah','Gagang pedang tersarung','Tas herbal','Tutup tas herbal','Tali tas','Ransel perjalanan','Tas peta','Kancing tas','Kompas','Pita topi']);
 root.traverse(o=>{if(o instanceof THREE.Mesh){if(gear&&outfit.perlengkapan!=='standar'&&gearNames.has(o.name))o.material=mat(gear.color);if(shirt&&['Tunik linen','Bahu','Lengan tunik'].includes(o.name))o.material=mat(shirt.color);if(pants&&['Celana','Betis'].includes(o.name))o.material=mat(pants.color);}});
 if(outfit.baju==='surya'){capeMat.color.set(shirt!.color);root.traverse(o=>{if(o instanceof THREE.Mesh&&o.name==='Mantel bahu')o.material=mat(shirt!.color);});}
 if(outfit.baju==='senja')mesh(new THREE.CylinderGeometry(.16,.19,.17,8),'#955342',root,0,1.42,0,'Kerah mantel senja');
 if(outfit.baju==='zirah'||outfit.baju==='surya'){const c=shirt!.color;box(root,c,[.45,.34,.055],[0,1.19,.315],'Zirah kosmetik');for(const side of [-1,1])ball(side===-1?leftArm:rightArm,c,.17,[side*.025,.04,0],[1.12,.55,1.25],'Pelindung bahu kosmetik');root.traverse(o=>{if(o.name==='Mantel bahu'||o.name==='Pelindung dada')o.visible=false;});box(root,outfit.baju==='surya'?'#fff1b2':'#e3ebed',[.09,.13,.025],[0,1.22,.355],'Lambang dada');}
 if(['rimba','bahari'].includes(outfit.celana))for(const [side,part] of [[-1,leftLeg],[1,rightLeg]] as const)box(part,pants!.color,[.07,.13,.19],[side*.12,-.17,0],'Kantong celana');
 if(['ksatria','astral'].includes(outfit.celana))for(const part of [leftLeg,rightLeg]){ball(part,outfit.celana==='astral'?'#d7b46b':'#bfced4',.115,[0,-.34,.105],[.9,1.15,.35],'Pelindung lutut');if(outfit.celana==='astral')box(part,'#d7b46b',[.16,.15,.04],[0,-.53,.13],'Pelindung tulang kering');}
 if(outfit.topi!=='peran'){
  const names=new Set(['Helm penjaga','Tepi helm','Bubungan helm','Pelindung pipi','Tudung peramu','Pinggir topi','Topi penjelajah','Pita topi','Bulu topi','Pinggir topi kerja','Topi kerja','Pinggir topi ladang','Topi ladang','Pinggir topi sihir','Topi sihir']);head.traverse(o=>{if(names.has(o.name))o.visible=false;});
  if(outfit.topi==='baret'){const beret=mesh(new THREE.SphereGeometry(.345,12,6,0,Math.PI*2,0,Math.PI/2),'#9a6380',head,.025,.225,-.015,'Baret kosmetik');beret.scale.set(1.05,.52,1);mesh(new THREE.CylinderGeometry(.29,.29,.045,10,1,true),'#85516d',head,0,.205,-.015,'Pita baret');ball(head,gold,.035,[.24,.25,.235],[1,1,.4],'Pin baret');}
  if(outfit.topi==='jerami'){mesh(new THREE.CylinderGeometry(.42,.43,.045,10),'#d1b97d',head,0,.19,-.015,'Tepi jerami');mesh(new THREE.CylinderGeometry(.255,.305,.23,10),'#c4aa6c',head,0,.34,-.015,'Topi jerami');mesh(new THREE.CylinderGeometry(.30,.305,.04,10,1,true),leather,head,0,.255,-.015,'Pita jerami');}
  if(outfit.topi==='kristal'||outfit.topi==='mahkota'){const c=outfit.topi==='kristal'?'#7bc7cc':gold;mesh(new THREE.TorusGeometry(.30,.017,4,12),c,head,0,.12,-.012,'Lingkar mahkota').rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const crystal=mesh(new THREE.OctahedronGeometry(i===0?.12:.09,0),outfit.topi==='kristal'?'#9be2df':'#e6b254',head,Math.sin(a)*.30,.30,Math.cos(a)*.30-.012,'Permata mahkota');crystal.scale.set(.5,1.35,.5);}}
 }
 if(outfit.aksesori==='syal'){mesh(new THREE.CylinderGeometry(.145,.17,.12,8),'#e2d7b8',root,0,1.45,.015,'Syal krem');const tail=box(root,'#e2d7b8',[.11,.28,.05],[.10,1.25,.39],'Ujung syal');tail.rotation.z=-.13;}
 if(outfit.aksesori==='kacamata'){for(const side of [-1,1])mesh(new THREE.TorusGeometry(.077,.013,4,12),gold,head,side*.11,.015,.278,'Kacamata bundar');box(head,gold,[.07,.018,.02],[0,.02,.28],'Jembatan kacamata');}
 if(outfit.aksesori==='daun')for(const side of [-1,1]){const leaf=ball(head,'#8ca874',.075,[side*.32,-.13,.085],[.45,1.35,.25],'Anting daun');leaf.rotation.z=side*.25;}
 if(outfit.aksesori==='bulan'){mesh(new THREE.TorusGeometry(.065,.018,4,14,Math.PI*1.45),'#b0d6df',root,0,1.18,.39,'Liontin bulan');const chain=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.12,1.45,.27),new THREE.Vector3(-.06,1.34,.395),new THREE.Vector3(0,1.23,.39),new THREE.Vector3(.06,1.34,.395),new THREE.Vector3(.12,1.45,.27)]),new THREE.LineBasicMaterial({color:'#afbec4'}));root.add(chain);}
 if(outfit.aksesori==='aurora')for(const side of [-1,1]){const wing=mesh(new THREE.OctahedronGeometry(.40,0),side===1?'#91c9c2':'#aac7de',root,side*.65,1.20,-.48,'Sayap aurora');wing.scale.set(.58,1.25,.12);wing.rotation.z=side*-.42;}
 if(['perak','fajar'].includes(outfit.perlengkapan))for(const side of [-1,1]){const gem=mesh(new THREE.OctahedronGeometry(.065,0),outfit.perlengkapan==='fajar'?'#f1cf7b':'#9ac9dc',root,side*.28,1.38,.13,'Permata perlengkapan');gem.scale.set(.75,1,.5);}
 // Keep decorative front layers above an equipped chest plate.
 if(outfit.aksesori==='syal'||outfit.baju==='senja')root.traverse(o=>{if(o.name==='Kerah peramu'||(outfit.aksesori==='syal'&&o.name==='Kerah mantel senja'))o.visible=false;});
 const armored=outfit.baju==='zirah'||outfit.baju==='surya';root.traverse(o=>{if(o.name==='Tali selempang')o.position.z=armored?.38:.31;if(o.name==='Tali tas')o.position.z=armored?.38:.30;if(o.name==='Kompas')o.position.z=armored?.41:.34;if(o.name==='Pengait jubah')o.position.z=armored?.37:.25;});
 // Give loose long hair its own space between the cloak and the backpack.
 if(longHair)for(const o of root.children)if(['Tas herbal','Tutup tas herbal','Ransel perjalanan','Gulungan alas tidur'].includes(o.name))o.position.z-=.22;
 if(['bob','panjang','sebahu','gelombang'].includes(spec.hairStyle??DEFAULT_HAIR))head.traverse(o=>{if(o.name==='Anting daun'){o.position.z=.17;o.position.x=Math.sign(o.position.x)*.34;}});
 root.userData.longHair=longHair;
 const rig={root,head,leftLeg,rightLeg,leftArm,rightArm,cape,role:spec.role};root.userData.rig=rig;return rig;
}
export function animateAvatar(rig:AvatarRig,time:number,walking:boolean,reduced=false){
 const t=reduced?0:time;const stride=walking&&!reduced?Math.sin(t*5.4)*.43:0;
 rig.leftLeg.rotation.x=stride;rig.rightLeg.rotation.x=-stride;
 rig.leftArm.rotation.x=rig.role==='Penjaga'?-.22-stride*.12:-stride*.65-.08;rig.rightArm.rotation.x=stride*.65-.12;
 rig.head.rotation.y=Math.sin(t*.7)*(rig.root.userData.longHair?.025:.10);rig.head.rotation.z=Math.sin(t*1.1)*(rig.root.userData.longHair?.005:.015);
 rig.cape.rotation.x=Math.sin(t*2.2)*.018;
}
export function disposeAvatar(root:THREE.Object3D){const materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());}
