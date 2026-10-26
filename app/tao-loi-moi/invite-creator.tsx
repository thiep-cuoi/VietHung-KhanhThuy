"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowLeft,ArrowUpRight,Check,Copy,Heart,Link2,MailPlus} from "lucide-react";
import {assetUrl,homeHref,managementHref,weddingFetch} from "../../lib/browser-config";
import {defaultWedding,couple,mainEvent,prettyDate,type WeddingConfig} from "../../lib/wedding";
import {Monogram} from "../invitation-opening";
import {createNamedInviteUrl,defaultGuestLabel,parseGuestNames} from "../../lib/guest-links";

type CreatedInvite={name:string;url:string};
export default function InviteCreator(){
 const [config,setConfig]=useState(defaultWedding),[names,setNames]=useState(""),[links,setLinks]=useState<CreatedInvite[]>([]),[selected,setSelected]=useState(0),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{let active=true;weddingFetch("/api/config").then(async r=>{if(!r.ok)return;const d=await r.json() as {config?:WeddingConfig};if(active&&d.config)setConfig(d.config);}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(""),4000);return()=>clearTimeout(timer);},[notice]);
 function create(e:FormEvent){
  e.preventDefault();setError("");
  try{const guests=parseGuestNames(names),home=new URL(homeHref(),window.location.href).href;const created=guests.map(name=>({name,url:createNamedInviteUrl(home,name,crypto.randomUUID().replaceAll("-",""))}));setLinks(created);setSelected(0);setNotice(`Đã tạo ${created.length} link lời mời. Chọn Sao chép để gửi cho khách.`);}
  catch(e){setError((e as Error).message);}
 }
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setNotice("Đã sao chép. Bạn có thể gửi qua Zalo, Messenger hoặc email.");}catch{setNotice("Hãy chọn ô đường dẫn bên dưới rồi sao chép thủ công.");}}
 const guest=links[selected]?.name||names.split(/\r?\n/).find(s=>s.trim())?.trim()||defaultGuestLabel;
 return <div className="invite-creator">
  <header className="creator-header"><a href={homeHref()} className="brand"><Monogram config={config} className="header-monogram"/><span className="brand-word">{mainEvent(config).title.toUpperCase()}<small>{couple(config).map(p=>p.name).join(" & ")}</small></span></a><a className="text-button" href={managementHref()}>Quản lý hồi đáp <ArrowUpRight size={14}/></a></header>
  <main className="creator-main">
   <div className="creator-heading"><p className="eyebrow">MỖI CÁI TÊN, MỘT LỜI MỜI RIÊNG</p><h1>Gửi thiệp mời<br/><em className="mussica-title">đích danh.</em></h1><p>Điền tên khách muốn mời. Mỗi khách một đường dẫn riêng, một tấm thiệp mang tên mình.</p></div>
   <div className="creator-layout">
    <section className="creator-form-card" aria-labelledby="creator-form-title"><div className="creator-section-title"><span>01</span><div><h2 id="creator-form-title">Lời mời dành cho ai?</h2><p>Nhập tên đúng như cách bạn muốn hiện trên thiệp.</p></div></div>
     <form onSubmit={create}><label htmlFor="guest-names">Tên khách mời <span>*</span><textarea id="guest-names" rows={5} maxLength={15000} required value={names} onChange={e=>setNames(e.target.value)} placeholder={"Ông bà Nguyễn Văn Minh\nGia đình cô Lan\nAnh Minh và chị Hà"} aria-describedby="creator-name-help"/></label><p id="creator-name-help" className="creator-help">Mỗi dòng một khách hoặc một gia đình · tối đa 100 lời mời mỗi lần. Tên sẽ thay cho chữ “Quý khách” trên thiệp.</p>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary creator-submit" type="submit"><MailPlus size={18}/> Tạo link lời mời</button></form>
     <p className="creator-footnote"><Heart size={13}/> Link có thể gửi ngay sau khi website được đưa lên mạng.</p>
    </section>
    <aside className="creator-preview" aria-label="Xem trước tên trên thiệp"><div className="creator-preview-photo"><img src={assetUrl("/images/cover.webp")} alt="Ảnh cưới của cô dâu chú rể"/><span>XEM TRƯỚC LỜI MỜI</span></div><div className="creator-preview-copy"><p className="eyebrow">TRÂN TRỌNG KÍNH MỜI</p><strong>{guest}</strong><span className="creator-preview-rule"><i/><Heart size={13}/><i/></span><h2>{couple(config)[0].name} <em>&</em> {couple(config)[1].name}</h2><p>{prettyDate(mainEvent(config).date).replaceAll("/",".")}{config.city?` · ${config.city.toUpperCase()}`:""}</p><small>Tên xuất hiện trên màn mở thiệp và trong nội dung.</small></div></aside>
   </div>
   {links.length>0&&<section className="creator-results" aria-labelledby="creator-results-title"><div className="creator-results-heading"><div className="creator-section-title"><span>02</span><div><h2 id="creator-results-title">Những lời mời sẵn sàng gửi</h2><p>{links.length} link riêng · bấm tên để xem trước</p></div></div><button className="button secondary small" onClick={()=>copy(links.map(i=>`${i.name}\n${i.url}`).join("\n\n"))}><Copy size={15}/> Sao chép tất cả</button></div><ul className="creator-link-list">{links.map((item,index)=><li key={item.url} className={selected===index?"selected":""}><button className="creator-guest-name" onClick={()=>setSelected(index)} aria-pressed={selected===index}><span>{String(index+1).padStart(2,"0")}</span>{item.name}</button><div className="creator-link-field"><Link2 size={15}/><input readOnly aria-label={`Đường dẫn thiệp của ${item.name}`} value={item.url} onFocus={e=>e.target.select()}/></div><div className="creator-link-actions"><button className="button secondary small" onClick={()=>copy(item.url)} aria-label={`Sao chép link của ${item.name}`}><Copy size={14}/> Sao chép link</button><a className="button primary small" href={item.url} target="_blank" rel="noreferrer" aria-label={`Xem thiệp của ${item.name}`}>Xem thiệp <ArrowUpRight size={14}/></a></div></li>)}</ul><p className="creator-results-note">Tên và mã lời mời nằm trong link. Phản hồi và lời chúc được gửi riêng về trang quản lý. Để giới hạn số người và theo dõi khách đã mở thiệp, tạo thiệp trong trang quản lý.</p></section>}
   <a className="text-button creator-back" href={homeHref()}><ArrowLeft size={14}/> Về thiệp cưới</a>
  </main><footer className="creator-footer">Trân trọng một lời mời, trọn vẹn một ngày vui. <Heart size={12}/></footer>
  {notice&&<div className="toast" role="status"><Check size={16}/>{notice}</div>}
 </div>;
}
