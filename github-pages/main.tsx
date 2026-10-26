import React,{useState,useEffect,type FormEvent} from "react";
import {createRoot} from "react-dom/client";
import WeddingInvitation from "../app/wedding";
import AdminDashboard from "../app/quan-ly/dashboard";
import InviteCreator from "../app/tao-loi-moi/invite-creator";
import {homeHref,getAdminSession,setAdminSession,weddingFetch} from "../lib/browser-config";
import {defaultWedding} from "../lib/wedding";
import {Monogram} from "../app/invitation-opening";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "../app/globals.css";
function StaticAdmin(){
 const [authenticated,setAuthenticated]=useState(!!getAdminSession()),[password,setPassword]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{const expired=()=>setAuthenticated(false);window.addEventListener("wedding-admin-expired",expired);return()=>window.removeEventListener("wedding-admin-expired",expired);},[]);
 async function login(e:FormEvent){e.preventDefault();setLoading(true);setError("");try{const r=await weddingFetch("/api/admin/login",{method:"POST",body:JSON.stringify({password})});const d=await r.json() as {sessionToken?:string;error?:string};if(!r.ok||!d.sessionToken)throw new Error(d.error??"Đăng nhập chưa thành công.");setAdminSession(d.sessionToken);setPassword("");setAuthenticated(true);}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 if(authenticated)return <><div className="static-admin-top"><span>Trang quản lý riêng</span><button className="static-logout" onClick={()=>{setAdminSession("");setAuthenticated(false);}}>Đăng xuất</button></div><AdminDashboard displayName="Chủ thiệp"/></>;
 return <main className="admin-auth"><Monogram config={window.WEDDING_SITE?.wedding??defaultWedding} className="opening-logo"/><p className="eyebrow">TRANG QUẢN LÝ RIÊNG</p><h1>Quản lý thiệp cưới</h1><p>Đăng nhập bằng mật khẩu quản trị đã đặt trong Google Apps Script.</p><form className="static-login-form" onSubmit={login}><label>Mật khẩu quản trị<input type="password" autoComplete="current-password" required minLength={12} maxLength={200} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={loading}>{loading?"Đang đăng nhập…":"Đăng nhập quản lý"}</button></form><a className="text-button" href={homeHref()}>Về trang thiệp mời</a></main>;
}
const admin=window.location.pathname.endsWith("/quan-ly.html");
const creator=window.location.pathname.endsWith("/tao-loi-moi.html");
createRoot(document.getElementById("root")!).render(admin?<StaticAdmin/>:creator?<InviteCreator/>:<WeddingInvitation token={new URLSearchParams(window.location.search).get("guest")??undefined}/>);
