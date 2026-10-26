import { couple, weddingEvents, type WeddingConfig } from "./wedding";
const escape=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
const stampOf=(d:Date)=>d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
const start=(date:string,time:string)=>new Date(`${date}T${time}:00+07:00`);
export function createCalendar(config:WeddingConfig){
 const stamp=stampOf(new Date()),[first,second]=couple(config);
 const events=weddingEvents(config).map(e=>({key:e.key,date:e.date,begin:start(e.date,e.time),title:`${e.title} ${first.name} & ${second.name}`,address:[e.hall,e.venue,e.address].filter(Boolean).join(", ")}));
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Chung Doi//Wedding//VI",...events.flatMap(e=>["BEGIN:VEVENT",`UID:${e.key}-${e.date}@ngaychungdoi`,`DTSTAMP:${stamp}`,`DTSTART:${stampOf(e.begin)}`,`DTEND:${stampOf(new Date(e.begin.getTime()+3*3600000))}`,`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.address)}`,"END:VEVENT"]),"END:VCALENDAR"].join("\r\n");
}
