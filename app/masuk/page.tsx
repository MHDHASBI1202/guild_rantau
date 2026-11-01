'use client';
import '../auth.css';
import {useEffect,useRef,useState} from 'react';
import {Tent,ArrowLeft,ShieldCheck,LoaderCircle} from 'lucide-react';
type GoogleApi={accounts:{id:{initialize:(options:Record<string,unknown>)=>void;renderButton:(el:HTMLElement,options:Record<string,unknown>)=>void}}};
declare global{interface Window{google?:GoogleApi}}
let googleLoader:Promise<GoogleApi>|null=null;
function loadGoogle():Promise<GoogleApi>{
 if(window.google)return Promise.resolve(window.google);
 if(googleLoader)return googleLoader;
 googleLoader=new Promise<GoogleApi>((resolve,reject)=>{
  let script=document.querySelector<HTMLScriptElement>('script[data-guild-google]');
  if(!script){script=document.createElement('script');script.src='https://accounts.google.com/gsi/client?hl=id';script.async=true;script.dataset.guildGoogle='true';}
  const current=script;
  const clean=()=>{clearTimeout(timer);current.removeEventListener('load',loaded);current.removeEventListener('error',failed);};
  const failed=()=>{clean();current.remove();reject(Error('Tombol Google belum bisa dimuat. Periksa koneksi lalu coba lagi.'));};
  const loaded=()=>{if(!window.google){failed();return;}clean();resolve(window.google);};
  const timer=setTimeout(failed,15000);
  current.addEventListener('load',loaded,{once:true});current.addEventListener('error',failed,{once:true});
  if(!current.isConnected)document.head.appendChild(current);
 }).catch(error=>{googleLoader=null;throw error;});
 return googleLoader;
}
export default function SignIn(){
 const button=useRef<HTMLDivElement>(null),processing=useRef(false);
 const [message,setMessage]=useState('Menyiapkan login Google…'),[busy,setBusy]=useState(false),[local,setLocal]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let cancelled=false,observer:ResizeObserver|undefined;
  const controller=new AbortController();
  processing.current=false;setBusy(false);setError(false);setReady(false);setLocal(false);setMessage('Menyiapkan login Google…');
  button.current?.replaceChildren();
  async function init(){try{
   const response=await fetch('/api/auth/nonce',{cache:'no-store',signal:controller.signal});
   const config=await response.json() as {available?:boolean;local?:boolean;clientId?:string;nonce?:string};if(cancelled)return;
   if(config.local){setLocal(true);setMessage('Preview lokal memakai akun uji. Progres produksi tetap terpisah.');return;}
   if(!response.ok||!config.available||!config.clientId||!config.nonce)throw Error('Login Google belum tersedia. Coba lagi sebentar atau kembali ke dunia.');
   const google=await loadGoogle();if(cancelled||!button.current)return;
   google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,auto_select:false,button_auto_select:false,ux_mode:'popup',use_fedcm_for_button:false,callback:async(result:{credential:string})=>{
    if(cancelled||processing.current)return;processing.current=true;setBusy(true);setError(false);setMessage('Menyimpan sesi masukmu…');
    try{
     const r=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:result.credential}),signal:controller.signal});
     const data=await r.json() as {error?:string;hasCharacter?:boolean};if(!r.ok)throw Error(data.error??'Gagal masuk. Silakan coba lagi.');
     if(cancelled)return;
     if(data.hasCharacter===false){location.assign('/kustomisasi');return;}
     const value=new URLSearchParams(location.search).get('return_to')??'/';location.assign(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')?value:'/');
    }catch(e){if(cancelled)return;processing.current=false;setBusy(false);setError(true);setMessage(e instanceof Error?e.message:'Koneksi terputus. Silakan coba lagi.');}
   }});
   let lastWidth=0;
   const render=()=>{if(cancelled||!button.current)return;const width=Math.min(360,Math.floor(button.current.clientWidth));if(width<160||width===lastWidth)return;lastWidth=width;button.current.replaceChildren();google.accounts.id.renderButton(button.current,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width,locale:'id',click_listener:()=>setMessage('Pilih akun di jendela Google. Jika tertutup, tekan tombol lagi.')});};
   render();observer=new ResizeObserver(render);observer.observe(button.current);
   setReady(true);setMessage('Pilih akun Google untuk melanjutkan ke guild.');
  }catch(e){if(!cancelled){setError(true);setMessage(e instanceof Error?e.message:'Tidak dapat terhubung. Coba lagi.');}}}
  init();return()=>{cancelled=true;controller.abort();observer?.disconnect();};
 },[attempt]);
 return <main className="auth-page"><div className="auth-layout"><section className="auth-card">
  <a href="/" className="text-button"><ArrowLeft size={15}/>Kembali ke dunia</a>
  <div className="auth-brand"><span className="auth-brand-icon"><Tent size={29}/></span><div><b>GUILD RANTAU</b><small>Rumah kecil untuk petualangan besar.</small></div></div>
  <h1>Petualanganmu<br/><em>menunggu di Rumu.</em></h1>
  <p>Masuk untuk menyimpan karakter, XP, dan koleksimu. Anggota baru langsung memilih penampilan dan peran.</p>
  <ol className="auth-steps" aria-label="Langkah bergabung"><li aria-current="step"><span>1</span>Masuk Google</li><li><span>2</span>Buat karakter</li><li><span>3</span>Masuk dunia</li></ol>
  <div className="auth-login-panel">
   {!ready&&!local&&!error&&<div className="auth-loading"><LoaderCircle size={18}/>Menyiapkan tombol Google…</div>}
   <div ref={button} className="google-button" aria-label="Masuk menggunakan Google" aria-busy={busy} inert={busy||undefined} style={ready?undefined:{display:'none'}}/>
   {local&&<a className="auth-local-button" href="/signin-with-chatgpt?return_to=/">Masuk akun uji lokal</a>}
   <p className={'auth-status'+(error?' is-error':'')} role="status" aria-live="polite">{message}</p>
   {error&&<button type="button" className="auth-retry" onClick={()=>setAttempt(a=>a+1)}>Coba lagi</button>}
  </div>
  <div className="auth-privacy-note"><ShieldCheck size={16}/><span>Email Google digunakan untuk login dan tidak ditampilkan kepada pemain lain. Nama petualangmu bisa kamu tentukan sendiri.</span></div>
  <a className="text-button auth-privacy" href="/privasi">Privasi dan penghapusan data</a>
 </section><p className="auth-footer">SATU AKUN · SATU KARAKTER · BANYAK CERITA</p></div></main>;
}
