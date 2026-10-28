"use client";
import {Hand,MailOpen,Music2,VolumeX} from "lucide-react";
import {assetUrl} from "../lib/browser-config";
import {couple,initial,mainEvent,prettyDate,type WeddingConfig} from "../lib/wedding";
import {cardLogo} from "../lib/card";
// Logo của thiệp nếu có (full = kèm tên, trên điện thoại tự đổi sang bản chỉ có chữ lồng); nếu không, ghép chữ cái đầu tên.
export function Monogram({config,className="",full=false}:{config:WeddingConfig;className?:string;full?:boolean}){
 if(cardLogo)return <picture className={`logo-img ${className}`} aria-hidden="true">{full&&<source media="(max-width:600px)" srcSet={assetUrl(cardLogo.mark)}/>}<img src={assetUrl(full?cardLogo.full:cardLogo.mark)} alt=""/></picture>;
 const [first,second]=couple(config);
 return <span className={`monogram ${className}`} aria-hidden="true"><b>{initial(first.name)}</b><i>&</i><b>{initial(second.name)}</b></span>;
}
export function HySeal({className=""}:{className?:string}){return <span className={`hy-seal ${className}`} aria-hidden="true">囍</span>;}
export function InvitationOpening({config,guest,onOpen,loading,opening=false}:{config:WeddingConfig;guest:string;onOpen:()=>void;loading:boolean;opening?:boolean}){
 const [first,second]=couple(config),main=mainEvent(config);
 return <><link rel="preload" as="image" href={assetUrl("/images/hero.webp")}/><main className={`opening-screen${opening?" is-opening":""}`} aria-busy={opening} onClick={e=>{if(!loading&&!opening&&!(e.target as HTMLElement).closest("button"))onOpen();}}><div className="opening-photo"><img src={assetUrl("/images/cover.webp")} alt={`${first.name} và ${second.name} trong tà áo dài đỏ ngày cưới`} fetchPriority="high"/><div className="opening-photo-caption"><HySeal className="small"/><span>Hai họ kết duyên · Trăm năm hạnh phúc</span></div></div><div className="opening-copy"><Monogram config={config} className="opening-logo" full/><p className="eyebrow">THIỆP MỜI {main.title.toUpperCase()}</p><h1>{first.name}<span>&</span>{second.name}</h1><div className="opening-rule"><span/><HySeal className="tiny"/><span/></div><p className="opening-date">{prettyDate(main.date).replaceAll("/",".")}</p><div className="opening-guest"><small>TRÂN TRỌNG KÍNH MỜI</small><strong>{loading?"Đang mở thiệp mời…":guest}</strong></div><button className="button primary opening-button" onClick={onOpen} disabled={loading||opening} aria-busy={opening}><MailOpen size={24}/> {opening?"Đang mở thiệp…":"Mở thiệp mời"}</button><p className="opening-tap-hint"><Hand size={16}/> Chạm vào bất kỳ đâu trên thiệp để mở</p><p className="opening-sound-note"><Music2 size={14}/> Thiệp có kèm nhạc nền</p></div></main></>;
}
export function MusicControl({playing,pending,error,onToggle}:{playing:boolean;pending:boolean;error:boolean;onToggle:()=>void}){
 return <div className="music-widget"><button className={`music-button ${playing?"playing":""}`} onClick={onToggle} aria-busy={pending} aria-label={playing?"Tắt nhạc nền":"Bật nhạc nền"} aria-pressed={playing} title={playing?"Đang phát 50 năm về sau · Nhấn để tắt":"Bật nhạc: 50 năm về sau"}><span className="music-disc"/>{playing?<Music2 size={19}/>:<VolumeX size={19}/>}</button><span className="music-tooltip">{error?"Chạm để thử phát nhạc":playing?"50 năm về sau · Tắt nhạc":"Bật nhạc"}</span><span className="sr-only" aria-live="polite">{playing?"Nhạc đang phát":"Nhạc đang tắt"}</span></div>;
}
