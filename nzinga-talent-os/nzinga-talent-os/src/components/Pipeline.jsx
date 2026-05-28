import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "../data/constants.js";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "./ui.jsx";

function Pipeline({ talents, onSelectTalent, userRole }) {
  const accessible=ROLE_STAGE_ACCESS[userRole]||[];
  const visibleTalents=userRole==="director"?talents:talents.filter(t=>accessible.includes(t.stage));
  return <div style={{ padding:"14px 18px",flex:1,overflowY:"auto" }}>
    {accessible.filter(s=>s!=="not_viable").map(stage=>{
      const group=visibleTalents.filter(t=>t.stage===stage); if(!group.length)return null; const c=STAGE_COLORS[stage];
      return <div key={stage} style={{ marginBottom:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}><div style={{ width:7,height:7,borderRadius:"50%",background:c }}/><span style={{ fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em" }}>{STAGE_LABELS[stage]}</span><span style={{ background:c+"20",color:c,borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700 }}>{group.length}</span></div>
        <table style={{ width:"100%",borderCollapse:"collapse",background:"#fff",borderRadius:7,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <thead><tr><TH>Name</TH><TH>Niche</TH><TH>Score</TH><TH>Handle</TH><TH>Application</TH><TH>Action</TH></tr></thead>
          <tbody>{group.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="#f8f9fb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <TD><span style={{ color:T.blue,fontWeight:600,cursor:"pointer" }} onClick={()=>onSelectTalent(t)}>{t.name}</span></TD>
            <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
            <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{ color:T.t4 }}>—</span>}</TD>
            <TD muted>{t.social_handle}</TD>
            <TD>{t.application_status?<span style={{ fontSize:11,fontWeight:600,color:t.application_status==="submitted"?T.green:T.amber }}>{t.application_status}</span>:<span style={{ color:T.t4,fontSize:11 }}>—</span>}</TD>
            <TD><Btn sm onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
          </tr>)}</tbody>
        </table>
      </div>;
    })}
  </div>;
}

// ─── FULL ROSTER ──────────────────────────────────────────────────────────────
function Roster({ talents, onSelectTalent, userRole }) {
  const [search,setSearch]=useState(""); const [sf,setSf]=useState("all");
  const accessible=ROLE_STAGE_ACCESS[userRole]||[];
  const visible=userRole==="director"?talents:talents.filter(t=>accessible.includes(t.stage));
  const filt=visible.filter(t=>{if(search&&!t.name.toLowerCase().includes(search.toLowerCase())&&!t.social_handle.toLowerCase().includes(search.toLowerCase()))return false;if(sf!=="all"&&t.stage!==sf)return false;return true;});
  return <div style={{ padding:"14px 18px",flex:1,overflowY:"auto" }}>
    <div style={{ display:"flex",gap:8,marginBottom:12,alignItems:"center" }}>
      <div style={{ position:"relative" }}><span style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:T.t4 }}>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,color:T.t1,padding:"5px 9px 5px 24px",fontSize:12,outline:"none",width:180,fontFamily:"inherit" }}/></div>
      <FSelect value={sf} onChange={setSf} options={[{v:"all",l:"All Stages"},...accessible.map(s=>({v:s,l:STAGE_LABELS[s]}))]} style={{ width:150 }}/>
      <span style={{ fontSize:11,color:T.t4 }}>{filt.length} records</span>
    </div>
    <table style={{ width:"100%",borderCollapse:"collapse",background:"#fff",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>Score</TH><TH>Handle</TH><TH>Followers</TH><TH>Application</TH><TH>Docs</TH><TH>Action</TH></tr></thead>
      <tbody>{filt.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="#f8f9fb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <TD><span style={{ color:T.blue,fontWeight:600,cursor:"pointer" }} onClick={()=>onSelectTalent(t)}>{t.name}</span></TD>
        <TD><StageBadge stage={t.stage}/></TD>
        <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
        <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{ color:T.t4 }}>—</span>}</TD>
        <TD muted>{t.social_handle}</TD><TD muted>{t.follower_count}</TD>
        <TD>{t.application_status?<span style={{ fontSize:11,fontWeight:600,color:t.application_status==="submitted"?T.green:T.amber }}>{t.application_status}</span>:<span style={{ color:T.t4,fontSize:11 }}>—</span>}</TD>
        <TD><span style={{ fontSize:11,color:T.t3 }}>{Object.values(t.uploaded_docs||{}).filter(Boolean).length}/4</span></TD>
        <TD><Btn sm onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
      </tr>)}</tbody>
    </table>
  </div>;
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function Tasks({ tasks, setTasks, talents, currentUser }) {
  const [filter,setFilter]=useState("mine"); const [showAdd,setShowAdd]=useState(false);
  const [nt,setNt]=useState({ title:"",assigned_to:currentUser.id,related_talent:"",due:"",priority:"medium",notes:"" });
  const np=(k,v)=>setNt(p=>({...p,[k]:v}));
  const filt=tasks.filter(t=>{ if(filter==="mine")return t.assigned_to===currentUser.id&&t.status==="open"; if(filter==="all")return t.status==="open"; if(filter==="done")return t.status==="completed"; return true; });
  function add(){if(!nt.title)return;setTasks(p=>[...p,{...nt,id:"tk"+Date.now(),status:"open",created_by:currentUser.id,created_at:new Date().toISOString()}]);setNt({title:"",assigned_to:currentUser.id,related_talent:"",due:"",priority:"medium",notes:""});setShowAdd(false);}
  function done(id){setTasks(p=>p.map(t=>t.id===id?{...t,status:"completed"}:t));}
  return <div style={{ padding:"14px 18px",flex:1,overflowY:"auto" }}>
    <div style={{ display:"flex",gap:6,marginBottom:10,alignItems:"center",justifyContent:"space-between" }}>
      <div style={{ display:"flex",gap:5 }}>{[["mine","My Tasks"],["all","All Open"],["done","Done"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{ background:filter===v?"#fff":"transparent",border:`1px solid ${filter===v?"#d1d5db":"transparent"}`,borderRadius:5,padding:"4px 10px",fontSize:12,color:filter===v?T.blue:T.t3,cursor:"pointer",fontWeight:filter===v?600:400,fontFamily:"inherit" }}>{l}</button>)}</div>
      <Btn variant="primary" sm onClick={()=>setShowAdd(s=>!s)}>+ New Task</Btn>
    </div>
    {showAdd&&<div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:12,marginBottom:12 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8 }}>
        <div style={{ gridColumn:"1/-1" }}><Lbl>Title</Lbl><FInput value={nt.title} onChange={v=>np("title",v)} placeholder="Task description…"/></div>
        <div><Lbl>Assigned To</Lbl><FSelect value={nt.assigned_to} onChange={v=>np("assigned_to",v)} options={USERS.map(u=>({v:u.id,l:u.name}))} style={{width:"100%"}}/></div>
        <div><Lbl>Talent</Lbl><FSelect value={nt.related_talent} onChange={v=>np("related_talent",v)} options={[{v:"",l:"None"},...talents.map(t=>({v:t.id,l:t.name}))]} style={{width:"100%"}}/></div>
        <div><Lbl>Due</Lbl><FInput value={nt.due} onChange={v=>np("due",v)} type="date"/></div>
        <div><Lbl>Priority</Lbl><FSelect value={nt.priority} onChange={v=>np("priority",v)} options={["urgent","high","medium","low"]} style={{width:"100%"}}/></div>
      </div>
      <div style={{ display:"flex",gap:6 }}><Btn variant="primary" sm onClick={add}>Create</Btn><Btn sm onClick={()=>setShowAdd(false)}>Cancel</Btn></div>
    </div>}
    <table style={{ width:"100%",borderCollapse:"collapse",background:"#fff",borderRadius:8,overflow:"hidden" }}>
      <thead><tr><TH>Task</TH><TH>Priority</TH><TH>Assigned</TH><TH>Talent</TH><TH>Due</TH><TH>Action</TH></tr></thead>
      <tbody>
        {filt.length===0&&<tr><td colSpan={6} style={{ padding:14,color:T.t4,textAlign:"center",fontSize:12 }}>No tasks.</td></tr>}
        {filt.map(tk=>{const asn=USERS.find(u=>u.id===tk.assigned_to);const rel=talents.find(t=>t.id===tk.related_talent);const od=tk.due&&new Date(tk.due)<new Date()&&tk.status==="open";
          return <tr key={tk.id} style={{ opacity:tk.status==="completed"?0.5:1 }}>
            <TD><span style={{ textDecoration:tk.status==="completed"?"line-through":"none",fontWeight:500 }}>{tk.title}</span></TD>
            <TD><PriBadge p={tk.priority}/></TD>
            <TD><div style={{ display:"flex",alignItems:"center",gap:4 }}><Av user={asn} size={18}/><span style={{ fontSize:11 }}>{asn?.name}</span></div></TD>
            <TD muted>{rel?<span style={{ color:T.blue }}>{rel.name}</span>:"—"}</TD>
            <TD muted style={{ color:od?T.red:undefined }}>{tk.due||"—"}{od&&<span style={{ fontSize:10,marginLeft:3,color:T.red,fontWeight:700 }}>OVERDUE</span>}</TD>
            <TD>{tk.status==="open"&&<Btn sm variant="success" onClick={()=>done(tk.id)}>✓ Done</Btn>}</TD>
          </tr>;})}
      </tbody>
    </table>
  </div>;
}
// ─── HISTORY / NOTES ─────────────────────────────────────────────────────────

export { Pipeline, Roster };
