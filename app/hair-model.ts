import * as THREE from 'three';
import type {HairStyle} from './appearance-options';
export function createHair({style,role,hat,color,glasses}:{style:HairStyle;role:string;hat:string;color:string;glasses:boolean}){
 const group=new THREE.Group();group.name='Gaya rambut '+style;
 const helmet=hat==='peran'&&role==='Penjaga',hood=hat==='peran'&&role==='Peramu';
 const brim=hat==='jerami'||hat==='caping'||(hat==='peran'&&!helmet&&!hood),beret=hat==='baret',crown=hat==='kristal'||hat==='mahkota';
 const mode=helmet?'helmet':hood?'hood':brim?'brim':beret?'beret':crown?'crown':'open';
 group.userData.hairFit=mode;group.userData.hairStyle=style;
 if(style==='gundul')return group;
 const material=new THREE.MeshStandardMaterial({color,flatShading:true,roughness:.94,side:THREE.DoubleSide});
 const add=(geometry:THREE.BufferGeometry,name:string)=>{const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.userData.hairPart=true;group.add(mesh);return mesh;};
 const surface=(points:number[],indices:number[],name:string)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();return add(geo,name);};
 const covered=helmet||hood||brim||beret;
 if(!covered){
  const positions:number[]=[],indices:number[]=[],columns=24,rows=8;
  for(let row=0;row<=rows;row++)for(let i=0;i<=columns;i++){
   const phi=i/columns*Math.PI*2,u=row/rows,front=Math.max(0,Math.cos(phi)),back=Math.max(0,-Math.cos(phi));
   const swept=style!=='pendek';const edgeY=swept?.10+.115*front*front:.09+.065*front-.10*back*back;
   const theta=Math.acos(edgeY/.316)*u,volume=style==='pendek'?1:.99+.025*Math.sin(phi+.6)*Math.sin(u*Math.PI);
   positions.push(.289*Math.sin(theta)*Math.sin(phi)*volume,.316*Math.cos(theta),.277*Math.sin(theta)*Math.cos(phi)-.012);
  }
  for(let row=0;row<rows;row++)for(let i=0;i<columns;i++){const n=row*(columns+1)+i;indices.push(n,n+columns+1,n+1,n+1,n+columns+1,n+columns+2);}
  surface(positions,indices,'Rambut puncak');
 }
 if(style!=='pendek'&&!helmet&&!hood){
  const positions:number[]=[],indices:number[]=[];const fitted=brim||beret;
  for(let row=0;row<2;row++)for(let i=0;i<=16;i++){
   const u=i/16,x=-.225+.45*u;let y=row===0?(fitted?.154+.004*Math.sin(u*Math.PI):.20+.035*Math.sin(u*Math.PI)+.02*(u-.5)):(fitted?.116+.021*u:.14-.07*(1-u)**2);
   if(glasses&&row===1)y=Math.max(.118,y+.008);
   y=Math.min(y,.3*Math.sqrt(Math.max(0,1-(x/.276)**2))-.007);
   positions.push(x,y,.255*Math.sqrt(Math.max(0,1-(x/.276)**2-(y/.3)**2))+.020);
  }
  for(let i=0;i<16;i++)indices.push(i,17+i,i+1,i+1,17+i,18+i);
  surface(positions,indices,'Poni menyamping');
 }
 if(['bob','panjang','sebahu','gelombang'].includes(style)&&!hood){
  const long=style!=='bob',wavy=style==='gelombang',shoulder=style==='sebahu';
  const top=helmet?.095:brim||beret?.153:crown?.085:.13,levels=long?[top,.055,-.025,-.10,-.22,-.36,-.53,-.70,-.76]:[top,.055,-.025,-.10,-.17,-.205];
  const radii=long?[[brim||beret?.252:.265,.245],[.288,.269],[.293,.274],[.30,.28],[.32,.31],[.35,.37],[.34,.40],[.31,.39],[.29,.37]]:[[brim||beret?.252:.265,.245],[.288,.269],[.293,.274],[.281,.260],[.262,.241],[.242,.220]];
  const columns=16,start=helmet?Math.PI*.66:Math.PI*.30,end=helmet?Math.PI*1.34:Math.PI*1.70;
  const points:number[]=[],indices:number[]=[];
  for(let row=0;row<levels.length;row++)for(let i=0;i<=columns;i++){
   const edge=long?Math.max(helmet?.66:.30,[.30,.30,.30,.33,.60,.75,.75,.75,.75][row])*Math.PI:start;
   const angle=edge+((long?Math.PI*2-edge:end)-edge)*i/columns;
   const wave=wavy&&row>2?Math.sin(row*1.7+i*.8)*.018:0;
   const y=levels[row]*(shoulder&&row>2?.67:1);
   let z=Math.cos(angle)*(radii[row][1]+wave)-(long?.035:.015)+Math.max(0,Math.cos(angle))*.045;
   // Lay the lengths outside the cape rather than sandwiching them under it.
   if(long&&y<-.22){const blend=Math.min(1,(-y-.22)/.14);z=THREE.MathUtils.lerp(z,Math.min(z,-.455+Math.sin(angle*3)*.009),blend);}
   points.push(Math.sin(angle)*(radii[row][0]+wave),y+(row===levels.length-1?.023*Math.abs(Math.sin(angle)):0),z);
  }
  for(let row=0;row<levels.length-1;row++)for(let i=0;i<columns;i++){const n=row*(columns+1)+i;indices.push(n,n+columns+1,n+1,n+1,n+columns+1,n+columns+2);}
  surface(points,indices,long?'Rambut terurai '+style:'Bob berlapis');
 }else if(!helmet&&!hood){
  for(const side of [-1,1]){const piece=add(new THREE.BoxGeometry(.025,.08,.05),'Rambut pelipis');piece.position.set(side*.275,crown?.025:.075,-.13);}
 }
 if((style==='ekor-panjang'||style==='kepang')&&!hood){
  const braid=style==='kepang',rows=braid?20:13,segments=10,points:number[]=[],indices:number[]=[];
  for(let row=0;row<=rows;row++){
   const t=row/rows,y=-.045-t*.72,z=-.32-Math.sin(Math.min(1,t*2)*Math.PI/2)*.15;
   const radius=(braid?.059:.085)*(1-t*.65)*(braid?1+Math.sin(t*Math.PI*12)*.13:1);
   const x=braid?Math.sin(t*Math.PI*12)*.014:Math.sin(t*Math.PI)*.02;
   for(let i=0;i<=segments;i++){const angle=i/segments*Math.PI*2;points.push(x+Math.cos(angle)*radius,y,z+Math.sin(angle)*radius*.60);}
  }
  for(let row=0;row<rows;row++)for(let i=0;i<segments;i++){const n=row*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
  surface(points,indices,braid?'Kepang panjang':'Ekor kuda panjang');
  const tie=new THREE.Mesh(new THREE.TorusGeometry(braid?.026:.063,.009,4,10),new THREE.MeshStandardMaterial({color:'#b38b58',roughness:1}));
  tie.name='Ikat rambut panjang';tie.rotation.x=Math.PI/2;tie.position.set(0,braid?-.72:-.06,braid?-.47:-.325);tie.userData.hairPart=true;group.add(tie);
 }
 if(style==='kuncir'&&!hood){
  const rows=[[0,-.305,.045],[-.055,-.335,.066],[-.135,-.35,.043],[-.205,-.34,.008]],points:number[]=[],indices:number[]=[],segments=8;
  for(const [y,z,r] of rows)for(let i=0;i<=segments;i++){const angle=i/segments*Math.PI*2;points.push(Math.cos(angle)*r,y,z+Math.sin(angle)*r*.7);}
  for(let row=0;row<rows.length-1;row++)for(let i=0;i<segments;i++){const n=row*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
  surface(points,indices,'Kuncir rendah');const tieMaterial=new THREE.MeshStandardMaterial({color:'#9d7954',roughness:1});const tie=new THREE.Mesh(new THREE.TorusGeometry(.044,.009,4,10),tieMaterial);tie.name='Ikat kuncir';tie.rotation.x=Math.PI/2;tie.position.set(0,-.014,-.315);tie.userData.hairPart=true;group.add(tie);
 }
 return group;
}
