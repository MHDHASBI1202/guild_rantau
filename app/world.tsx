'use client';
import {createCampEnvironment,type CampAnim} from './camp-environment';
import {EMPTY_WORLD,IMPACTS,STATIONS,type WorldProgress} from './world-progress';
import type {HairStyle,SkinTone} from './appearance-options';
import type {Gender} from './character-options';
import {type Loadout} from './cosmetics';
import {useEffect,useRef,useState} from 'react';
import {createMotion,advanceMotion,recentActivity,workSlots,dockPoint,ringPoint,type MotionState} from './activity-motion';
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
  const scene=new THREE.Scene();scene.add(citizens.current);scene.add(environment.current);scene.fog=new THREE.FogExp2('#dce3ce',.012);
  const camera=new THREE.PerspectiveCamera(36,1,.1,350);camera.position.set(19,14,23);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=12;controls.maxDistance=37;controls.maxPolarAngle=1.45;controls.target.set(0,3,0);controls.autoRotate=true;controls.autoRotateSpeed=.32;
  const hemi=new THREE.HemisphereLight('#fff9df','#536f58',2.4);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0cb',3.4);sun.position.set(-12,24,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.08;scene.add(sun);
  const mat=(color:string)=>new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1});
  const island=new THREE.Mesh(new THREE.CylinderGeometry(20,17,2.5,9),mat('#a2b287'));island.position.y=-1.45;island.receiveShadow=true;scene.add(island);
  const trail=new THREE.Mesh(new THREE.PlaneGeometry(7,42),mat('#c8b898'));trail.rotation.x=-Math.PI/2;trail.rotation.z=-.13;trail.position.y=-.17;scene.add(trail);
  let seed=27;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};

  // Pohon dengan tambahan data angin
  const forestTrees:THREE.Group[]=[];
  for(let i=0;i<35;i++){
   const angle=random()*Math.PI*2,r=11+random()*7;const x=Math.cos(angle)*r,z=Math.sin(angle)*r;if(Math.abs(x)<4)continue;
   const h=2+random()*3.5;const tree=new THREE.Group();
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.23,h*.45,5),mat('#7f7157'));trunk.position.y=h*.2;tree.add(trunk);
   for(let j=0;j<3;j++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(h*(.28-j*.045),h*.55,5),mat(['#708c72','#849b77','#5a7b68'][j]));leaf.position.y=h*(.45+j*.19);leaf.castShadow=true;tree.add(leaf);}
   tree.position.set(x,-.1,z);tree.userData.forest=true;
   tree.userData.windPhase=random()*Math.PI*2;
   tree.userData.windAmp=.012+random()*.016;
   tree.updateMatrixWorld(true);tree.userData.occlusionBox=new THREE.Box3().setFromObject(tree).expandByScalar(.3);
   scene.add(tree);forestTrees.push(tree);
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
   baseAruRotY:number;
   aruSleeves:THREE.Object3D[];
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
    baseAruRotY:aru?aru.rotation.y:0,
    aruSleeves,
    flag,
    lantern
   };
  },undefined,()=>{el.dataset.error='true';});

  const fireflies=new THREE.Group();for(let i=0;i<22;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.045,4,4),new THREE.MeshBasicMaterial({color:'#ffe5a0'}));f.position.set((random()-.5)*22,1+random()*6,(random()-.5)*22);fireflies.add(f);}scene.add(fireflies);

  // === Awan melayang / Clouds ===
  const clouds:THREE.Group[]=[];
  const cloudMat=new THREE.MeshStandardMaterial({color:'#f0f4e8',flatShading:true,roughness:1});
  for(let i=0;i<6;i++){
   const g=new THREE.Group();
   for(let j=0;j<4;j++){const p=new THREE.Mesh(new THREE.SphereGeometry(1.1+j*.32,5,4),cloudMat);p.position.set(j*1.65-2.5,0,0);p.scale.set([1.0,.72,.58,.48][j],.50,.60);g.add(p);}
   const ca=(i/6)*Math.PI*2,cr=16+i*1.8;
   g.position.set(Math.cos(ca)*cr,15+i*.9,Math.sin(ca)*cr);
   g.userData.cloudAngle=ca;g.userData.cloudR=cr;
   g.userData.cloudSpeed=.007*(i%2===0?1:-1);
   scene.add(g);clouds.push(g);
  }

  // === Bintang malam / Stars ===
  const starPos:number[]=[];
  for(let i=0;i<180;i++){const u=(i+.5)/180;const phi=Math.acos(1-u*.96);const th=i*2.39996;const r=100+i*.5;starPos.push(Math.sin(phi)*Math.cos(th)*r,Math.cos(phi)*r+8,Math.sin(phi)*Math.sin(th)*r);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#fffde8',size:.65,sizeAttenuation:true,transparent:true,opacity:0}));
  scene.add(stars);

  // === Burung kecil / Birds ===
  const birds:THREE.Group[]=[];
  const birdMat=new THREE.MeshBasicMaterial({color:'#4a3f35',side:THREE.DoubleSide});
  for(let i=0;i<4;i++){
   const g=new THREE.Group();
   for(const side of [-1,1] as const){
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,side*.52,.10,-.32,side*.82,0,0],3));
    g.add(new THREE.Mesh(wg,birdMat));
   }
   g.userData.birdAngle=(i/4)*Math.PI*2;g.userData.birdR=11+i*2.4;
   g.userData.birdSpeed=.20+i*.038;g.userData.birdBaseY=8.5+i*1.1;g.userData.birdPhase=i*1.57;
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

   // === Animasi Rumu & Aru di atas punggungnya ===
   if(rumuParts&&!reduced){
    // 1. Rumu bernapas naik turun halus & sedikit bergoyang
    const breath=Math.sin(t*1.5);
    rumuParts.root.position.y=rumuParts.baseY+breath*.035;
    rumuParts.root.rotation.z=Math.sin(t*.75)*.009;
    rumuParts.root.rotation.x=Math.sin(t*.55+1.2)*.007;

    // 2. Kepala Rumu menoleh perlahan mengamati hutan
    if(rumuParts.head){
     rumuParts.head.rotation.y=rumuParts.baseHeadRot.y+Math.sin(t*.42)*.08;
     rumuParts.head.rotation.x=rumuParts.baseHeadRot.x+Math.sin(t*.85)*.035;
     rumuParts.head.rotation.z=rumuParts.baseHeadRot.z+Math.sin(t*.58)*.02;
    }

    // 3. Alis batu Rumu bergerak halus ekspresif
    rumuParts.eyebrows.forEach((eb,idx)=>{
     eb.rotation.z=Math.sin(t*1.2+idx*1.5)*.03;
    });

    // 4. Bendera Guild berkibar di atas Rumu
    if(rumuParts.flag){
     rumuParts.flag.rotation.y=Math.sin(t*3.7)*.14;
     rumuParts.flag.rotation.z=Math.sin(t*2.8+.5)*.06;
    }

    // 5. Lentera tenda berayun lembut
    if(rumuParts.lantern){
     rumuParts.lantern.rotation.z=Math.sin(t*1.7)*.04;
    }

    // 6. Aru di atas punggung Rumu bergerak hidup
    if(rumuParts.aru){
     rumuParts.aru.position.y=rumuParts.baseAruY+Math.sin(t*2.1)*.018;
     rumuParts.aru.rotation.y=rumuParts.baseAruRotY+Math.sin(t*.52)*.12;
     // Lengan Aru mengayun halus / memberi isyarat
     if(rumuParts.aruSleeves[0])rumuParts.aruSleeves[0].rotation.x=Math.sin(t*1.5)*.10;
     if(rumuParts.aruSleeves[1])rumuParts.aruSleeves[1].rotation.x=-Math.sin(t*1.1)*.06;
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

   const actors=citizens.current.children;const slots=workSlots(actors.map(o=>o.userData.resident),now);
   actors.forEach((o,i)=>{const r=o.userData.resident,m=o.userData.motion as MotionState,rig=o.userData.rig,kit=o.userData.activityKit as ActivityKit;if(!rig||!m||!kit)return;
    const beforeX=o.position.x,beforeZ=o.position.z;let moving=false;
    if(reduced){const a=recentActivity(r,now),slot=slots.get(r.bed);if(a&&slot!==undefined){const [x,z]=dockPoint(a.impact,slot);o.position.set(x,.015,z);m.phase='work';m.action=a;}else{const [x,z]=ringPoint(m.angle);o.position.set(x,.015,z);m.phase=a?'queue':'stroll';m.action=undefined;}}
    else{const result=advanceMotion(m,[beforeX,beforeZ],r,slots.get(r.bed),now,dt);o.position.set(result.position[0],.015+(result.moving?Math.abs(Math.sin(t*5.4+i))*.018:0),result.position[1]);moving=result.moving;}
    let yaw=o.rotation.y;
    if(m.phase==='work'&&m.action){const target=STATIONS[m.action.impact].position;yaw=Math.atan2(target[0]-o.position.x,target[1]-o.position.z);}
    else if(moving&&Math.hypot(o.position.x-beforeX,o.position.z-beforeZ)>.00001)yaw=Math.atan2(o.position.x-beforeX,o.position.z-beforeZ);
    o.rotation.y+=Math.atan2(Math.sin(yaw-o.rotation.y),Math.cos(yaw-o.rotation.y))*(reduced?1:1-Math.exp(-Math.min(dt,.1)*10));
    animateActivity(rig,kit,t+i,m.phase==='work'?m.action?.id:undefined,m.workTime,reduced);
   });
   if(now-reportedAt>1000){reportedAt=now;setRows(actors.flatMap(o=>{const r=o.userData.resident,a=recentActivity(r,now);return a?[{bed:r.bed,name:r.name,title:a.title,phase:({work:'Sedang bekerja',travel:'Menuju area',queue:'Menunggu giliran',return:'Kembali ke kamp',stroll:'Berjalan santai'} as Record<string,string>)[o.userData.motion.phase]}]:[];}));}
   if(follow.current){const actor=actors.find(o=>o.userData.bed===follow.current);if(actor){const direction=new THREE.Vector3(actor.position.x,0,actor.position.z).normalize(),target=actor.position.clone().add(new THREE.Vector3(0,.9,0)),cameraPoint=actor.position.clone().addScaledVector(direction,10);cameraPoint.y=7.2;const blend=reduced?1:1-Math.exp(-Math.min(dt,.1)*3);controls.target.lerp(target,blend);camera.position.lerp(cameraPoint,blend);}}
   const sight=new THREE.Ray(camera.position,controls.target.clone().sub(camera.position).normalize()),sightLength=camera.position.distanceTo(controls.target);for(const tree of scene.children)if(tree.userData.forest){const hit=follow.current?sight.intersectBox(tree.userData.occlusionBox,new THREE.Vector3()):null;tree.visible=!hit||camera.position.distanceTo(hit)>sightLength-.4;}
   if(pulse.current){const age=(performance.now()-pulse.current.started)/1600;const p=pulse.current.mesh;p.visible=age<1;p.scale.setScalar(.7+Math.min(1,age)*1.5);(p.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age);}
   fireflies.rotation.y=reduced?0:t*.016;controls.update();renderer.render(scene,camera);id=requestAnimationFrame(animate);};animate();
  return()=>{dead=true;cancelAnimationFrame(id);observer.disconnect();controls.dispose();disposeAvatar(scene);renderer.dispose();el.replaceChildren();state.current=null;campAnimRef.current=null;rumuParts=null;};
 },[]);

 useEffect(()=>{const s=state.current;if(!s)return;
  s.scene.fog=new THREE.FogExp2(night?'#344858':'#dce3ce',.012);
  s.hemi.intensity=night?1.2:2.4;s.sun.intensity=night?.6:3.4;s.sun.color.set(night?'#a4b9e0':'#fff0cb');
  (s.stars.material as THREE.PointsMaterial).opacity=night?.82:0;
 },[night]);

 useEffect(()=>{const s=state.current;if(!s)return;s.controls.autoRotate=focus==='world'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;follow.current=focus.startsWith('activity:')?focus.split(':')[1]:null;if(focus.startsWith('activity:')){/* Smooth following is applied by the render loop. */}else if(focus==='camp'){s.camera.position.set(10,14,14);s.controls.target.set(0,4,0);}else{s.camera.position.set(19,14,23);s.controls.target.set(0,3,0);}s.controls.update();},[focus]);

 useEffect(()=>{const group=citizens.current,visible=residents.slice(0,12),beds=new Set(visible.map(r=>r.bed));for(const child of [...group.children])if(!beds.has(child.userData.bed)){disposeAvatar(child);group.remove(child);}
  visible.forEach((r,i)=>{const signature=JSON.stringify([r.role,r.color,r.gender,r.hairStyle,r.skinTone,r.outfit]);let existing=group.children.find(o=>o.userData.bed===r.bed);
  if(existing&&existing.userData.appearance!==signature){const previous=existing;existing=undefined;group.remove(previous);disposeAvatar(previous);}
  if(!existing){const rig=createAvatar(r),angle=i*Math.PI*2/visible.length,[x,z]=ringPoint(angle);rig.root.position.set(x,.015,z);rig.root.userData.motion=createMotion(angle);rig.root.userData.activityKit=createActivityKit(rig);rig.root.userData.appearance=signature;group.add(rig.root);existing=rig.root;}
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
    <b>{rows.length?`${rows.length} anggota beraktivitas`:'Kamp berjalan tenang'}</b>
    {rows.map(r=><button key={r.bed} onClick={()=>onFollow(r.bed)} aria-label={`Ikuti ${r.name}: ${r.title}`}><span>{r.name}</span><small>{r.phase} · {r.title}</small></button>)}
    <small className="activity-footnote">{rows.length?'Klik nama untuk mengikuti.':'Anggota berjalan santai di kamp.'} Maks. 12 anggota tampil.</small>
   </aside>
  </>
 );
}
