import * as THREE from 'three';
import {animateAvatar,type AvatarRig} from './avatar-model';
import type {ACTIVITIES} from './world-progress';
export type ActivityId=typeof ACTIVITIES[number]['id'];
const toolNames=new Set(['Palu perajin','Penyiram tanaman','Tongkat sihir','Ikatan herbal','Peta tergulung','Batang peta','Perisai penjaga']);
export function createActivityKit(rig:AvatarRig){
 const root=new THREE.Group();root.name='Peralatan aktivitas';rig.root.add(root);
 const items=new Map<ActivityId,THREE.Group>(),tools:{node:THREE.Object3D;visible:boolean}[]=[];
 rig.root.traverse(o=>{if(toolNames.has(o.name))tools.push({node:o,visible:o.visible});});
 const material=(color:string,glow=false)=>new THREE.MeshStandardMaterial({color,flatShading:true,roughness:.8,emissive:glow?color:'#000000',emissiveIntensity:glow?.6:0});
 const box=(g:THREE.Group,size:[number,number,number],p:[number,number,number],c:string)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material(c));m.position.set(...p);m.castShadow=true;g.add(m);return m;};
 const item=(id:ActivityId,x=0,y=.95,z=.5)=>{const g=new THREE.Group();g.name='task-'+id;g.position.set(x,y,z);items.set(id,g);root.add(g);return g;};
 const wood=item('wood');const log=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.55,7),material('#b78b5e'));log.rotation.z=Math.PI/2;wood.add(log);
 const herbs=item('herbs',.32);const vial=new THREE.Mesh(new THREE.CylinderGeometry(.05,.065,.18,7),material('#8bb99a'));herbs.add(vial);box(herbs,[.06,.035,.06],[0,.1,0],'#977553');
 const guard=item('guard',.32,.83,.4);box(guard,[.13,.19,.13],[0,0,0],'#a98a58');const light=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),material('#ffd993',true));light.position.z=.075;guard.add(light);
 const rest=item('rest',0,.8);box(rest,[.46,.08,.28],[0,0,0],'#c9b58f');box(rest,[.4,.014,.06],[0,.05,0],'#a99f7f');
 const explore=item('explore');box(explore,[.44,.018,.29],[0,0,0],'#eadfba');box(explore,[.30,.008,.013],[0,.014,0],'#a1ad88');box(explore,[.012,.008,.20],[-.05,.014,0],'#a1ad88');explore.rotation.x=.2;
 const build=item('build',.33,1.0,.46);box(build,[.038,.29,.038],[0,0,0],'#8c6948');box(build,[.20,.10,.10],[0,.15,0],'#aebbb6');
 const plant=item('plant',.35,.95);box(plant,[.18,.18,.17],[0,0,0],'#8aab9c');const spout=box(plant,[.05,.05,.18],[0,.05,.15],'#a4bcb0');spout.rotation.x=-.3;
 const ward=item('ward',0,1.16,.55);const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.11,0),material('#b5c4f1',true));ward.add(orb);
 const particles=new THREE.Group();particles.name='Efek aktivitas';root.add(particles);for(let i=0;i<10;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),new THREE.MeshBasicMaterial({color:'#98cbda',transparent:true,opacity:.8}));particles.add(p);}
 root.visible=false;return {root,items,tools,particles};
}
export type ActivityKit=ReturnType<typeof createActivityKit>;
export function animateActivity(rig:AvatarRig,kit:ActivityKit,time:number,activity:ActivityId|undefined,workTime:number,reduced=false){
 animateAvatar(rig,time,!activity,reduced);rig.leftArm.rotation.z=rig.rightArm.rotation.z=0;
 kit.root.visible=!!activity;for(const {node,visible} of kit.tools)node.visible=visible&&(!activity||(activity==='guard'&&node.name==='Perisai penjaga'));
 for(const [id,g] of kit.items)g.visible=id===activity;
 if(!activity)return;
 const t=reduced?0:time,s=Math.sin(t*3),strength=reduced?0:Math.min(1,workTime/.35);
 rig.leftLeg.rotation.x=rig.rightLeg.rotation.x=0;rig.head.rotation.y=0;rig.head.rotation.z=0;
 const baseline=activity==='guard'?-.18:activity==='rest'?-.38:-.65;
 const blend=reduced?1:Math.min(1,workTime/.35);rig.leftArm.rotation.x=THREE.MathUtils.lerp(rig.leftArm.rotation.x,baseline-(activity==='build'?.02:.05*s*strength),blend);rig.rightArm.rotation.x=THREE.MathUtils.lerp(rig.rightArm.rotation.x,baseline-.12-(activity==='build'?.22*Math.sin(t*5):.08*s)*strength,blend);
 if(activity==='ward'){rig.leftArm.rotation.z=.22;rig.rightArm.rotation.z=-.22;}
 const held=kit.items.get(activity)!;held.position.y=(activity==='guard'?.83:activity==='rest'?.8:activity==='ward'?1.16:activity==='build'?1:.95)+(reduced?0:.02*s);
 held.rotation.z=activity==='plant'?-.15:0;held.rotation.x=activity==='build'?.20*Math.sin(t*5)*strength:activity==='plant'?.25:activity==='explore'?.2:0;
 kit.particles.visible=['plant','ward','herbs','build'].includes(activity);
 kit.particles.children.forEach((p,i)=>{const u=reduced?i/10:(t*.7+i/10)%1;const mat=(p as THREE.Mesh).material as THREE.MeshBasicMaterial;
  if(activity==='plant'){p.position.set(.35+Math.sin(i*2)*.04,.99-u*.9,.68+u*.5);mat.color.set('#9dcbd2');}
  else if(activity==='ward'){p.position.set(Math.sin(t*2+i)*.1,1.16-u*.55,.55+u*1.12);mat.color.set('#bcc6f0');}
  else if(activity==='build'){p.position.set(.33+Math.sin(i)*u*.16,1.14-u*.2,.52+u*.25);mat.color.set('#dbbc83');}
  else{const angle=t*1.2+i*Math.PI*.2;p.position.set(Math.cos(angle)*.23,1.05+u*.3,.55+Math.sin(angle)*.17);mat.color.set('#9fc48d');}
  mat.opacity=reduced?.65:(1-u)*.8;
 });
}
