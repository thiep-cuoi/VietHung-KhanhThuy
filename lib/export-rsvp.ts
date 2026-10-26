import {attendanceLabels,eventLabels,type Invitation,type RSVP} from "./wedding";
import {createWorkbook} from "./xlsx";
export function buildRsvpWorkbook(invites:Invitation[],responses:RSVP[],link:(invite:Invitation)=>string){
 const time=(s:string)=>new Date(s).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"});
 return createWorkbook([
  {name:"RSVP",widths:[28,22,15,26,65,22,24,24],rows:[["Tên khách mời","Xác nhận","Số người","Chương trình","Lời chúc","Nhóm khách","Gửi lần đầu (UTC+7)","Cập nhật (UTC+7)"],...responses.map(r=>[r.guestName,attendanceLabels[r.attendance],r.guests,eventLabels[r.event],r.wish,r.groupName,time(r.createdAt),time(r.updatedAt)])]},
  {name:"Khách mời",widths:[30,18,24,16,18,85,24,45],rows:[["Tên khách mời","Xưng hô","Nhóm khách","Số người tối đa","Trạng thái RSVP","Link thiệp riêng","Thiệp hoạt động","Lời nhắn riêng"],...invites.map(i=>[i.guestName,i.salutation,i.groupName,i.maxGuests,attendanceLabels[i.attendance??""]??"Chưa phản hồi",link(i),i.enabled?"Có":"Tạm đóng",i.note])]},
  {name:"Thống kê",widths:[36,24],rows:[["Chỉ tiêu","Số lượng"],["Thiệp đã tạo",invites.length],["Tổng phản hồi",responses.length],["Sẽ tham dự",responses.filter(r=>r.attendance==="yes").length],["Tổng số người tham dự",responses.reduce((n,r)=>n+(r.attendance==="yes"?r.guests:0),0)],["Không tham dự",responses.filter(r=>r.attendance==="no").length],["Chưa xác nhận",responses.filter(r=>r.attendance==="later").length],["Thiệp chưa phản hồi",invites.filter(i=>!i.attendance).length]]}
 ]);
}
