'use client';
import {createCampEnvironment} from './camp-environment';
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
export default function World({night,focus,onSelect,onFollow,residents,world=EMPTY_WORLD}:{night:boolean;focus:string;onSelect:(v:string)=>void;onFollow:(bed:string)=>void;world?:WorldProgress;residents:{name:string;role:string;color:string;activity:string;lastAction?:number;bed:string;outfit?:Loadout;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone}[]}){
 const follow=useRef<string|null>(null);
 const [rows,setRows]=useState<{bed:string;name:string;title:string;phase:string}[]>([]);
 const previousWorld=useRef(EMPTY_WORLD);const pulse=useRef<{mesh:THREE.Mesh;started:number}|null>(null);const environment=useRef(new THREE.Group());const citizens=useRef(new THREE.Group());const mount=useRef<HTMLDivElement>(null);const select=useRef(onSelect);select.current=onSelect;
 const state=useRef<{scene:THREE.Scene;sun:THREE.DirectionalLight;hemi:THREE.HemisphereLight;camera:THREE.PerspectiveCamera;controls:OrbitControls}|null>(null);
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
 for(let i=0;i<35;i++){const angle=random()*Math.PI*2,r=11+random()*7;const x=Math.cos(angle)*r,z=Math.sin(angle)*r;if(Math.abs(x)<4)continue;const h=2+random()*3.5;const tree=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.23,h*.45,5),mat('#7f7157'));trunk.position.y=h*.2;tree.add(trunk);for(let j=0;j<3;j++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(h*(.28-j*.045),h*.55,5),mat(['#708c72','#849b77','#5a7b68'][j]));leaf.position.y=h*(.45+j*.19);leaf.castShadow=true;tree.add(leaf);}tree.position.set(x,-.1,z);tree.userData.forest=true;tree.updateMatrixWorld(true);tree.userData.occlusionBox=new THREE.Box3().setFromObject(tree).expandByScalar(.3);scene.add(tree);}
 let rumu:THREE.Group|undefined;let dead=false;
 new GLTFLoader().load('/assets/rumu.glb',g=>{if(dead)return;rumu=g.scene;const box=new THREE.Box3().setFromObject(rumu);const size=box.getSize(new THREE.Vector3());const scale=12/Math.max(size.x,size.z);rumu.scale.setScalar(scale);const box2=new THREE.Box3().setFromObject(rumu);const c=box2.getCenter(new THREE.Vector3());rumu.position.set(-c.x,-box2.min.y,-c.z);rumu.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(rumu);},undefined,()=>{el.dataset.error='true';});
 const fireflies=new THREE.Group();for(let i=0;i<22;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.045,4,4),new THREE.MeshBasicMaterial({color:'#ffe5a0'}));f.position.set((random()-.5)*22,1+random()*6,(random()-.5)*22);fireflies.add(f);}scene.add(fireflies);
 state.current={scene,sun,hemi,camera,controls};
 const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
 let startX=0,startY=0;const down=(e:PointerEvent)=>{follow.current=null;startX=e.clientX;startY=e.clientY;};const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-startX,e.clientY-startY)>7)return;const rect=el.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObject(citizens.current,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.bed)o=o.parent;if(o.userData.bed)select.current('resident:'+o.userData.bed);}else if(rumu&&ray.intersectObject(rumu,true).length)select.current('rumu');};const manualZoom=()=>{follow.current=null;};renderer.domElement.addEventListener('wheel',manualZoom,{passive:true});renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
 const clock=new THREE.Clock();let id=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotate=!reduced;
 let reportedAt=0;
 const animate=()=>{const dt=clock.getDelta(),t=clock.elapsedTime,now=Date.now();if(rumu&&!reduced)rumu.position.y+=Math.sin(t*1.6)*.0009;
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
 if(pulse.current){const age=(performance.now()-pulse.current.started)/1600;const p=pulse.current.mesh;p.visible=age<1;p.scale.setScalar(.7+Math.min(1,age)*1.5);(p.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age); }fireflies.rotation.y=reduced?0:t*.016;controls.update();renderer.render(scene,camera);id=requestAnimationFrame(animate);};animate();
 return()=>{dead=true;cancelAnimationFrame(id);observer.disconnect();controls.dispose();disposeAvatar(scene);renderer.dispose();el.replaceChildren();state.current=null;};
 },[]);
 useEffect(()=>{const s=state.current;if(!s)return;s.scene.fog=new THREE.FogExp2(night?'#344858':'#dce3ce',.012);s.hemi.intensity=night?1.2:2.4;s.sun.intensity=night?.6:3.4;s.sun.color.set(night?'#a4b9e0':'#fff0cb');},[night]);
 useEffect(()=>{const s=state.current;if(!s)return;s.controls.autoRotate=focus==='world'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;follow.current=focus.startsWith('activity:')?focus.split(':')[1]:null;if(focus.startsWith('activity:')){/* Smooth following is applied by the render loop. */}else if(focus==='camp'){s.camera.position.set(10,14,14);s.controls.target.set(0,4,0);}else{s.camera.position.set(19,14,23);s.controls.target.set(0,3,0);}s.controls.update();},[focus]);
 useEffect(()=>{const group=citizens.current,visible=residents.slice(0,12),beds=new Set(visible.map(r=>r.bed));for(const child of [...group.children])if(!beds.has(child.userData.bed)){disposeAvatar(child);group.remove(child);}
 visible.forEach((r,i)=>{const signature=JSON.stringify([r.role,r.color,r.gender,r.hairStyle,r.skinTone,r.outfit]);let existing=group.children.find(o=>o.userData.bed===r.bed);
 if(existing&&existing.userData.appearance!==signature){const previous=existing;existing=undefined;group.remove(previous);disposeAvatar(previous);}
 if(!existing){const rig=createAvatar(r),angle=i*Math.PI*2/visible.length,[x,z]=ringPoint(angle);rig.root.position.set(x,.015,z);rig.root.userData.motion=createMotion(angle);rig.root.userData.activityKit=createActivityKit(rig);rig.root.userData.appearance=signature;group.add(rig.root);existing=rig.root;}
 existing.userData.resident=r;
 });},[residents]);
 useEffect(()=>{const g=environment.current;while(g.children.length){const child=g.children[0];disposeAvatar(child);g.remove(child);}const camp=createCampEnvironment(world);g.add(camp);pulse.current=null;
 const changed=IMPACTS.find(i=>world[i.key]>previousWorld.current[i.key]);
 if(changed&&previousWorld.current.updatedAt&& !matchMedia('(prefers-reduced-motion: reduce)').matches){const target=camp.getObjectByName('camp-'+changed.key);if(target){const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.75,24),new THREE.MeshBasicMaterial({color:changed.color,transparent:true,opacity:1,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(target.position);ring.position.y=.04;g.add(ring);pulse.current={mesh:ring,started:performance.now()};}}
 previousWorld.current=world;},[world]);
 return <><div ref={mount} className="world-canvas" role="img" aria-label="Dunia 3D Rumu. Geser untuk memutar, cubit untuk memperbesar."/><aside className="world-activity" aria-label="Aktivitas anggota di dunia"><b>{rows.length?`${rows.length} anggota beraktivitas`:'Kamp berjalan tenang'}</b>{rows.map(r=><button key={r.bed} onClick={()=>onFollow(r.bed)} aria-label={`Ikuti ${r.name}: ${r.title}`}><span>{r.name}</span><small>{r.phase} · {r.title}</small></button>)}<small className="activity-footnote">{rows.length?'Klik nama untuk mengikuti.':'Anggota berjalan santai di kamp.'} Maks. 12 anggota tampil.</small></aside></>;
}
