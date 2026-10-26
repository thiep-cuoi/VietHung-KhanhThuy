/* Wedding RSVP for GitHub Pages. Keep this script bound to a PRIVATE Google Sheet. */
const TAB_INVITES = 'Khách mời';
const TAB_RSVP = 'RSVP';
const INVITE_HEADERS = ['ID','Mã thiệp','Tên khách mời','Xưng hô','Nhóm','Số người tối đa','Lời nhắn riêng','Hoạt động','Ngày tạo','Đã mở thiệp','JSON nguồn'];
const RSVP_HEADERS = ['ID','ID thiệp','Tên khách mời','Xác nhận','Số người','Chương trình','Lời chúc','Nhóm','Mã phản hồi','Gửi lần đầu','Cập nhật','JSON nguồn'];
const DEFAULT_CONFIG = {"side": "nha-trai", "groom": "Việt Hưng", "bride": "Khánh Thuỳ", "groomFull": "Việt Hưng", "brideFull": "Khánh Thuỳ", "groomFather": "Trần Phúc Lợi", "groomMother": "Trần Thị Huyền Chân", "brideFather": "Bùi Quang Tuyến", "brideMother": "Nguyễn Thị Lan Anh", "ceremonyTitle": "Lễ Thành Hôn", "date": "2026-11-14", "ceremonyTime": "11:00", "lunarDate": "06 tháng 10 năm Bính Ngọ", "ceremonyVenue": "Trung tâm tiệc cưới Sen Vàng Palace", "ceremonyHall": "Tầng 3 · Sảnh Kim Cương", "ceremonyAddress": "Số 1089 Đại lộ Hùng Vương, Phường Việt Trì, Tỉnh Phú Thọ", "receptionTitle": "", "receptionDate": "", "receptionTime": "", "receptionLunar": "", "receptionVenue": "", "receptionHall": "", "receptionAddress": "", "city": "Việt Trì · Phú Thọ", "intro": "Hai gia đình chúng tôi vui mừng trân trọng báo tin Lễ Thành Hôn của con chúng tôi. Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình và là lời chúc phúc quý giá nhất dành cho đôi trẻ."};
function onOpen(){SpreadsheetApp.getUi().createMenu('Thiệp cưới').addItem('Chuẩn bị bảng RSVP','setupSheet').addItem('Đặt / đổi mật khẩu quản trị','setupAdminPassword').addToUi();}
function setupSheet(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)throw new Error('Mở Apps Script từ một Google Sheet riêng trước khi chạy.');
 PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID',ss.getId());
 [[TAB_INVITES,INVITE_HEADERS],[TAB_RSVP,RSVP_HEADERS]].forEach(function(item){let sh=ss.getSheetByName(item[0]);if(!sh)sh=ss.insertSheet(item[0]);if(sh.getLastRow()>0){const existing=sh.getRange(1,1,1,item[1].length).getValues()[0];if(JSON.stringify(existing)!==JSON.stringify(item[1]))throw new Error('Tab '+item[0]+' đã có nội dung khác. Hãy dùng Google Sheet mới.');}else sh.getRange(1,1,1,item[1].length).setValues([item[1]]);sh.setFrozenRows(1);sh.getRange(1,1,1,item[1].length).setFontWeight('bold').setBackground('#8e1f24').setFontColor('#ffffff');sh.hideColumns(item[1].length);});
}
function setupAdminPassword(){
 const ui=SpreadsheetApp.getUi(),r=ui.prompt('Đặt mật khẩu quản trị','Ít nhất 12 ký tự. Mật khẩu chỉ được dùng trên trang quản lý, không đưa vào config.js.',ui.ButtonSet.OK_CANCEL);
 if(r.getSelectedButton()!==ui.Button.OK)return;
 setPassword_(r.getResponseText());ui.alert('Đã lưu mật khẩu mới. Các phiên đăng nhập cũ đã hết hiệu lực.');
}
function setPassword_(password){
 if(typeof password!=='string'||password.length<12||password.length>200)fail_(400,'Mật khẩu cần từ 12 đến 200 ký tự.');
 const salt=Utilities.getUuid(),p=PropertiesService.getScriptProperties();p.setProperties({ADMIN_SALT:salt,ADMIN_HASH:hash_(salt+':'+password),SIGNING_KEY:Utilities.getUuid()+Utilities.getUuid()});p.deleteProperty('LOGIN_FAILURES');
}
function doGet(){return output_({ok:true,data:{service:'Wedding RSVP',ready:!!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')}});}
function doPost(e){
 let lock=null;
 try{
  const raw=e&&e.postData?e.postData.contents:'';if(!raw||raw.length>24000)fail_(400,'Nội dung gửi không hợp lệ.');
  let packet;try{packet=JSON.parse(raw);}catch(error){fail_(400,'Nội dung gửi không phải JSON.');}
  const path=text_(packet.path,150,'Chức năng'),method=packet.method||'GET',data=packet.data||{};
  if(!data||typeof data!=='object'||Array.isArray(data))fail_(400,'Nội dung không hợp lệ.');
  if(!['GET','POST','PATCH'].includes(method))fail_(405,'Phương thức không hỗ trợ.');
  if(method!=='GET'){lock=LockService.getScriptLock();if(!lock.tryLock(20000))fail_(503,'Có nhiều phản hồi cùng lúc. Vui lòng thử lại.');}
  if(path==='admin/login'&&method==='POST')return output_({ok:true,data:login_(data.password)});
  if(path.indexOf('admin/')===0)requireAdmin_(packet.sessionToken);
  let result;
  if(path==='config'&&method==='GET')result={config:config_()};
  else if(path.indexOf('invitation/')===0&&method==='GET')result=publicInvitation_(path.slice(11));
  else if(path==='opened'&&method==='POST'){const i=invite_(data.token);if(!i.value.openedAt){i.value.openedAt=new Date().toISOString();write_(TAB_INVITES,i.value,i.row);}result={ok:true};}
  else if(path==='rsvp'&&method==='POST')result=saveRsvp_(data);
  else if(path==='admin/invites'&&method==='GET')result={invitations:listInvites_()};
  else if(path==='admin/invites'&&method==='POST')result=createInvites_(data);
  else if(/^admin\/invites\/[a-zA-Z0-9-]+$/.test(path)&&method==='PATCH'){const id=path.split('/')[2],i=records_(TAB_INVITES).find(function(r){return r.value.id===id;});if(!i)fail_(404,'Không tìm thấy khách mời.');if(typeof data.enabled!=='boolean')fail_(400,'Trạng thái không hợp lệ.');i.value.enabled=data.enabled?1:0;write_(TAB_INVITES,i.value,i.row);result={ok:true};}
  else if(path==='admin/responses'&&method==='GET')result={responses:responses_()};
  else if(path==='admin/export'&&method==='GET')result={invitations:listInvites_(),responses:responses_()};
  else if(path==='admin/settings'&&method==='POST'){const c=validateConfig_(data);PropertiesService.getScriptProperties().setProperty('WEDDING_CONFIG',JSON.stringify(c));result={ok:true,config:c};}
  else fail_(404,'Không tìm thấy chức năng.');
  return output_({ok:true,data:result});
 }catch(error){return output_({ok:false,error:error.status?error.message:'Chưa xử lý được yêu cầu. Kiểm tra setupSheet và cấu hình Web App.',status:error.status||500});}
 finally{if(lock)lock.releaseLock();}
}
function output_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function fail_(status,message){const error=new Error(message);error.status=status;throw error;}
function text_(value,max,label,optional){if(value==null)value='';if(typeof value!=='string')fail_(400,label+' không hợp lệ.');value=value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');if(!optional&&!value)fail_(400,'Vui lòng nhập '+label.toLowerCase()+'.');if(value.length>max)fail_(400,label+' tối đa '+max+' ký tự.');return value;}
function hash_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function same_(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function b64_(value){return (typeof value==='string'?Utilities.base64EncodeWebSafe(value,Utilities.Charset.UTF_8):Utilities.base64EncodeWebSafe(value)).replace(/=+$/,'');}
function login_(password){
 const p=PropertiesService.getScriptProperties(),salt=p.getProperty('ADMIN_SALT'),stored=p.getProperty('ADMIN_HASH');if(!salt||!stored)fail_(503,'Chưa đặt mật khẩu. Chạy setupAdminPassword trong Apps Script.');
 const failed=JSON.parse(p.getProperty('LOGIN_FAILURES')||'{"count":0,"start":0}'),now=Date.now();if(now-failed.start>900000){failed.count=0;failed.start=now;}if(failed.count>=10)fail_(429,'Đã thử nhiều lần. Vui lòng thử lại sau 15 phút.');
 if(typeof password!=='string'||password.length>200||!same_(hash_(salt+':'+password),stored)){failed.count++;if(!failed.start)failed.start=now;p.setProperty('LOGIN_FAILURES',JSON.stringify(failed));fail_(401,'Mật khẩu chưa đúng.');}
 p.deleteProperty('LOGIN_FAILURES');const exp=now+8*3600000,body=b64_(JSON.stringify({exp:exp,nonce:Utilities.getUuid()}));const signature=b64_(Utilities.computeHmacSha256Signature(body,p.getProperty('SIGNING_KEY')));return {sessionToken:body+'.'+signature,expiresAt:exp};
}
function requireAdmin_(token){
 if(typeof token!=='string'||token.length>1500)fail_(401,'Vui lòng đăng nhập quản lý.');const parts=token.split('.'),key=PropertiesService.getScriptProperties().getProperty('SIGNING_KEY');if(parts.length!==2||!key)fail_(401,'Phiên đăng nhập không hợp lệ.');const expected=b64_(Utilities.computeHmacSha256Signature(parts[0],key));if(!same_(expected,parts[1]))fail_(401,'Phiên đăng nhập không hợp lệ.');let payload;try{payload=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8'));}catch(e){fail_(401,'Phiên đăng nhập không hợp lệ.');}if(!payload.exp||payload.exp<Date.now())fail_(401,'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
}
function config_(){return Object.assign({},DEFAULT_CONFIG,JSON.parse(PropertiesService.getScriptProperties().getProperty('WEDDING_CONFIG')||'{}'));}
function sheet_(name){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)fail_(503,'Chưa kết nối bảng dữ liệu. Chạy setupSheet.');const sh=SpreadsheetApp.openById(id).getSheetByName(name);if(!sh)fail_(503,'Chưa có tab '+name+'. Chạy setupSheet.');return sh;}
function records_(name){const sh=sheet_(name),col=name===TAB_INVITES?INVITE_HEADERS.length:RSVP_HEADERS.length;if(sh.getLastRow()<2)return [];return sh.getRange(2,col,sh.getLastRow()-1,1).getValues().map(function(row,index){if(!row[0])fail_(500,'Bản ghi dữ liệu thiếu JSON nguồn.');return {row:index+2,value:JSON.parse(row[0])};});}
function safe_(value){if(typeof value==='string'&&/^[=+\-@]/.test(value))return "'"+value;return value==null?'':value;}
function cells_(name,r){const a=name===TAB_INVITES?[r.id,r.token,r.guestName,r.salutation,r.groupName,r.maxGuests,r.note,r.enabled,r.createdAt,r.openedAt||'']:[r.id,r.inviteId||'',r.guestName,r.attendance,r.guests,r.event,r.wish,r.groupName,r.submissionId,r.createdAt,r.updatedAt];return a.map(safe_).concat([JSON.stringify(r)]);}
function write_(name,r,row){const sh=sheet_(name),values=cells_(name,r);sh.getRange(row||sh.getLastRow()+1,1,1,values.length).setValues([values]);}
function invite_(token){if(typeof token!=='string'||!/^[a-f0-9]{32}$/.test(token))fail_(404,'Thiệp không tồn tại. Vui lòng kiểm tra đường dẫn.');const r=records_(TAB_INVITES).find(function(r){return r.value.token===token;});if(!r)fail_(404,'Không tìm thấy thiệp mời.');if(!r.value.enabled)fail_(410,'Thiệp đã tạm đóng. Vui lòng liên hệ cô dâu hoặc chú rể.');return r;}
function responses_(){return records_(TAB_RSVP).map(function(r){return r.value;}).sort(function(a,b){return b.updatedAt.localeCompare(a.updatedAt);});}
function listInvites_(){const rs=responses_();return records_(TAB_INVITES).map(function(row){const i=Object.assign({},row.value),r=rs.find(function(r){return r.inviteId===i.id;});if(r){i.attendance=r.attendance;i.guests=r.guests;i.wish=r.wish;i.respondedAt=r.updatedAt;}return i;}).sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);});}
function publicInvitation_(token){const i=invite_(token).value,r=responses_().find(function(r){return r.inviteId===i.id;});return {invitation:{guestName:i.guestName,salutation:i.salutation,maxGuests:i.maxGuests,note:i.note},previous:r?{attendance:r.attendance,guests:r.guests,event:r.event,wish:r.wish}:null,config:config_()};}
function createInvites_(data){
 const names=Array.from(new Set(text_(data.names,15000,'Tên khách mời').split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean)));if(names.length>100)fail_(400,'Mỗi lần tạo tối đa 100 thiệp.');
 const salutation=text_(data.salutation,40,'Xưng hô'),groupName=text_(data.groupName,60,'Nhóm khách'),note=text_(data.note,500,'Lời nhắn',true),max=Number(data.maxGuests),now=new Date().toISOString();if(!Number.isInteger(max)||max<1||max>20)fail_(400,'Số người tối đa từ 1 đến 20.');
 const list=names.map(function(name){return {id:Utilities.getUuid(),token:Utilities.getUuid().replace(/-/g,''),guestName:text_(name,100,'Tên khách'),salutation:salutation,groupName:groupName,maxGuests:max,note:note,enabled:1,createdAt:now,openedAt:null};});
 const sh=sheet_(TAB_INVITES);sh.getRange(sh.getLastRow()+1,1,list.length,INVITE_HEADERS.length).setValues(list.map(function(r){return cells_(TAB_INVITES,r);}));return {ok:true,count:list.length,invitations:list};
}
function saveRsvp_(data){
 if(text_(data.website,200,'Website',true))fail_(400,'Yêu cầu không hợp lệ.');
 const token=text_(data.token,64,'Mã thiệp',true),i=token?invite_(token).value:null,name=i?i.guestName:text_(data.guestName,100,'Tên khách mời'),attendance=text_(data.attendance,10,'Xác nhận'),event=text_(data.event,20,'Chương trình'),count=Number(data.guests),wish=text_(data.wish,1200,'Lời chúc',true),submission=text_(data.submissionId,80,'Mã phản hồi');
 if(!['yes','no','later'].includes(attendance))fail_(400,'Tình trạng tham dự không hợp lệ.');if(!['ceremony','reception','both'].includes(event))fail_(400,'Chương trình không hợp lệ.');if(!/^[a-zA-Z0-9_-]{16,80}$/.test(submission))fail_(400,'Mã phản hồi không hợp lệ.');if(attendance==='yes'&&(!Number.isInteger(count)||count<1||count>(i?i.maxGuests:10)))fail_(400,'Số người vượt giới hạn trên thiệp.');
 const all=records_(TAB_RSVP),existing=all.find(function(r){return i?r.value.inviteId===i.id:!r.value.inviteId&&r.value.submissionId===submission;}),collision=all.find(function(r){return r.value.submissionId===submission;});if(collision&&(!existing||collision.value.id!==existing.value.id))fail_(409,'Mã phản hồi đã được dùng. Vui lòng mở lại thiệp.');
 const now=new Date().toISOString(),r={id:existing?existing.value.id:Utilities.getUuid(),inviteId:i?i.id:null,guestName:name,attendance:attendance,guests:attendance==='yes'?count:0,event:event,wish:wish,groupName:i?i.groupName:'Khách tự xác nhận',submissionId:existing?existing.value.submissionId:submission,createdAt:existing?existing.value.createdAt:now,updatedAt:now};write_(TAB_RSVP,r,existing?existing.row:null);return {ok:true,guestName:name,attendance:attendance,guests:r.guests,updatedAt:now};
}
function validateConfig_(data){const optional=['groomFather','groomMother','brideFather','brideMother','lunarDate','ceremonyHall','receptionTitle','receptionDate','receptionTime','receptionLunar','receptionVenue','receptionHall','receptionAddress','city'],result={};Object.keys(DEFAULT_CONFIG).forEach(function(key){result[key]=text_(data[key],key==='intro'?1500:250,key,optional.includes(key));});if(['nha-trai','nha-gai'].indexOf(result.side)<0)fail_(400,'Loại thiệp không hợp lệ.');function day(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))fail_(400,'Ngày không hợp lệ.');const x=new Date(d+'T12:00:00+07:00');if(isNaN(x.getTime())||x.toISOString().slice(0,10)!==d)fail_(400,'Ngày không tồn tại.');}function hour(t){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))fail_(400,'Giờ không hợp lệ.');}day(result.date);hour(result.ceremonyTime);if(result.receptionVenue){if(!result.receptionDate)result.receptionDate=result.date;if(!result.receptionTitle)result.receptionTitle='Tiệc Cưới';day(result.receptionDate);hour(result.receptionTime);}return result;}
