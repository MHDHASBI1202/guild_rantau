'use client';
import {createCampEnvironment,type CampAnim} from './camp-environment';
import {EMPTY_WORLD,IMPACTS,stationFrame,type WorldProgress} from './world-progress';
import type {HairStyle,SkinTone} from './appearance-options';
import type {Gender} from './character-options';
import {type Loadout} from './cosmetics';
import {useEffect,useRef,useState} from 'react';
import {createMotion,advanceMotion,recentActivity,workSlots,dockPoint,ringPoint,ROLE_SPECIALTIES,type MotionState} from './activity-motion';
import {createActivityKit,animateActivity,type ActivityKit} from './activity-animation';
import * as THREE from 'three';
import {createAvatar,animateAvatar,disposeAvatar} from './avatar-model';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {getRumuMilestone} from './milestones';

export const RUMU_ARU_LORE = [
 {speaker:'Aru',role:'Pengurus Guild',text:'Anggotanya baru sedikit, ranjangnya sudah disiapkan dua. Optimis dulu!'},
 {speaker:'Rumu',role:'Monster Batu Lv. 1',text:'Pelan-pelan saja. Yang penting kita jalan bersama.'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Di punggung Rumu kita aman. Hutan Bisik boleh berkabut, tapi rumah kita tetap hangat.'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Kayu dan daun obat yang kamu kumpulkan sangat berarti buat masa depan kamp kita!'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Barak buat tidur, atau Menara buat berjaga? Arah guild kita tentukan bareng.'},
 {speaker:'Rumu',role:'Monster Batu Lv. 1',text:'*Krrr-krrr...* (Rumu mendengkur pelan, menikmati segarnya angin Hutan Bisik).'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Rumu ini monster batu level satu. Badannya besar, hatinya jauh lebih besar!'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Kalau kamu lelah berkelana hari ini, jangan lupa istirahat di ranjang kamp ya.'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Dari satu tenda kecil ini, suatu hari nanti kita akan jadi kota berjalan megah!'},
 {speaker:'Aru',role:'Pengurus Guild',text:'Terima kasih sudah singgah di Guild Rantau. Setiap langkahmu adalah bagian dari kisah ini.'},
];

export default function World({night,focus,onSelect,onFollow,residents,world=EMPTY_WORLD,totalMembers=1}:{night:boolean;focus:string;onSelect:(v:string)=>void;onFollow:(bed:string)=>void;world?:WorldProgress;residents:{name:string;role:string;color:string;activity:string;lastAction?:number;bed:string;outfit?:Loadout;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone}[];totalMembers?:number}){
 const follow=useRef<string|null>(null);
 const [rows,setRows]=useState<{bed:string;name:string;title:string;phase:string}[]>([]);
 const [loreIndex,setLoreIndex]=useState(0);
 const [loreVisible,setLoreVisible]=useState(true);
 const previousWorld=useRef(EMPTY_WORLD);const pulse=useRef<{mesh:THREE.Mesh;started:number}|null>(null);
 const environment=useRef(new THREE.Group());const citizens=useRef(new THREE.Group());
 const mount=useRef<HTMLDivElement>(null);const select=useRef(onSelect);select.current=onSelect;
 const campAnimRef=useRef<CampAnim|null>(null);
 const state=useRef<{scene:THREE.Scene;sun:THREE.DirectionalLight;hemi:THREE.HemisphereLight;camera:THREE.PerspectiveCamera;controls:OrbitControls;stars:THREE.Points}|null>(null);

 const nextLore=()=>{
  setLoreVisible(false);
  setTimeout(()=>{
   setLoreIndex(i=>(i+1)%RUMU_ARU_LORE.length);
   setLoreVisible(true);
  },240);
 };

 useEffect(()=>{
  const timer=setInterval(()=>{
   setLoreVisible(false);
   setTimeout(()=>{
    setLoreIndex(i=>(i+1)%RUMU_ARU_LORE.length);
    setLoreVisible(true);
   },260);
  },8500);
  return()=>clearInterval(timer);
 },[]);

 useEffect(()=>{const el=mount.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{el.innerHTML='<p class="webgl-fallback">Kabut menutupi Rumu. Kamu tetap bisa menjelajahi kamp lewat menu di bawah.</p>';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.add(citizens.current);scene.add(environment.current);scene.fog=new THREE.FogExp2('#dce3ce',.009);
  const camera=new THREE.PerspectiveCamera(36,1,.1,450);camera.position.set(24,18,30);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=10;controls.maxDistance=65;controls.maxPolarAngle=1.45;controls.target.set(0,3.5,0);controls.autoRotate=true;controls.autoRotateSpeed=.30;
  const hemi=new THREE.HemisphereLight('#fff9df','#536f58',2.4);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0cb',3.4);sun.position.set(-16,34,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.normalBias=.08;scene.add(sun);
  const mat=(color:string)=>new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1});

  // === Pulau Padang Rumput yang Luas (Enlarged World Island) ===
  const island=new THREE.Mesh(new THREE.CylinderGeometry(38,34,3.4,14),mat('#9eb084'));island.position.y=-1.65;island.receiveShadow=true;scene.add(island);
  const cliff=new THREE.Mesh(new THREE.CylinderGeometry(40,35,2.4,14),mat('#6d7a66'));cliff.position.y=-3.6;cliff.receiveShadow=true;scene.add(cliff);

  // Jalur setapak utama & silang
  const trail=new THREE.Mesh(new THREE.PlaneGeometry(8.5,74),mat('#c8b898'));trail.rotation.x=-Math.PI/2;trail.rotation.z=-.13;trail.position.y=-.17;scene.add(trail);
  const crossTrail=new THREE.Mesh(new THREE.PlaneGeometry(54,6.5),mat('#c2b392'));crossTrail.rotation.x=-Math.PI/2;crossTrail.rotation.z=.72;crossTrail.position.y=-.172;scene.add(crossTrail);

  let seed=27;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};

  // === Pepohonan Alam dengan variasi bentuk (Forest Trees) ===
  const forestTrees:THREE.Group[]=[];
  for(let i=0;i<75;i++){
   const angle=random()*Math.PI*2,r=13.5+random()*19.5;
   const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
   if(Math.hypot(x,z)<11.5)continue;
   const h=2.2+random()*3.8;const tree=new THREE.Group();
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.15,.25,h*.45,5),mat('#7f7157'));trunk.position.y=h*.2;tree.add(trunk);
   if(i%3===0){
    const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(h*.38,1),mat(['#628060','#74966d','#84a478'][i%3]));
    crown.position.y=h*.65;crown.castShadow=true;tree.add(crown);
   }else{
    for(let j=0;j<3;j++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(h*(.28-j*.045),h*.55,5),mat(['#708c72','#849b77','#5a7b68'][j]));leaf.position.y=h*(.45+j*.19);leaf.castShadow=true;tree.add(leaf);}
   }
   tree.position.set(x,-.1,z);tree.userData.forest=true;
   tree.userData.windPhase=random()*Math.PI*2;
   tree.userData.windAmp=.012+random()*.016;
   tree.updateMatrixWorld(true);tree.userData.occlusionBox=new THREE.Box3().setFromObject(tree).expandByScalar(.3);
   scene.add(tree);forestTrees.push(tree);
  }

  // === Bebatuan Alam di Tepi Luar Tebing ===
  for(let i=0;i<16;i++){
   const a=(i/16)*Math.PI*2+random()*.25,r=31+random()*4.5;
   const boulder=new THREE.Mesh(new THREE.DodecahedronGeometry(1.2+random()*1.3,0),mat('#7e8777'));
   boulder.position.set(Math.cos(a)*r,.35,Math.sin(a)*r);
   boulder.rotation.set(random(),random(),random());
   boulder.castShadow=true;scene.add(boulder);
  }

  // === Petak Bunga & Semak Padang Rumput ===
  for(let i=0;i<32;i++){
   const a=random()*Math.PI*2,r=10+random()*19;
   const flower=new THREE.Mesh(new THREE.BoxGeometry(.35,.25,.35),mat(i%3===0?'#e3c376':i%3===1?'#d0909f':'#98bfa5'));
   flower.position.set(Math.cos(a)*r,.05,Math.sin(a)*r);
   scene.add(flower);
  }

  // Objek Rumu, Aru, & part di atas Rumu
  let rumu:THREE.Group|undefined;let dead=false;
  let rumuParts:{
   root:THREE.Group;
   baseY:number;
   head?:THREE.Object3D;
   baseHeadRot:THREE.Euler;
   eyebrows:THREE.Object3D[];
   aru?:THREE.Object3D;
   baseAruY:number;
   baseAruZ:number;
   baseAruRotY:number;
   aruSleeves:THREE.Object3D[];
   aruForearms:THREE.Object3D[];
   aruPalms:THREE.Object3D[];
   feet:THREE.Object3D[];
   feetBaseY:number[];
   flag?:THREE.Object3D;
   lantern?:THREE.Object3D;
  }|null=null;

  new GLTFLoader().load('/assets/rumu.glb',g=>{
   if(dead)return;
   rumu=g.scene;
   const box=new THREE.Box3().setFromObject(rumu);
   const size=box.getSize(new THREE.Vector3());
   const rumuMilestone=getRumuMilestone(totalMembers);
   const scale=(12/Math.max(size.x,size.z))*rumuMilestone.current.scaleMultiplier;
   rumu.scale.setScalar(scale);
   const box2=new THREE.Box3().setFromObject(rumu);
   const c=box2.getCenter(new THREE.Vector3());
   rumu.position.set(-c.x,-box2.min.y,-c.z);
   rumu.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
   scene.add(rumu);

   // Ambil node internal untuk animasi ekspresif
   const head=rumu.getObjectByName('Head_ROOT');
   const eyebrows=[
    rumu.getObjectByName('Soft stone eyebrow'),
    rumu.getObjectByName('Soft stone eyebrow.001')
   ].filter(Boolean) as THREE.Object3D[];
   const aru=rumu.getObjectByName('Aru_ROOT');
   const aruSleeves=[
    rumu.getObjectByName('Aru upper sleeve'),
    rumu.getObjectByName('Aru upper sleeve.001')
   ].filter(Boolean) as THREE.Object3D[];
   const aruForearms=[
    rumu.getObjectByName('Aru forearm'),
    rumu.getObjectByName('Aru forearm.001')
   ].filter(Boolean) as THREE.Object3D[];
   const aruPalms=[
    rumu.getObjectByName('Aru palm'),
    rumu.getObjectByName('Aru palm.001')
   ].filter(Boolean) as THREE.Object3D[];
   const feet=[
    rumu.getObjectByName('Foot_ROOT'),
    rumu.getObjectByName('Foot_ROOT.001'),
    rumu.getObjectByName('Foot_ROOT.002'),
    rumu.getObjectByName('Foot_ROOT.003')
   ].filter(Boolean) as THREE.Object3D[];
   const flag=rumu.getObjectByName('Guild flag');
   const lantern=rumu.getObjectByName('Lantern_ROOT');

   rumuParts={
    root:rumu,
    baseY:rumu.position.y,
    head,
    baseHeadRot:head?head.rotation.clone():new THREE.Euler(),
    eyebrows,
    aru,
    baseAruY:aru?aru.position.y:0,
    baseAruZ:aru?aru.position.z:0,
    baseAruRotY:aru?aru.rotation.y:0,
    aruSleeves,
    aruForearms,
    aruPalms,
    feet,
    feetBaseY:feet.map(f=>f.position.y),
    flag,
    lantern
   };
  },undefined,()=>{el.dataset.error='true';});

  const fireflies=new THREE.Group();for(let i=0;i<30;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.048,4,4),new THREE.MeshBasicMaterial({color:'#ffe5a0'}));f.position.set((random()-.5)*46,1+random()*7,(random()-.5)*46);fireflies.add(f);}scene.add(fireflies);

  // === Awan melayang / Clouds ===
  const clouds:THREE.Group[]=[];
  const cloudMat=new THREE.MeshStandardMaterial({color:'#f0f4e8',flatShading:true,roughness:1});
  for(let i=0;i<7;i++){
   const g=new THREE.Group();
   for(let j=0;j<4;j++){const p=new THREE.Mesh(new THREE.SphereGeometry(1.2+j*.35,5,4),cloudMat);p.position.set(j*1.8-2.7,0,0);p.scale.set([1.0,.72,.58,.48][j],.50,.60);g.add(p);}
   const ca=(i/7)*Math.PI*2,cr=26+i*2.6;
   g.position.set(Math.cos(ca)*cr,18+i*1.1,Math.sin(ca)*cr);
   g.userData.cloudAngle=ca;g.userData.cloudR=cr;
   g.userData.cloudSpeed=.006*(i%2===0?1:-1);
   scene.add(g);clouds.push(g);
  }

  // === Bintang malam / Stars ===
  const starPos:number[]=[];
  for(let i=0;i<220;i++){const u=(i+.5)/220;const phi=Math.acos(1-u*.96);const th=i*2.39996;const r=120+i*.5;starPos.push(Math.sin(phi)*Math.cos(th)*r,Math.cos(phi)*r+8,Math.sin(phi)*Math.sin(th)*r);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#fffde8',size:.68,sizeAttenuation:true,transparent:true,opacity:0}));
  scene.add(stars);

  // === Burung kecil / Birds ===
  const birds:THREE.Group[]=[];
  const birdMat=new THREE.MeshBasicMaterial({color:'#4a3f35',side:THREE.DoubleSide});
  for(let i=0;i<5;i++){
   const g=new THREE.Group();
   for(const side of [-1,1] as const){
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,side*.55,.10,-.34,side*.86,0,0],3));
    g.add(new THREE.Mesh(wg,birdMat));
   }
   g.userData.birdAngle=(i/5)*Math.PI*2;g.userData.birdR=17+i*3.2;
   g.userData.birdSpeed=.18+i*.032;g.userData.birdBaseY=9.5+i*1.1;g.userData.birdPhase=i*1.57;
   scene.add(g);birds.push(g);
  }

  state.current={scene,sun,hemi,camera,controls,stars};
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let startX=0,startY=0;const down=(e:PointerEvent)=>{follow.current=null;startX=e.clientX;startY=e.clientY;};
  const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-startX,e.clientY-startY)>7)return;const rect=el.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObject(citizens.current,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.bed)o=o.parent;if(o.userData.bed)select.current('resident:'+o.userData.bed);}else if(rumu&&ray.intersectObject(rumu,true).length)select.current('rumu');};
  const manualZoom=()=>{follow.current=null;};renderer.domElement.addEventListener('wheel',manualZoom,{passive:true});renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const clock=new THREE.Clock();let id=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotate=!reduced;
  let reportedAt=0;let frame=0;

  const animate=()=>{const dt=clock.getDelta(),t=clock.elapsedTime,now=Date.now();frame++;

   // === Animasi Ekspresif Rumu & Aru di atas punggungnya ===
   if(rumuParts&&!reduced){
    // 1. RUMU: Gerakan lambat, anggun & megah sebagai kura-kura raksasa (tanpa getaran cepat)
    const deepBreath=Math.sin(t*.5)*.025;
    rumuParts.root.position.y=rumuParts.baseY+deepBreath;

    // Pergeseran tumpuan badan yang tenang dan lambat (slow majestic sway)
    const swayX=Math.sin(t*.28)*.004;
    const swayZ=Math.cos(t*.22)*.004;
    const swayY=Math.sin(t*.15)*.008;

    rumuParts.root.rotation.x=swayX;
    rumuParts.root.rotation.z=swayZ;
    rumuParts.root.rotation.y=swayY;

    // Langkah kaki sangat pelan & bertahap (siklus 28 detik)
    const stepCycle=t%28;
    const isStepping=stepCycle>8.0&&stepCycle<18.0;
    const stepPhase=(stepCycle-8.0)/10.0; // 0..1
    const stepWave=isStepping?Math.sin(stepPhase*Math.PI*2)*.05:0;

    if(rumuParts.feet.length>=4){
     const liftA=Math.max(0,stepWave);
     const liftB=Math.max(0,-stepWave);
     rumuParts.feet[0].position.y=rumuParts.feetBaseY[0]+liftA;
     rumuParts.feet[2].position.y=rumuParts.feetBaseY[2]+liftA*.6;
     rumuParts.feet[1].position.y=rumuParts.feetBaseY[1]+liftB;
     rumuParts.feet[3].position.y=rumuParts.feetBaseY[3]+liftB*.6;
    }

    // Kepala Rumu menoleh perlahan & mengangguk anggun:
    if(rumuParts.head){
     const nod=Math.sin(t*.35)*.035;
     const lookAround=Math.sin(t*.18)*.09+Math.sin(t*.08)*.05;
     rumuParts.head.rotation.y=rumuParts.baseHeadRot.y+lookAround;
     rumuParts.head.rotation.x=rumuParts.baseHeadRot.x+nod;
     rumuParts.head.rotation.z=rumuParts.baseHeadRot.z+Math.sin(t*.22)*.015;
    }

    // Alis batu Rumu bergerak sangat halus & alami:
    rumuParts.eyebrows.forEach((eb,idx)=>{
     const ebOffset=Math.sin(t*.4+idx*1.5)*.015;
     eb.rotation.z=ebOffset;
    });

    // Bendera Guild & Lentera bergoyang kena semilir angin:
    if(rumuParts.flag){
     rumuParts.flag.rotation.y=Math.sin(t*2.0)*.14+Math.sin(t*3.2)*.05;
     rumuParts.flag.rotation.z=Math.sin(t*1.6+.4)*.06;
    }
    if(rumuParts.lantern){
     rumuParts.lantern.rotation.z=Math.sin(t*1.4)*.07+Math.sin(t*.5)*.03;
     rumuParts.lantern.rotation.x=Math.sin(t*1.1)*.04;
    }

    // 2. ARU: Bergerak Hidup dengan Berbagai Variasi Aksi (Cycle ~16 detik)
    if(rumuParts.aru){
     const aruCycle=t%16;

     if(aruCycle<4.5){
      // --- FASE 1: Melambaikan tangan menyapa para petualang ---
      const waveT=t*3.8;
      if(rumuParts.aruSleeves.length>=2){
       rumuParts.aruSleeves[1].rotation.x=-1.1+Math.sin(t*2.0)*.08;
       rumuParts.aruSleeves[1].rotation.z=.55;
       rumuParts.aruSleeves[0].rotation.x=-.3;
       rumuParts.aruSleeves[0].rotation.z=-.25;
      }
      if(rumuParts.aruForearms.length>=2){
       rumuParts.aruForearms[1].rotation.z=.5+Math.sin(waveT)*.32;
       rumuParts.aruForearms[1].rotation.x=.2;
       rumuParts.aruForearms[0].rotation.z=0;
      }
      if(rumuParts.aruPalms.length>=2){
       rumuParts.aruPalms[1].rotation.y=Math.sin(waveT)*.25;
      }
      rumuParts.aru.position.y=rumuParts.baseAruY+Math.sin(t*1.5)*.006;
      rumuParts.aru.position.z=rumuParts.baseAruZ;
      rumuParts.aru.rotation.y=rumuParts.baseAruRotY+Math.sin(t*1.2)*.08;
      rumuParts.aru.rotation.x=.06;
     }else if(aruCycle<8.5){
      // --- FASE 2: Mencondongkan badan ke depan mengamati cakrawala ---
      rumuParts.aru.position.y=rumuParts.baseAruY+Math.sin(t*1.8)*.008;
      rumuParts.aru.position.z=rumuParts.baseAruZ+.06;
      rumuParts.aru.rotation.x=.18;
      rumuParts.aru.rotation.y=rumuParts.baseAruRotY+Math.sin(t*.9)*.35;

      if(rumuParts.aruSleeves.length>=2){
       rumuParts.aruSleeves[0].rotation.x=-.95;
       rumuParts.aruSleeves[0].rotation.z=-.2;
       rumuParts.aruSleeves[1].rotation.x=-.25;
       rumuParts.aruSleeves[1].rotation.z=.35;
      }
      if(rumuParts.aruForearms.length>=2){
       rumuParts.aruForearms[0].rotation.x=.7;
       rumuParts.aruForearms[0].rotation.y=.5;
       rumuParts.aruForearms[1].rotation.x=0;
       rumuParts.aruForearms[1].rotation.z=0;
      }
     }else if(aruCycle<12.0){
      // --- FASE 3: Peregangan kedua tangan ke atas penuh semangat ---
      rumuParts.aru.position.y=rumuParts.baseAruY+.035+Math.sin(t*2.2)*.015;
      rumuParts.aru.position.z=rumuParts.baseAruZ;
      rumuParts.aru.rotation.x=-.12;
      rumuParts.aru.rotation.y=rumuParts.baseAruRotY;

      if(rumuParts.aruSleeves.length>=2){
       rumuParts.aruSleeves[0].rotation.z=-1.1+Math.sin(t*2)*.1;
       rumuParts.aruSleeves[1].rotation.z=1.1-Math.sin(t*2)*.1;
       rumuParts.aruSleeves[0].rotation.x=-.4;
       rumuParts.aruSleeves[1].rotation.x=-.4;
      }
      if(rumuParts.aruForearms.length>=2){
       rumuParts.aruForearms[0].rotation.z=-.3;
       rumuParts.aruForearms[1].rotation.z=.3;
      }
     }else{
      // --- FASE 4: Berbalik mengajak ngobrol Rumu di sampingnya ---
      rumuParts.aru.position.y=rumuParts.baseAruY+Math.sin(t*1.8)*.01;
      rumuParts.aru.position.z=rumuParts.baseAruZ;
      rumuParts.aru.rotation.x=.05;
      rumuParts.aru.rotation.y=rumuParts.baseAruRotY-.42+Math.sin(t*1.4)*.08;

      if(rumuParts.aruSleeves.length>=2){
       rumuParts.aruSleeves[0].rotation.x=-.4+Math.sin(t*2.2)*.15;
       rumuParts.aruSleeves[0].rotation.z=-.15;
       rumuParts.aruSleeves[1].rotation.x=-.3;
       rumuParts.aruSleeves[1].rotation.z=.2;
      }
      if(rumuParts.aruForearms.length>=2){
       rumuParts.aruForearms[0].rotation.x=.4;
       rumuParts.aruForearms[1].rotation.x=.2;
      }
     }
    }
   }

   // === Angin pohon / Tree wind ===
   if(!reduced)for(const tree of forestTrees){
    tree.rotation.x=Math.sin(t*.72+tree.userData.windPhase)*(tree.userData.windAmp as number);
    tree.rotation.z=Math.sin(t*.55+tree.userData.windPhase+1.1)*(tree.userData.windAmp as number)*.65;
   }

   // === Awan / Clouds ===
   if(!reduced&&frame%2===0)for(const c of clouds){
    const a=(c.userData.cloudAngle as number)+(c.userData.cloudSpeed as number)*dt;
    c.userData.cloudAngle=a;
    c.position.x=Math.cos(a)*(c.userData.cloudR as number);c.position.z=Math.sin(a)*(c.userData.cloudR as number);
   }

   // === Burung / Birds ===
   if(!reduced)for(const b of birds){
    const a=(b.userData.birdAngle as number)+(b.userData.birdSpeed as number)*dt;b.userData.birdAngle=a;
    b.position.x=Math.cos(a)*(b.userData.birdR as number);b.position.z=Math.sin(a)*(b.userData.birdR as number);
    b.position.y=(b.userData.birdBaseY as number)+Math.sin(t*1.4+b.userData.birdPhase)*.9;
    b.rotation.y=-(a+Math.PI/2);
    const fl=Math.sin(t*6+b.userData.birdPhase)*.38;
    if(b.children[0])b.children[0].rotation.z=fl;
    if(b.children[1])b.children[1].rotation.z=-fl;
   }

   // === Api unggun + asap + kolam ===
   const ca=campAnimRef.current;
   if(ca&&!reduced){
    for(const fl of ca.flames){const ph=fl.userData.phaseOffset as number;fl.scale.x=.80+Math.sin(t*7.2+ph)*.20;fl.scale.z=.80+Math.sin(t*5.8+ph+1.2)*.22;fl.scale.y=.65+Math.sin(t*4.1+ph)*.35;fl.rotation.y+=.06;(fl.material as THREE.MeshBasicMaterial).opacity=.72+Math.sin(t*5.5+ph)*.18;}
    ca.emberLight.intensity=2.2+Math.sin(t*8.1)*.9+Math.sin(t*13.3)*.4;
    const fp=ca.emberLight.position;
    for(const sm of ca.smokePool){const u=((t*.14+(sm.userData.phaseOffset as number))%1+1)%1;sm.position.set(fp.x+(u-.5)*.35,fp.y-.15+u*3.2,fp.z+(u-.5)*.35);(sm.material as THREE.MeshBasicMaterial).opacity=Math.sin(u*Math.PI)*.32;}
    const pm=ca.pond.material as THREE.MeshStandardMaterial;pm.roughness=.12+Math.sin(t*.7)*.07+Math.sin(t*1.2+.9)*.04;
   }else if(ca)for(const sm of ca.smokePool)(sm.material as THREE.MeshBasicMaterial).opacity=0;

   // === Simulasi Warga & Aktivitas Peran Dinamis ===
   const actors=citizens.current.children;const slots=workSlots(actors.map(o=>o.userData.resident),now);
   actors.forEach((o,i)=>{const r=o.userData.resident,m=o.userData.motion as MotionState,rig=o.userData.rig,kit=o.userData.activityKit as ActivityKit;if(!rig||!m||!kit)return;
    const beforeX=o.position.x,beforeZ=o.position.z;let moving=false;
    const roleSpecialty=r.role?(ROLE_SPECIALTIES[r.role]||'guard'):'guard';
    if(reduced){const a=recentActivity(r,now),slot=slots.get(r.bed);if(a&&slot!==undefined){const [x,z]=dockPoint(a.impact,slot);o.position.set(x,.015,z);m.phase='work';m.action=a;}else{const [x,z]=ringPoint(m.angle,m.rx,m.rz);o.position.set(x,.015,z);m.phase=a?'queue':'stroll';m.action=undefined;}}
    else{const result=advanceMotion(m,[beforeX,beforeZ],r,slots.get(r.bed),now,dt);o.position.set(result.position[0],.015+(result.moving?Math.abs(Math.sin(t*5.4+i))*.018:0),result.position[1]);moving=result.moving;}
    let yaw=o.rotation.y;
    if(m.phase==='work'&&m.action){yaw=stationFrame(m.action.impact,Math.max(0,m.slot)).yaw;}
    else if(m.phase==='idle'){
     // Saat idle peran: hadap ke arah api unggun dengan gerakan menoleh santai
     const campFireX=-1.2,campFireZ=4.2;
     yaw=Math.atan2(campFireX-o.position.x,campFireZ-o.position.z)+Math.sin(t*.45+i)*.32;
    }
    else if(moving&&Math.hypot(o.position.x-beforeX,o.position.z-beforeZ)>.00001)yaw=Math.atan2(o.position.x-beforeX,o.position.z-beforeZ);
    o.rotation.y+=Math.atan2(Math.sin(yaw-o.rotation.y),Math.cos(yaw-o.rotation.y))*(reduced?1:1-Math.exp(-Math.min(dt,.1)*8));
    const activeId=m.phase==='work'?m.action?.id:(m.phase==='idle'?(m.idleAction as any):undefined);
    animateActivity(rig,kit,t+i,activeId,m.workTime,reduced,moving,m.phase==='work');
   });

   if(now-reportedAt>1000){
    reportedAt=now;
    const roleIdleNames:Record<string,string>={
     guard:'Berjaga di batas kamp',
     herbs:'Memeriksa tanaman herbal',
     explore:'Mengamati arah angin & peta',
     build:'Memeriksa perkakas rimba',
     plant:'Merawat petak kebun',
     ward:'Menenangkan kristal sihir',
    };
    setRows(actors.flatMap(o=>{
     const r=o.userData.resident,a=recentActivity(r,now),m=o.userData.motion as MotionState;
     if(a){
      return [{bed:r.bed,name:r.name,title:a.title,phase:({work:'Sedang bekerja',travel:'Menuju area',queue:'Menunggu giliran',return:'Kembali ke kamp'} as Record<string,string>)[m.phase]||'Beraktivitas'}];
     }
     const roleSpecialty=r.role?(ROLE_SPECIALTIES[r.role]||'guard'):'guard';
     if(m.phase==='idle'){
      return [{bed:r.bed,name:r.name,title:roleIdleNames[roleSpecialty]||'Aktivitas peran',phase:'Aktivitas peran'}];
     }
     return [{bed:r.bed,name:r.name,title:'Menjelajahi punggung Rumu',phase:'Berjalan santai'}];
    }));
   }

   if(follow.current){const actor=actors.find(o=>o.userData.bed===follow.current);if(actor){const direction=new THREE.Vector3(actor.position.x,0,actor.position.z).normalize(),target=actor.position.clone().add(new THREE.Vector3(0,.9,0)),cameraPoint=actor.position.clone().addScaledVector(direction,12);cameraPoint.y=8.2;const blend=reduced?1:1-Math.exp(-Math.min(dt,.1)*3);controls.target.lerp(target,blend);camera.position.lerp(cameraPoint,blend);}}
   const sight=new THREE.Ray(camera.position,controls.target.clone().sub(camera.position).normalize()),sightLength=camera.position.distanceTo(controls.target);for(const tree of scene.children)if(tree.userData.forest){const hit=follow.current?sight.intersectBox(tree.userData.occlusionBox,new THREE.Vector3()):null;tree.visible=!hit||camera.position.distanceTo(hit)>sightLength-.4;}
   if(pulse.current){const age=(performance.now()-pulse.current.started)/1600;const p=pulse.current.mesh;p.visible=age<1;p.scale.setScalar(.7+Math.min(1,age)*1.5);(p.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age);}
   fireflies.rotation.y=reduced?0:t*.016;controls.update();renderer.render(scene,camera);id=requestAnimationFrame(animate);};animate();
  return()=>{dead=true;cancelAnimationFrame(id);observer.disconnect();controls.dispose();disposeAvatar(scene);renderer.dispose();el.replaceChildren();state.current=null;campAnimRef.current=null;rumuParts=null;};
 },[]);

 useEffect(()=>{const s=state.current;if(!s)return;
  s.scene.fog=new THREE.FogExp2(night?'#344858':'#dce3ce',.009);
  s.hemi.intensity=night?1.2:2.4;s.sun.intensity=night?.6:3.4;s.sun.color.set(night?'#a4b9e0':'#fff0cb');
  (s.stars.material as THREE.PointsMaterial).opacity=night?.82:0;
 },[night]);

 useEffect(()=>{const s=state.current;if(!s)return;s.controls.autoRotate=focus==='world'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;follow.current=focus.startsWith('activity:')?focus.split(':')[1]:null;if(focus.startsWith('activity:')){/* Smooth following is applied by the render loop. */}else if(focus==='camp'){s.camera.position.set(12,15,16);s.controls.target.set(0,4,0);}else{s.camera.position.set(24,18,30);s.controls.target.set(0,3.5,0);}s.controls.update();},[focus]);

 useEffect(()=>{const group=citizens.current,visible=residents.slice(0,12),beds=new Set(visible.map(r=>r.bed));for(const child of [...group.children])if(!beds.has(child.userData.bed)){disposeAvatar(child);group.remove(child);}
  visible.forEach((r,i)=>{const signature=JSON.stringify([r.role,r.color,r.gender,r.hairStyle,r.skinTone,r.outfit]);let existing=group.children.find(o=>o.userData.bed===r.bed);
  if(existing&&existing.userData.appearance!==signature){const previous=existing;existing=undefined;group.remove(previous);disposeAvatar(previous);}
  if(!existing){
   const rig=createAvatar(r),angle=i*Math.PI*2/visible.length;
   const motion=createMotion(angle,r.bed);
   const [x,z]=ringPoint(angle,motion.rx,motion.rz);
   rig.root.position.set(x,.015,z);
   rig.root.userData.motion=motion;
   rig.root.userData.activityKit=createActivityKit(rig);
   rig.root.userData.appearance=signature;
   group.add(rig.root);
   existing=rig.root;
  }
  existing.userData.resident=r;
  });},[residents]);

 useEffect(()=>{const g=environment.current;
  while(g.children.length){const child=g.children[0];disposeAvatar(child);g.remove(child);}
  campAnimRef.current=null;
  const {root:camp,anim}=createCampEnvironment(world);g.add(camp);campAnimRef.current=anim;pulse.current=null;
  const changed=IMPACTS.find(i=>world[i.key]>previousWorld.current[i.key]);
  if(changed&&previousWorld.current.updatedAt&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const target=camp.getObjectByName('camp-'+changed.key);if(target){const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.75,24),new THREE.MeshBasicMaterial({color:changed.color,transparent:true,opacity:1,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(target.position);ring.position.y=.04;g.add(ring);pulse.current={mesh:ring,started:performance.now()};}}
  previousWorld.current=world;},[world]);

 return (
  <>
   <div ref={mount} className="world-canvas" role="img" aria-label="Dunia 3D Rumu. Geser untuk memutar, cubit untuk memperbesar."/>
   
   {/* Gelembung Suara / Lore & Penyemangat Aru & Rumu */}
   <div 
    className={`aru-lore-bubble ${loreVisible?'visible':'fading'}`}
    onClick={nextLore}
    role="button"
    tabIndex={0}
    onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')nextLore();}}
    aria-label="Pesan penyemangat dari Aru dan Rumu"
    title="Klik untuk mendengar pesan lain"
   >
    <div className="aru-lore-header">
     <span className="aru-lore-avatar">{RUMU_ARU_LORE[loreIndex].speaker==='Rumu'?'🪨':'🏕️'}</span>
     <span className="aru-lore-speaker">{RUMU_ARU_LORE[loreIndex].speaker} <small>· {RUMU_ARU_LORE[loreIndex].role}</small></span>
     <span className="aru-lore-hint">Klik 💬</span>
    </div>
    <p className="aru-lore-text">"{RUMU_ARU_LORE[loreIndex].text}"</p>
   </div>

   <aside className="world-activity" aria-label="Aktivitas anggota di dunia">
    <b>{rows.length?`${rows.length} petualang terlihat`:'Kamp berjalan tenang'}</b>
    {rows.map(r=><button key={r.bed} onClick={()=>onFollow(r.bed)} aria-label={`Ikuti ${r.name}: ${r.title}`}><span>{r.name}</span><small>{r.phase} · {r.title}</small></button>)}
    <small className="activity-footnote">{rows.length?'Klik nama untuk mengikuti.':'Anggota beraktivitas & berjalan santai di kamp.'} Maks. 12 anggota tampil. Bukan status online.</small>
   </aside>
  </>
 );
}
