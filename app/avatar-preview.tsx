'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import type {Gender} from './character-options';
import {DEFAULT_HAIR,DEFAULT_SKIN,type HairStyle,type SkinTone} from './appearance-options';
import {type Loadout} from './cosmetics';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createAvatar,animateAvatar,disposeAvatar} from './avatar-model';
export default function AvatarPreview({name,role,color,outfit,gender='laki-laki',hairStyle=DEFAULT_HAIR,skinTone=DEFAULT_SKIN}:{name:string;role:string;color:string;outfit?:Loadout;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone}){
 const el=useRef<HTMLDivElement>(null);
 useEffect(()=>{const mount=el.current!;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{mount.textContent='Preview 3D belum tersedia di perangkat ini.';return;}
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;mount.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#fff5db','#637966',2.6));const sun=new THREE.DirectionalLight('#fff1d1',3.5);sun.position.set(-3,5,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-3;sun.shadow.camera.right=3;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.02;scene.add(sun);const rim=new THREE.DirectionalLight('#c3d4bf',1.4);rim.position.set(3,2,-3);scene.add(rim);
 const rig=createAvatar({name:'Petualang',role,color,outfit,gender,hairStyle,skinTone,bed:''});rig.root.rotation.y=-.35;scene.add(rig.root);
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(.69,.72,.075,12),new THREE.MeshStandardMaterial({color:'#dce4cd',roughness:1}));floor.receiveShadow=true;floor.position.y=-.052;scene.add(floor);
 const camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(2.4,2.0,4.4);camera.lookAt(0,1.06,0);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.06,0);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.5;controls.maxPolarAngle=1.6;
 const bounds=new THREE.Box3().setFromObject(rig.root),size=bounds.getSize(new THREE.Vector3()),target=bounds.getCenter(new THREE.Vector3());target.y=Math.max(1.06,target.y);const direction=new THREE.Vector3(2.4,1.05,4.4).normalize();const resize=()=>{const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);renderer.setSize(width,height);camera.aspect=width/height;const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));const distance=Math.max(size.y/(2*tangent),size.x/(2*tangent*camera.aspect))*1.2;camera.position.copy(target).addScaledVector(direction,distance);controls.target.copy(target);camera.updateProjectionMatrix();controls.update();};const observer=new ResizeObserver(resize);observer.observe(mount);resize();
 let id=0;const clock=new THREE.Clock();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;function render(){animateAvatar(rig,clock.getElapsedTime(),false,reduced);controls.update();renderer.render(scene,camera);id=requestAnimationFrame(render);}render();
 return()=>{cancelAnimationFrame(id);observer.disconnect();controls.dispose();disposeAvatar(scene);renderer.dispose();renderer.forceContextLoss();mount.replaceChildren();};
 },[role,color,outfit,gender,hairStyle,skinTone]);
 return <div className="avatar-preview" role="img" aria-label={`${name}, karakter 3D ${role} dengan perlengkapan sesuai peran`}><div ref={el} className="avatar-render"/><span className="avatar-hint">Geser untuk melihat perlengkapan</span></div>;
}
