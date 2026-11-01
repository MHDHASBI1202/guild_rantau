import './creation.css';
import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {getChatGPTUser} from '../chatgpt-auth';
import CharacterCreation from '../character-creation';

export default async function Customization(){
 const user=await getChatGPTUser();
 if(!user)redirect('/masuk?return_to=/kustomisasi');
 const member=await env.DB!.prepare('SELECT id FROM members WHERE id=?').bind(user.userId).first();
 if(member)redirect('/');
 return <CharacterCreation/>;
}
