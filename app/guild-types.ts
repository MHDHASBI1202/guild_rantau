import type {HairStyle,SkinTone} from './appearance-options';
import type {Gender} from './character-options';
import type {Loadout,WardrobeState} from './cosmetics';
import type {WorldProgress,WorldEvent} from './world-progress';
export type GuildMember={name:string;role:string;color:string;gender?:Gender|null;hairStyle?:HairStyle;skinTone?:SkinTone;xp:number;wood?:number;herbs?:number;lastAction?:number;activity:string;joinedAt:number;bed:string;outfit?:Loadout;wardrobe?:WardrobeState;tickets?:number;highestLevel?:number;spinsUsed?:number;recentSpins?:{id:string;itemKey:string;createdAt:number}[]};
export type GuildData={signedIn:boolean;me:GuildMember|null;members:GuildMember[];total:number;reward?:string;spinId?:string;world?:WorldProgress;worldEvents?:WorldEvent[];impact?:{key:string;amount:number;message:string}};
