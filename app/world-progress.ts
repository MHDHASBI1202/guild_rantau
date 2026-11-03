import {ROLE_OPTIONS} from './role-options';
export const IMPACTS=[
 {key:'wood',name:'Persediaan kayu',object:'Tumpukan kayu',description:'Kayu tersusun di area persediaan.',color:'#a78359'},
 {key:'herbs',name:'Obat kamp',object:'Rak ramuan',description:'Rak ramuan bertambah terisi.',color:'#81a088'},
 {key:'defense',name:'Pertahanan',object:'Pagar penjagaan',description:'Pagar penjagaan makin lengkap.',color:'#8798ae'},
 {key:'comfort',name:'Kenyamanan',object:'Tempat istirahat',description:'Area istirahat bertambah nyaman.',color:'#c8a979'},
 {key:'exploration',name:'Jalur ditemukan',object:'Penanda jalur',description:'Penanda baru muncul di jalur perjalanan.',color:'#a5ac7b'},
 {key:'craft',name:'Hasil kerajinan',object:'Bengkel perajin',description:'Bengkel dan peti karya bertambah lengkap.',color:'#bd946d'},
 {key:'farm',name:'Pertumbuhan kebun',object:'Kebun kamp',description:'Petak kebun dan tunas tumbuh.',color:'#92ac6b'},
 {key:'magic',name:'Energi pelindung',object:'Kristal pelindung',description:'Kristal pelindung menerangi tepi kamp.',color:'#ad9acb'},
] as const;
export type ImpactKey=typeof IMPACTS[number]['key'];
export const STATIONS:Record<ImpactKey,{position:[number,number];dock:[number,number]}>= {
 wood:{position:[-10,7],dock:[-8,6.8]},herbs:{position:[-11,2.5],dock:[-9,2.5]},
 defense:{position:[9,9.5],dock:[8.5,8]},comfort:{position:[-5,11],dock:[-5,9.5]},
 exploration:{position:[6,13],dock:[6,11]},craft:{position:[11,2.5],dock:[9.2,2.5]},
 farm:{position:[-12,-5],dock:[-9.5,-4.2]},magic:{position:[11,-4.5],dock:[9,-4]},
};
export const WORK_HEIGHT=.82,WORK_REACH=.70;
/** Shared furniture and actor frame: both workers face the same work surface. */
export function stationFrame(key:ImpactKey,slot=0){
 const s=STATIONS[key],dx=s.position[0]-s.dock[0],dz=s.position[1]-s.dock[1],length=Math.hypot(dx,dz),x=dx/length,z=dz/length;
 const dock:[number,number]=[s.dock[0]-z*slot*.95,s.dock[1]+x*slot*.95];
 return {dock,yaw:Math.atan2(x,z),surface:[dock[0]+x*WORK_REACH,dock[1]+z*WORK_REACH] as [number,number]};
}
export type WorldProgress=Record<ImpactKey,number>&{updatedAt:number};
export const EMPTY_WORLD:WorldProgress={wood:0,herbs:0,defense:0,comfort:0,exploration:0,craft:0,farm:0,magic:0,updatedAt:0};
export const ACTIVITIES=[
 {id:'wood',title:'Cari kayu',activity:'Mengumpulkan kayu',xp:12,wood:1,herbs:0,impact:'wood'},
 {id:'herbs',title:'Cari daun obat',activity:'Meramu di tepi hutan',xp:12,wood:0,herbs:1,impact:'herbs'},
 {id:'guard',title:'Jaga menara',activity:'Menjaga kamp bersama Aru',xp:15,wood:0,herbs:0,impact:'defense'},
 {id:'rest',title:'Rawat tempat istirahat',activity:'Beristirahat dan merapikan ranjang',xp:5,wood:0,herbs:0,impact:'comfort'},
 {id:'explore',title:'Petakan jalur',activity:'Memetakan jalur perjalanan',xp:12,wood:0,herbs:0,impact:'exploration'},
 {id:'build',title:'Berkarya di bengkel',activity:'Membuat perlengkapan kamp',xp:12,wood:0,herbs:0,impact:'craft'},
 {id:'plant',title:'Rawat kebun',activity:'Menanam dan merawat kebun',xp:12,wood:0,herbs:0,impact:'farm'},
 {id:'ward',title:'Isi kristal pelindung',activity:'Menguatkan pelindung sihir',xp:12,wood:0,herbs:0,impact:'magic'},
] as const;
export function activityReward(action:string,role:string){const a=ACTIVITIES.find(a=>a.id===action);if(!a)return null;const specialist=ROLE_OPTIONS.find(r=>r.name===role)?.specialty===action;return {...a,xp:a.xp+(specialist?3:0),amount:specialist?2:1};}
export function visualCount(value:number){return Math.min(6,Math.max(0,Math.floor(value)));}
export type WorldEvent={id:string;action:string;role:string;amount:number;createdAt:number};
