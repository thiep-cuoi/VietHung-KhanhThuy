"use client";
import {useEffect,useRef} from "react";
export function useModal(open:boolean,onClose:()=>void){
 const closeRef=useRef(onClose);useEffect(()=>{closeRef.current=onClose;},[onClose]);
 useEffect(()=>{
  if(!open)return;
  const dialog=document.querySelector<HTMLElement>('[role="dialog"]');if(!dialog)return;
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow="hidden";
  const focusables=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(el=>el.offsetParent!==null);
  focusables()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();closeRef.current();}if(e.key==="Tab"){const list=focusables(),first=list[0],last=list.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.addEventListener("keydown",key);return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);if(previous?.isConnected)previous.focus();};
 },[open]);
}
