import * as THREE from 'three';
import {reachHand,type AvatarRig} from './avatar-model';
import {animateActivity,type ActivityKit} from './activity-animation';
import type {RestState} from './rest-motion';
type Stowed={node:THREE.Object3D;visible:boolean};
const looseGear=/topi|helm|tudung|baret|jerami|caping|mahkota|pelindung pipi|tas herbal|ransel|gulungan alas|sayap|sarung pedang|pegangan pedang|gagang pedang|^Mata putih$|^Pupil$|^Kilau mata$/i;
export function animateRest(rig:AvatarRig,kit:ActivityKit,state:RestState,time:number,reduced:boolean,moving:boolean,climbing:boolean){
 animateActivity(rig,kit,time,undefined,0,reduced,moving,false);
 const lying=['settle','sleep','rise'].includes(state.phase),root=rig.root;
 if(!root.userData.sleepEyes){const eyes=new THREE.Group();eyes.name='Mata tidur';for(const side of [-1,1]){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*.11-.045,.02,.266),new THREE.Vector3(side*.11,-.005,.271),new THREE.Vector3(side*.11+.045,.02,.266)]),new THREE.LineBasicMaterial({color:'#49372e'}));eyes.add(line);}rig.head.add(eyes);root.userData.sleepEyes=eyes;}
 root.userData.sleepEyes.visible=lying;
 if(lying&&!root.userData.stowed){const items:Stowed[]=[];root.traverse(node=>{if(node===rig.cape||looseGear.test(node.name))items.push({node,visible:node.visible});});root.userData.stowed=items;}
 if(lying){for(const item of (root.userData.stowed??[]) as Stowed[])item.node.visible=false;for(const tool of kit.tools)tool.node.visible=false;rig.head.rotation.set(0,0,0);reachHand(rig,-1,new THREE.Vector3(-.13,1.10,.35));reachHand(rig,1,new THREE.Vector3(.13,1.10,.35));rig.leftLeg.rotation.x=rig.rightLeg.rotation.x=.28;}
 else{restoreRestGear(root);if(climbing){for(const tool of kit.tools)tool.node.visible=false;reachHand(rig,-1,new THREE.Vector3(-.52,.84,.12));reachHand(rig,1,new THREE.Vector3(.52,.84,.12));}}
}
export function restoreRestGear(root:THREE.Object3D){for(const item of (root.userData.stowed??[]) as Stowed[])item.node.visible=item.visible;root.userData.stowed=undefined;}
