export type NamedGuest = {name:string;reference:string};
export const defaultGuestLabel="Quý khách";
// Xưng hô có chứa {tên} thì tên khách thế vào đúng chỗ đó (vd "{tên} bro" → "Lân bro"); nếu không, xưng hô đứng trước tên.
export const NAME_SLOT="{tên}";
export function guestTitle(salutation:string,name:string){
 const s=salutation.trim();
 return (s.includes(NAME_SLOT)?s.replace(NAME_SLOT,name):`${s} ${name}`).replace(/\s+/g," ").trim();
}

export function cleanGuestName(value:string){return value.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();}

export function parseGuestNames(value:string):string[]{
 const names=[...new Set(value.split(/\r?\n/).map(cleanGuestName).filter(Boolean))];
 if(!names.length)throw new Error("Hãy nhập ít nhất một tên khách mời.");
 if(names.length>100)throw new Error("Bạn có thể tạo tối đa 100 lời mời mỗi lần.");
 if(names.some(name=>name.length>100))throw new Error("Mỗi tên khách mời cần ngắn hơn hoặc bằng 100 ký tự.");
 return names;
}

export function readNamedGuest(search:string):NamedGuest|null{
 const params=new URLSearchParams(search),name=cleanGuestName(params.get("to")??"");
 if(!name||name.length>100)return null;
 const reference=params.get("ref")??"";
 return {name,reference:/^[A-Za-z0-9_-]{16,80}$/.test(reference)?reference:""};
}

export function createNamedInviteUrl(homeUrl:string,name:string,reference:string){
 const clean=cleanGuestName(name);
 if(!clean||clean.length>100)throw new Error("Tên khách mời cần có từ 1 đến 100 ký tự.");
 if(!/^[A-Za-z0-9_-]{16,80}$/.test(reference))throw new Error("Chưa tạo được mã lời mời. Vui lòng thử lại.");
 const url=new URL(homeUrl);
 if(url.protocol!=="https:"&&url.protocol!=="http:")throw new Error("Hãy chạy website qua địa chỉ http hoặc https để tạo link.");
 url.search="";url.hash="";
 url.searchParams.set("to",clean);url.searchParams.set("ref",reference);
 return url.href;
}

export function responseStorageKey(token?:string,guest?:NamedGuest|null){
 return `wedding-submission-${token??(guest?`named-${guest.reference||guest.name}`:"general")}`;
}
