import * as THREE from 'three';
import {animateAvatar,reachHand,type AvatarRig} from './avatar-model';
import type {ACTIVITIES} from './world-progress';
export type ActivityId=typeof ACTIVITIES[number]['id'];
const toolNames=new Set(['Palu perajin','Penyiram tanaman','Tongkat sihir','Ikatan herbal','Peta tergulung','Batang peta','Perisai penjaga']);
export function createActivityKit(rig:AvatarRig){
 const root=new THREE.Group();root.name='Peralatan aktivitas';rig.root.add(root);
 const items=new Map<ActivityId,THREE.Group>(),tools:{node:THREE.Object3D;visible:boolean}[]=[];
 rig.root.traverse(o=>{if(toolNames.has(o.name))tools.push({node:o,visible:o.visible});});
 const material=(color:string)=>new THREE.MeshStandardMaterial({color,flatShading:true,roughness:.8});
 const box=(g:THREE.Group,size:[number,number,number],p:[number,number,number],c:string)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material(c));m.position.set(...p);m.castShadow=true;g.add(m);return m;};
 const item=(id:ActivityId,hand=rig.rightHand)=>{const g=new THREE.Group();g.name='task-'+id;g.visible=false;hand.add(g);items.set(id,g);return g;};
 const wood=item('wood');const log=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.48,8),material('#b78b5e'));log.rotation.z=Math.PI/2;log.position.x=-.21;wood.add(log);
 const herbs=item('herbs');const vial=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.15,8),material('#8bb99a'));vial.position.y=.015;herbs.add(vial);box(herbs,[.055,.035,.055],[0,.105,0],'#977553');
 const guard=item('guard');box(guard,[.12,.16,.12],[0,-.16,0],'#a98a58');const handle=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,5,12,Math.PI),material('#a98a58'));handle.position.y=-.055;guard.add(handle);const light=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshStandardMaterial({color:'#ffd993',emissive:'#ffcc66',emissiveIntensity:.7}));light.position.set(0,-.16,.064);guard.add(light);
 const rest=item('rest');box(rest,[.30,.035,.22],[-.12,0,0],'#c9b58f');box(rest,[.29,.008,.025],[-.12,.022,.03],'#a99f7f');
 const explore=item('explore',rig.leftHand);box(explore,[.46,.012,.29],[.22,0,.02],'#eadfba');box(explore,[.30,.006,.012],[.22,.01,.02],'#a1ad88');box(explore,[.012,.006,.20],[.17,.01,.02],'#a1ad88');
 const build=item('build');box(build,[.04,.33,.04],[0,.04,0],'#8c6948');box(build,[.20,.10,.10],[0,.23,0],'#aebbb6');
 const plant=item('plant');const can=new THREE.Mesh(new THREE.CylinderGeometry(.10,.12,.18,9),material('#8aab9c'));can.position.set(0,-.15,.02);plant.add(can);const arch=new THREE.Mesh(new THREE.TorusGeometry(.10,.016,5,12,Math.PI),material('#8aab9c'));arch.rotation.y=Math.PI/2;arch.position.y=-.06;plant.add(arch);const spout=box(plant,[.045,.045,.18],[0,-.10,.18],'#a4bcb0');spout.rotation.x=-.25;
 const ward=item('ward');box(ward,[.035,.27,.035],[0,.07,0],'#785640');const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.065,0),material('#b5c4f1'));crystal.position.y=.245;ward.add(crystal);
 const particles=new THREE.Group();particles.name='Efek aktivitas';root.add(particles);for(let i=0;i<10;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.018,5,4),new THREE.MeshBasicMaterial({color:'#98cbda',transparent:true,opacity:.8}));particles.add(p);}
 root.visible=false;
 return {root,items,tools,particles,lastTime:0,release:0,lastPose:[] as THREE.Quaternion[],origin:new THREE.Vector3()};
}
export type ActivityKit=ReturnType<typeof createActivityKit>;
export function animateActivity(rig:AvatarRig,kit:ActivityKit,time:number,activity:ActivityId|undefined,workTime:number,reduced=false,moving=true,working=true){
 const joints=[rig.leftArm,rig.rightArm,rig.leftForearm,rig.rightForearm,rig.leftHand,rig.rightHand];
 const dt=Math.max(0,Math.min(.1,time-kit.lastTime));kit.lastTime=time;
 animateAvatar(rig,time,!activity&&moving,reduced);
 kit.root.visible=!!activity;for(const {node,visible} of kit.tools)node.visible=visible&&(!activity||(activity==='guard'&&node.name==='Perisai penjaga'));
 for(const [id,g] of kit.items)g.visible=id===activity;
 if(!activity){kit.release=Math.max(0,kit.release-dt/.3);if(kit.release&&!reduced)joints.forEach((joint,i)=>{if(kit.lastPose[i])joint.quaternion.slerp(kit.lastPose[i],kit.release);});return;}
 const t=reduced?0:workTime,s=Math.sin(t*2.2),blend=reduced?1:THREE.MathUtils.smoothstep(workTime,0,.40);
 rig.leftLeg.rotation.x=rig.rightLeg.rotation.x=0;rig.head.rotation.y=activity==='guard'?(reduced?0:Math.sin(t*.65)*(rig.root.userData.longHair?.025:.20)):0;rig.head.rotation.z=0;rig.head.rotation.x=activity==='guard'?0:(rig.root.userData.longHair?.015:.08)*blend;
 const left=new THREE.Vector3(-.22,1.05,.42),right=new THREE.Vector3(.22,1.05,.42),held=kit.items.get(activity)!;held.position.set(0,0,0);held.rotation.set(0,0,0);
 if(activity==='wood'){left.set(-.21,.99+s*.025,.43);right.set(.21,.99+s*.025,.43);}
 if(activity==='herbs'){left.set(-.21,1.02,.43);right.set(.21,1.10+s*.025,.44);held.rotation.z=s*.12;}
 if(activity==='guard'){left.set(-.30,.78,.11);right.set(.30,.90,.25);}
 if(activity==='rest'){left.set(-.24,.99,.43);right.set(.12,.99+s*.025,.44);held.rotation.z=s*.06;}
 if(activity==='explore'){left.set(-.22,1.09,.40);right.set(.22,1.09,.40);}
 if(activity==='build'){
  // Raise, strike, hold at contact, then recover. The head meets the workpiece.
  const phase=(t%1.35)/1.35,hit=phase<.58?THREE.MathUtils.smoothstep(phase,.30,.58):1-THREE.MathUtils.smoothstep(phase,.72,1);
  right.set(.20,THREE.MathUtils.lerp(1.20,1.085,hit),THREE.MathUtils.lerp(.29,.44,hit));left.set(-.23,1.00,.43);held.rotation.x=THREE.MathUtils.lerp(.12,2.25,hit);
 }
 if(activity==='plant'){left.set(-.30,.82,.12);right.set(.22,1.04,.42);held.rotation.x=.45+(reduced?0:.04*s);}
 if(activity==='ward'){left.set(-.23,1.17,.38);right.set(.23,1.12,.43);held.rotation.x=.55;}
 if(!working){
  // Away from a station, inspect the tool rather than strike or pour into empty space.
  held.rotation.set(0,0,0);
  if(activity!=='explore'){left.set(-.25,1.02,.34);right.set(.25,1.04,.34);}
  if(activity==='guard')left.set(-.30,.78,.11);
 }
 reachHand(rig,-1,left,blend);reachHand(rig,1,right,blend);
 kit.release=1;kit.lastPose=joints.map(j=>j.quaternion.clone());
 // Effects originate at a held object, and end on its matching physical station.
 kit.particles.visible=working&&!reduced&&blend>.95&&['plant','ward','herbs','build'].includes(activity);
 rig.root.updateMatrixWorld(true);
 const tip=activity==='plant'?new THREE.Vector3(0,-.10,.27):activity==='build'?new THREE.Vector3(0,.23,0):activity==='ward'?new THREE.Vector3(0,.245,0):new THREE.Vector3(0,.10,0);
 kit.origin.copy(rig.root.worldToLocal(held.localToWorld(tip)));
 const strike=activity==='build'&&((t%1.35)/1.35)>.55&&((t%1.35)/1.35)<.70;
 if(activity==='build')kit.particles.visible=kit.particles.visible&&strike;
 kit.particles.children.forEach((p,i)=>{const u=(t*.85+i/10)%1,mat=(p as THREE.Mesh).material as THREE.MeshBasicMaterial;
  if(activity==='plant'){p.position.copy(kit.origin).lerp(new THREE.Vector3(kit.origin.x,.18,.70),u);p.position.y+=.035*Math.sin(u*Math.PI);mat.color.set('#9dcbd2');}
  else if(activity==='ward'){p.position.copy(kit.origin).lerp(new THREE.Vector3(0,.65,.70),u);p.position.x+=Math.sin(u*Math.PI)*Math.sin(t*2+i)*.04;mat.color.set('#bcc6f0');}
  else if(activity==='build'){p.position.copy(kit.origin);p.position.x+=Math.sin(i*2)*u*.13;p.position.z+=Math.cos(i*2)*u*.10;p.position.y+=Math.sin(u*Math.PI)*.10;mat.color.set('#dbbc83');}
  else{p.position.copy(kit.origin);p.position.x+=Math.cos(i*2+t)*.045;p.position.y+=u*.12;mat.color.set('#9fc48d');}
  mat.opacity=(1-u)*.7;
 });
}
