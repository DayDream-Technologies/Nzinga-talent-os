// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED, isTalentVisibleToRole } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { CompanyLogo } from "@/components/branding";
import { AGENCY_NAV, AGENCY_SIDEBAR } from "@/constants/agency-nav";

function TopNav({ user, companyCode, onMenu, onLogout, onNav, talents, onSelectTalent, tasks }) {
  const [profileOpen,setProfileOpen]=useState(false);
  const [q,setQ]=useState(""); const [qOpen,setQOpen]=useState(false);
  const ref=useRef();
  const accessible=ROLE_STAGE_ACCESS[user.role]||[];
  const visibleTalents=talents.filter(t=>isTalentVisibleToRole(t,user.role,user.id));
  const results=q.length>1?visibleTalents.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())||t.social_handle.toLowerCase().includes(q.toLowerCase())).slice(0,6):[];
  const urgentTasks=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open"&&t.priority==="urgent").length;
  const openTasks=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open").length;
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target)){setProfileOpen(false);setQOpen(false);}}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return(
    <div ref={ref} style={{ background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,display:"flex",alignItems:"center",height:48,padding:"0 14px",gap:8,flexShrink:0,zIndex:100,position:"relative" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginRight:4 }}>
        <CompanyLogo variant="company" companyCode={companyCode} size="sm" theme="dark" showWordmark />
      </div>
      <div style={{ display:"flex",gap:1,marginRight:6 }}>
        {[["☰","Menu",onMenu],["📄","Roster",()=>onNav("active-roster")],["★","Workspace",()=>onNav("workspace")]].map(([icon,tip,fn])=><button key={tip} onClick={fn} title={tip} style={{ background:"transparent",border:"none",color:"#94a3b8",padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:14 }}>{icon}</button>)}
      </div>
      <div style={{ flex:1,maxWidth:420,position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"4px 10px" }}>
          <span style={{ color:"rgba(255,255,255,0.4)",fontSize:13 }}>⌕</span>
          <input value={q} onChange={e=>{setQ(e.target.value);setQOpen(true);}} onFocus={()=>setQOpen(true)} placeholder="Command Launch" style={{ background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:12,flex:1,fontFamily:"inherit" }}/>
          {q&&<span onClick={()=>{setQ("");setQOpen(false);}} style={{ color:"rgba(255,255,255,0.4)",cursor:"pointer" }}>✕</span>}
        </div>
        {qOpen&&results.length>0&&<div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e5e7eb",borderRadius:7,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200 }}>
          {results.map(t=><div key={t.id} onClick={()=>{onSelectTalent(t);setQ("");setQOpen(false);}} style={{ padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #f5f5f5",display:"flex",alignItems:"center",justifyContent:"space-between" }}><div><span style={{ color:T.purple,fontWeight:600,fontSize:12 }}>{t.name}</span><span style={{ color:T.t4,fontSize:11,marginLeft:6 }}>{t.social_handle}</span></div><StageBadge stage={t.stage}/></div>)}
        </div>}
      </div>
      <div style={{ flex:1 }}/>
      <div style={{ textAlign:"right",marginRight:4 }}><div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em" }}>Company</div><div style={{ fontSize:12,color:"#fff",fontWeight:600 }}>{companyCode}</div></div>
      {openTasks>0&&<div onClick={()=>onNav("agency-tasks")} style={{ background:urgentTasks>0?"#dc2626":"rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}><span style={{ fontSize:13 }}>🔔</span>{urgentTasks>0&&<span style={{ fontSize:11,fontWeight:700,color:"#fff" }}>{urgentTasks}</span>}</div>}
      <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"2px 8px" }}>
        <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em" }}>Role</div>
        <select value={user.role} onChange={e=>{const u=USERS.find(u=>u.role===e.target.value);if(u)onLogout(u);}} style={{ background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {USERS.map(u=><option key={u.id} value={u.role} style={{ background:"#1a2332" }}>{ROLE_LABELS[u.role]} – {u.name}</option>)}
        </select>
      </div>
      <div style={{ position:"relative" }}>
        <div onClick={()=>setProfileOpen(o=>!o)} style={{ width:32,height:32,borderRadius:"50%",background:user.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer" }}>{user.initials}</div>
        {profileOpen&&<div style={{ position:"absolute",right:0,top:38,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,width:190,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200,overflow:"hidden" }}>
          <div style={{ padding:"12px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafbfc" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}><Av user={user} size={30}/><div><div style={{ fontSize:12,fontWeight:600,color:T.t1 }}>{user.name}</div><div style={{ fontSize:11,color:user.color,fontWeight:500 }}>{user.title}</div></div></div>
          </div>
          <div style={{ padding:6 }}><div onClick={()=>onLogout(null)} style={{ padding:"7px 8px",cursor:"pointer",color:T.red,fontSize:12,borderRadius:4 }}>Sign Out</div></div>
        </div>}
      </div>
    </div>
  );
}

function BreadcrumbBar({ label, sub }) {
  return <div style={{ background:T.accentBg,padding:"6px 18px",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
    <span style={{ color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:500 }}>{label}</span>
    {sub&&<><span style={{ color:"rgba(255,255,255,0.4)" }}>›</span><span style={{ color:"#fff",fontSize:13,fontWeight:600 }}>{sub}</span></>}
  </div>;
}

function Scoreboard({ agencyStats }) {
  const tiles=agencyStats||[
    {label:"Open Tickets",value:"—",color:T.amber},
    {label:"Agency Tasks",value:"—",color:T.blue},
    {label:"Open Invoices",value:"—",color:T.purple},
    {label:"Pending Payouts",value:"—",color:T.green},
  ];
  return <div style={{ display:"flex",gap:8,padding:"8px 18px",background:"#f8f9fb",borderBottom:"1px solid #e5e7eb",overflowX:"auto",flexShrink:0 }}>
    {tiles.map(t=><div key={t.label} style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:7,padding:"6px 14px",minWidth:90,flexShrink:0,boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:20,fontWeight:800,color:t.color,lineHeight:1.2 }}>{t.value}</div>
      <div style={{ fontSize:10,color:T.t4,marginTop:1,whiteSpace:"nowrap",fontWeight:500 }}>{t.label}</div>
    </div>)}
  </div>;
}

function FullMenu({ onClose, onNav, userRole, companyCode }) {
  const [cat,setCat]=useState(AGENCY_NAV[0]?.id || "talent");
  const current=AGENCY_NAV.find(c=>c.id===cat) || AGENCY_NAV[0];
  return(
    <div style={{ position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-start" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.4)" }}/>
      <div style={{ position:"relative",width:860,margin:"48px 0 0",background:"#fff",borderRadius:"0 0 10px 0",boxShadow:"0 8px 40px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 48px)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafbfc",gap:10 }}>
          <CompanyLogo variant="company" companyCode={companyCode} size="sm" showWordmark />
          <span style={{ fontSize:14,fontWeight:700,color:T.t1 }}>Menu</span>
          <button onClick={()=>{onNav("workspace");onClose();}} style={{ background:"transparent",border:"none",padding:"5px 10px",cursor:"pointer",fontSize:12,color:T.t2,borderRadius:5,fontFamily:"inherit" }}>Workspace</button>
          {userRole==="director"&&<button onClick={()=>{onNav("admin/users");onClose();}} style={{ background:"transparent",border:"none",padding:"5px 10px",cursor:"pointer",fontSize:12,color:T.t2,borderRadius:5,fontFamily:"inherit" }}>Admin</button>}
          <div style={{ flex:1 }}/><button onClick={onClose} style={{ background:"transparent",border:"none",fontSize:16,cursor:"pointer",color:T.t3 }}>✕</button>
        </div>
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          <div style={{ width:160,background:"#f8f9fb",borderRight:"1px solid #e5e7eb",padding:"8px 0",flexShrink:0 }}>
            {AGENCY_NAV.map(c=><div key={c.id} onMouseEnter={()=>setCat(c.id)} style={{ padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:cat===c.id?700:400,color:cat===c.id?T.blue:T.t2,background:cat===c.id?"#fff":"transparent",borderLeft:`3px solid ${cat===c.id?T.blue:"transparent"}` }}>{c.label}</div>)}
          </div>
          <div style={{ flex:1,padding:"14px 18px",display:"flex",gap:28,overflowY:"auto",flexWrap:"wrap" }}>
            {(current?.groups||[]).map(group=><div key={group.label} style={{ minWidth:160 }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.t3,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>{group.label}</div>
              {group.items.map(item=><div key={item.id} onClick={()=>{onNav(item.path);onClose();}} style={{ padding:"5px 0",fontSize:13,color:T.blue,cursor:"pointer" }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item.label}</div>)}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ view, onNav }) {
  return(
    <div style={{ width:186,background:T.navBg,borderRight:`1px solid ${T.navBorder}`,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto" }}>
      {AGENCY_SIDEBAR.map((sec,si)=><div key={si}>
        <div style={{ padding:"9px 0 2px 11px",fontSize:9,color:"rgba(255,255,255,0.25)",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" }}>{sec.label}</div>
        {sec.items.map(item=>{
          const active=view===item.path;
          return <div key={item.id} onClick={()=>onNav(item.path)} style={{ display:"flex",alignItems:"center",padding:"5px 9px 5px 11px",cursor:"pointer",background:active?"rgba(255,255,255,0.08)":"transparent",borderLeft:`2px solid ${active?"#fff":"transparent"}`,marginBottom:1 }}>
            <span style={{ fontSize:11,color:active?"#fff":"#94a3b8" }}>{item.label}</span>
          </div>;
        })}
      </div>)}
    </div>
  );
}
// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar };
