// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";

function TopNav({ user, companyCode, onMenu, onLogout, onNav, talents, onSelectTalent, tasks }) {
  const [profileOpen,setProfileOpen]=useState(false);
  const [q,setQ]=useState(""); const [qOpen,setQOpen]=useState(false);
  const ref=useRef();
  const accessible=ROLE_STAGE_ACCESS[user.role]||[];
  const visibleTalents=user.role==="director"?talents:talents.filter(t=>accessible.includes(t.stage));
  const results=q.length>1?visibleTalents.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())||t.social_handle.toLowerCase().includes(q.toLowerCase())).slice(0,6):[];
  const urgentTasks=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open"&&t.priority==="urgent").length;
  const openTasks=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open").length;
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target)){setProfileOpen(false);setQOpen(false);}}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return(
    <div ref={ref} style={{ background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,display:"flex",alignItems:"center",height:48,padding:"0 14px",gap:8,flexShrink:0,zIndex:100,position:"relative" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginRight:4 }}>
        <div style={{ width:28,height:28,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif" }}>N</div>
        <span style={{ color:"#fff",fontWeight:700,fontSize:14,fontFamily:"Georgia,serif" }}>Nzinga</span>
      </div>
      <div style={{ display:"flex",gap:1,marginRight:6 }}>
        {[["☰","Menu",onMenu],["📄","Records",()=>onNav("roster")],["★","Workspace",()=>onNav("workspace")]].map(([icon,tip,fn])=><button key={tip} onClick={fn} title={tip} style={{ background:"transparent",border:"none",color:"#94a3b8",padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:14 }}>{icon}</button>)}
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
      {openTasks>0&&<div onClick={()=>onNav("tasks")} style={{ background:urgentTasks>0?"#dc2626":"rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}><span style={{ fontSize:13 }}>🔔</span>{urgentTasks>0&&<span style={{ fontSize:11,fontWeight:700,color:"#fff" }}>{urgentTasks}</span>}</div>}
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

function Scoreboard({ talents, role }) {
  const accessible=ROLE_STAGE_ACCESS[role]||[];
  const visible=role==="director"?talents:talents.filter(t=>accessible.includes(t.stage));
  const active=visible.filter(t=>!["archived","not_viable"].includes(t.stage));
  const signed=talents.filter(t=>t.stage==="signed_onboarding");
  const totalRev=talents.reduce((a,t)=>a+parseFloat(t.revenue_ytd||0),0);
  const avg=active.filter(t=>t.jordan_score>0).reduce((a,t,_,arr)=>a+t.jordan_score/arr.length,0)||0;
  const tiles=[
    {label:"My Pipeline",value:active.length,color:T.purple},
    {label:"Signed Clients",value:signed.length,color:T.green},
    {label:"Avg Jordan Score",value:avg>0?avg.toFixed(2):"—",color:T.amber},
    {label:"YTD Revenue",value:"$"+Math.round(totalRev/1000)+"k",color:T.cyan},
  ];
  if(role==="director"||role==="scout"){tiles.push({label:"Pending Apps",value:talents.filter(t=>t.application_status==="sent"||t.application_status==="in_progress").length,color:T.purple});}
  return <div style={{ display:"flex",gap:8,padding:"8px 18px",background:"#f8f9fb",borderBottom:"1px solid #e5e7eb",overflowX:"auto",flexShrink:0 }}>
    {tiles.map(t=><div key={t.label} style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:7,padding:"6px 14px",minWidth:90,flexShrink:0,boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:20,fontWeight:800,color:t.color,lineHeight:1.2 }}>{t.value}</div>
      <div style={{ fontSize:10,color:T.t4,marginTop:1,whiteSpace:"nowrap",fontWeight:500 }}>{t.label}</div>
    </div>)}
  </div>;
}

function FullMenu({ onClose, onNav, userRole }) {
  const [cat,setCat]=useState("Talent");
  const allCats={
    "Talent":{ "General":["All Talent","Pipeline Matrix","New Holding Entry","Applications"],"Pipeline":["My Queue","Signed Clients"] },
    "Operations":{ "Tasks":["My Tasks","All Open Tasks"],"Communications":["History / Notes","Flagged Notes"] },
    "Reports":{ "Pipeline":["Pipeline Summary","Jordan Score Report"],"Revenue":["Revenue Forecast"] },
    ...(userRole==="director"?{"Administration":{"Users":["All Users","Role Management"],"System":["Audit Log","System Settings"]}}:{}),
  };
  const nm={"Pipeline Matrix":"pipeline","All Talent":"roster","My Tasks":"tasks","History / Notes":"history","Pipeline Summary":"reports","Revenue Forecast":"reports","Jordan Score Report":"reports","New Holding Entry":"new_entry","Applications":"applications","My Queue":"dashboard"};
  return(
    <div style={{ position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-start" }}>
      <div onClick={onClose} style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.4)" }}/>
      <div style={{ position:"relative",width:820,margin:"48px 0 0",background:"#fff",borderRadius:"0 0 10px 0",boxShadow:"0 8px 40px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 48px)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafbfc",gap:10 }}>
          <div style={{ width:26,height:26,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif" }}>N</div>
          <span style={{ fontSize:14,fontWeight:700,color:T.t1 }}>Menu</span>
          {["Workspace","Dashboard"].map(l=><button key={l} onClick={()=>{onNav(l.toLowerCase());onClose();}} style={{ background:"transparent",border:"none",padding:"5px 10px",cursor:"pointer",fontSize:12,color:T.t2,borderRadius:5,fontFamily:"inherit" }}>{l}</button>)}
          <div style={{ flex:1 }}/><button onClick={onClose} style={{ background:"transparent",border:"none",fontSize:16,cursor:"pointer",color:T.t3 }}>✕</button>
        </div>
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          <div style={{ width:150,background:"#f8f9fb",borderRight:"1px solid #e5e7eb",padding:"8px 0",flexShrink:0 }}>
            {Object.keys(allCats).map(c=><div key={c} onMouseEnter={()=>setCat(c)} style={{ padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:cat===c?700:400,color:cat===c?T.blue:T.t2,background:cat===c?"#fff":"transparent",borderLeft:`3px solid ${cat===c?T.blue:"transparent"}` }}>{c}</div>)}
          </div>
          <div style={{ flex:1,padding:"14px 18px",display:"flex",gap:28,overflowY:"auto" }}>
            {Object.entries(allCats[cat]||{}).map(([group,items])=><div key={group} style={{ minWidth:150 }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.t3,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>{group}</div>
              {items.map(item=><div key={item} onClick={()=>{if(nm[item])onNav(nm[item]);onClose();}} style={{ padding:"5px 0",fontSize:13,color:T.blue,cursor:"pointer" }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item}</div>)}
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ view, onNav, talents, tasks, currentUser }) {
  const role=currentUser.role;
  const accessible=ROLE_STAGE_ACCESS[role]||[];
  const actionStage=ROLE_ACTION_STAGE[role];
  const myQueue=talents.filter(t=>t.stage===actionStage).length;
  const pendingApps=talents.filter(t=>t.application_status==="sent"||t.application_status==="in_progress").length;
  const submittedApps=talents.filter(t=>t.application_status==="submitted"&&t.stage==="holding_entry").length;

  const sections=[
    {label:"WORKSPACE",items:[{id:"dashboard",label:"Dashboard",icon:"⊙"},{id:"workspace",label:"My Workspace",icon:"★"}]},
    {label:"TALENT",items:[
      {id:"pipeline",label:"Pipeline",icon:"◈"},
      {id:"roster",label:"Full Roster",icon:"☰"},
      ...(role==="scout"||role==="director"?[{id:"new_entry",label:"New Entry",icon:"+"},{id:"applications",label:"Applications",icon:"📋",badge:submittedApps>0?submittedApps:pendingApps}]:[]),
    ]},
    {label:"OPERATIONS",items:[
      {id:"tasks",label:"Tasks",icon:"☑",badge:tasks.filter(t=>t.assigned_to===currentUser.id&&t.status==="open").length},
      {id:"history",label:"History / Notes",icon:"✎"},
      {id:"reports",label:"Reports",icon:"⬡"},
      {id:"settings",label:"Settings",icon:"⚙"},
    ]},
    {label:"MY QUEUE",items:[{id:"stage_"+actionStage,label:STAGE_LABELS[actionStage]||"My Stage",dot:STAGE_COLORS[actionStage],count:myQueue,isMyStage:true}]},
    ...(role==="director"?[{label:"ALL STAGES",items:STAGES.filter(s=>!["archived","not_viable"].includes(s)).map(s=>({id:"stage_"+s,label:STAGE_LABELS[s],dot:STAGE_COLORS[s],count:talents.filter(t=>t.stage===s).length}))}]:[]),
  ];

  return(
    <div style={{ width:186,background:T.navBg,borderRight:`1px solid ${T.navBorder}`,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto" }}>
      {myQueue>0&&<div style={{ margin:"8px 8px 2px",background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",borderRadius:6,padding:"5px 9px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontSize:11,color:"rgba(255,255,255,0.7)" }}>My Queue</span>
        <span style={{ background:T.blue,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700 }}>{myQueue}</span>
      </div>}
      {sections.map((sec,si)=><div key={si}>
        <div style={{ padding:"9px 0 2px 11px",fontSize:9,color:"rgba(255,255,255,0.25)",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" }}>{sec.label}</div>
        {sec.items.map(item=>{
          const active=view===item.id||(item.id.startsWith("stage_")&&view==="pipeline");
          return <div key={item.id} onClick={()=>{ if(item.id==="new_entry"||item.id==="applications")onNav(item.id); else if(item.id.startsWith("stage_"))onNav("pipeline"); else onNav(item.id); }} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 9px 5px 11px",cursor:"pointer",background:active?"rgba(255,255,255,0.08)":"transparent",borderLeft:`2px solid ${active?"#fff":"transparent"}`,marginBottom:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              {item.dot?<span style={{ width:6,height:6,borderRadius:"50%",background:item.isMyStage?item.dot:item.dot+"88",flexShrink:0 }}/>:<span style={{ fontSize:11,color:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)" }}>{item.icon}</span>}
              <span style={{ fontSize:11,color:active?"#fff":"#94a3b8" }}>{item.label}</span>
            </div>
            {(item.count>0||item.badge>0)&&<span style={{ background:item.badge>0?"rgba(220,38,38,0.5)":item.isMyStage?"rgba(37,99,235,0.5)":"rgba(255,255,255,0.1)",color:"#fff",fontSize:10,padding:"1px 5px",borderRadius:8,fontWeight:600 }}>{item.count||item.badge}</span>}
          </div>;
        })}
      </div>)}
    </div>
  );
}
// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar };
