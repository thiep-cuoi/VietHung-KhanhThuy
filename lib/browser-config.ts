import {defaultWedding,type WeddingConfig} from "./wedding";
import {buildRsvpWorkbook} from "./export-rsvp";
import type {Invitation,RSVP} from "./wedding";
declare global {interface Window {WEDDING_SITE?:{mode:"static";appsScriptUrl:string;wedding?:WeddingConfig;musicVolume?:number;musicFadeSeconds?:number};}}
export const isStaticSite=()=>typeof window!=="undefined"&&window.WEDDING_SITE?.mode==="static";
export const assetUrl=(path:string)=>isStaticSite()?"./"+path.replace(/^\//,""):path;
export const homeHref=()=>isStaticSite()?"./index.html":"/";
export const managementHref=()=>isStaticSite()?"./quan-ly.html":"/quan-ly";
export const inviteCreatorHref=()=>isStaticSite()?"./tao-loi-moi.html":"/tao-loi-moi";
export const invitationHref=(token:string)=>isStaticSite()?`./index.html?guest=${encodeURIComponent(token)}`:`/moi/${encodeURIComponent(token)}`;
export const absoluteInviteUrl=(token:string)=>new URL(invitationHref(token),window.location.href).href;
const sessionKey=()=>"wedding-admin-"+(window.WEDDING_SITE?.appsScriptUrl??"");
export function getAdminSession(){try{return sessionStorage.getItem(sessionKey())??"";}catch{return "";}}
export function setAdminSession(token:string){if(token)sessionStorage.setItem(sessionKey(),token);else sessionStorage.removeItem(sessionKey());}
export async function weddingFetch(path:string,options:RequestInit={}):Promise<Response>{
 if(!isStaticSite())return fetch(path,options);
 const endpoint=window.WEDDING_SITE?.appsScriptUrl?.trim();
 if(!endpoint){if(path==="/api/config")return Response.json({config:window.WEDDING_SITE?.wedding??defaultWedding});return Response.json({error:"Chưa kết nối Google Sheets. Hãy cấu hình appsScriptUrl trong config.js theo README."},{status:503});}
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))return Response.json({error:"URL Apps Script chưa đúng. Dùng địa chỉ Web App kết thúc bằng /exec."},{status:503});
 const data=typeof options.body==="string"?JSON.parse(options.body):{};
 const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({path:path.replace(/^\/api\//,""),method:options.method??"GET",data,sessionToken:getAdminSession()}),credentials:"omit",redirect:"follow",signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error("Không kết nối được Google Sheets. Vui lòng thử lại.");
 let packet:{ok:boolean;data?:unknown;error?:string;status?:number};
 try{packet=await response.json() as typeof packet;}catch{throw new Error("Apps Script chưa trả về dữ liệu JSON. Kiểm tra URL /exec và quyền truy cập Anyone khi triển khai.");}
 if(!packet.ok){if(packet.status===401){setAdminSession("");window.dispatchEvent(new Event("wedding-admin-expired"));}return Response.json({error:packet.error??"Chưa xử lý được yêu cầu."},{status:packet.status??400});}
 if(path==="/api/admin/export"){
  const result=packet.data as {invitations:Invitation[];responses:RSVP[]};
  const bytes=buildRsvpWorkbook(result.invitations,result.responses,i=>absoluteInviteUrl(i.token));
  return new Response(new Uint8Array(bytes).buffer,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}});
 }
 return Response.json(packet.data);
}
