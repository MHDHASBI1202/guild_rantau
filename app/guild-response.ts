/** Preserve useful API errors without exposing JSON parser errors to players. */
export async function readGuildResponse<T>(response:Response):Promise<T>{
 const fallback=response.status===401
  ? 'Sesi masukmu berakhir. Silakan masuk lagi.'
  : response.status>=500
   ? 'Server kamp sedang bermasalah. Silakan coba lagi sebentar.'
   : 'Respons kamp belum lengkap. Coba lagi; pilihan karaktermu tetap ada.';
 try{
  const data:unknown=JSON.parse(await response.text());
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();
  return data as T;
 }catch{throw new Error(fallback);}
}
