import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "../data/constants.js";

const T = {
  pageBg:"#f0f2f5", cardBg:"#ffffff", cardBorder:"#e2e5ea",
  inputBg:"#f7f8fa", inputBorder:"#d1d5db",
  navBg:"#1a2332", navBorder:"#243044", navText:"#94a3b8",
  accentBg:"#1d6fa4",
  t1:"#111827", t2:"#374151", t3:"#6b7280", t4:"#9ca3af", t5:"#d1d5db",
  purple:"#7c3aed", purpleL:"#ede9fe",
  blue:"#2563eb", blueL:"#dbeafe",
  green:"#16a34a", greenL:"#dcfce7",
  amber:"#d97706", amberL:"#fef3c7",
  red:"#dc2626", redL:"#fee2e2",
  cyan:"#0891b2", cyanL:"#cffafe",
  orange:"#ea580c",
};

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
function Av({ user, size=28 }) {
  if (!user) return null;
  return <div style={{ width:size,height:size,borderRadius:"50%",background:user.color+"22",border:`2px solid ${user.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36+"px",fontWeight:700,color:user.color,flexShrink:0 }}>{user.initials}</div>;
}

function StageBadge({ stage }) {
  const c = STAGE_COLORS[stage]||"#6b7280";
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:600,color:c,background:c+"15",border:`1px solid ${c}33`,whiteSpace:"nowrap" }}><span style={{ width:5,height:5,borderRadius:"50%",background:c,flexShrink:0 }}/>{STAGE_LABELS[stage]||stage}</span>;
}

function NichePill({ n }) {
  const map = { Model:{bg:"#f3e8ff",c:"#7c3aed"},Actor:{bg:"#dbeafe",c:"#1d4ed8"},Influencer:{bg:"#d1fae5",c:"#065f46"},Athlete:{bg:"#fef3c7",c:"#92400e"} };
  const s = map[n]||{bg:"#f3f4f6",c:"#374151"};
  return <span style={{ background:s.bg,color:s.c,borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:500,marginRight:3 }}>{n}</span>;
}

function ScoreBar({ score }) {
  const c = score>=3.5?T.green:score>=3?T.amber:T.red;
  return <div style={{ display:"flex",alignItems:"center",gap:6 }}>
    <div style={{ flex:1,height:5,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ width:(score/5*100)+"%",height:"100%",background:c,borderRadius:3 }}/></div>
    <span style={{ fontSize:11,fontWeight:700,color:c,minWidth:24,textAlign:"right" }}>{score.toFixed(1)}</span>
  </div>;
}

function Toggle({ on, onChange, disabled }) {
  return <div onClick={()=>!disabled&&onChange(!on)} style={{ width:38,height:20,borderRadius:10,background:on?"#2563eb":"#d1d5db",position:"relative",cursor:disabled?"default":"pointer",transition:"background 0.15s",flexShrink:0 }}>
    <div style={{ width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",position:"absolute",top:2,left:on?20:2,transition:"left 0.12s" }}/>
  </div>;
}

function Btn({ children, variant="ghost", onClick, disabled, full, sm, style={} }) {
  const V = {
    primary:{background:T.blue,color:"#fff",border:"none"},
    success:{background:"#15803d",color:"#fff",border:"none"},
    danger:{background:T.red,color:"#fff",border:"none"},
    warning:{background:T.amber,color:"#fff",border:"none"},
    purple:{background:T.purple,color:"#fff",border:"none"},
    ghost:{background:"#fff",color:T.t2,border:"1px solid #d1d5db"},
    orange:{background:T.orange,color:"#fff",border:"none"},
    link:{background:"transparent",color:T.blue,border:"none"},
  };
  const v = V[variant]||V.ghost;
  return <button disabled={disabled} onClick={onClick} style={{ ...v,padding:sm?"3px 10px":"5px 14px",borderRadius:5,cursor:disabled?"not-allowed":"pointer",fontSize:sm?11:12,fontWeight:500,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5,opacity:disabled?0.5:1,width:full?"100%":undefined,justifyContent:full?"center":undefined,fontFamily:"inherit",boxShadow:"0 1px 2px rgba(0,0,0,0.06)",...style }}>{children}</button>;
}

function Lbl({ children, required }) {
  return <div style={{ fontSize:11,color:T.t3,fontWeight:500,marginBottom:3 }}>{children}{required&&<span style={{ color:T.red,marginLeft:2 }}>*</span>}</div>;
}

function FInput({ value, onChange, placeholder, type="text", style={}, readOnly, error }) {
  return <input type={type} value={value||""} readOnly={readOnly} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
    style={{ background:readOnly?"#f9fafb":error?"#fff5f5":T.inputBg, border:`1px solid ${error?"#dc2626":T.inputBorder}`, borderRadius:5, color:T.t1, padding:"6px 9px", fontSize:12, width:"100%", boxSizing:"border-box", outline:"none", fontFamily:"inherit", ...style }}/>;
}

function FTextarea({ value, onChange, placeholder, rows=3, readOnly, error }) {
  return <textarea rows={rows} value={value||""} readOnly={readOnly} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
    style={{ background:readOnly?"#f9fafb":error?"#fff5f5":T.inputBg, border:`1px solid ${error?"#dc2626":T.inputBorder}`, borderRadius:5, color:T.t1, padding:"6px 9px", fontSize:12, width:"100%", boxSizing:"border-box", outline:"none", resize:"vertical", fontFamily:"inherit" }}/>;
}

function FSelect({ value, onChange, options, style={}, disabled, error }) {
  return <select disabled={disabled} value={value||""} onChange={e=>onChange&&onChange(e.target.value)}
    style={{ background:T.inputBg, border:`1px solid ${error?"#dc2626":T.inputBorder}`, borderRadius:5, color:T.t1, padding:"6px 9px", fontSize:12, outline:"none", fontFamily:"inherit", ...style }}>
    {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
  </select>;
}

function TH({ children, style={} }) {
  return <th style={{ padding:"7px 10px",background:"#f8f9fb",borderBottom:"2px solid #e5e7eb",color:T.t3,fontWeight:600,textAlign:"left",fontSize:11,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.04em",...style }}>{children}</th>;
}
function TD({ children, style={}, muted }) {
  return <td style={{ padding:"8px 10px",borderBottom:"1px solid #f0f2f5",color:muted?T.t3:T.t2,verticalAlign:"middle",fontSize:12,...style }}>{children}</td>;
}

function Section({ title, action, children, accent, style={} }) {
  return <div style={{ background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:6,overflow:"hidden",...style }}>
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px",borderBottom:`2px solid ${accent||T.blue}`,background:"#fafbfc" }}>
      <span style={{ fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:"0.06em" }}>{title}</span>
      {action}
    </div>
    <div style={{ padding:"10px 12px" }}>{children}</div>
  </div>;
}

function PriBadge({ p }) {
  const map = { urgent:{bg:"#fee2e2",c:"#dc2626"},high:{bg:"#fef3c7",c:"#d97706"},medium:{bg:"#dbeafe",c:"#1d4ed8"},low:{bg:"#f3f4f6",c:"#6b7280"} };
  const s = map[p]||map.low;
  return <span style={{ background:s.bg,color:s.c,borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700,textTransform:"uppercase" }}>{p}</span>;
}

function HIcon({ type }) {
  const m = { note:{i:"✎",c:"#7c3aed"},call:{i:"✆",c:"#16a34a"},email:{i:"✉",c:"#2563eb"},task:{i:"☑",c:"#d97706"},document:{i:"📎",c:"#0891b2"},system:{i:"⚙",c:"#6b7280"} };
  const s = m[type]||m.system;
  return <span style={{ fontSize:14,color:s.c }}>{s.i}</span>;
}

// ─── FILE UPLOAD WIDGET ───────────────────────────────────────────────────────
function FileUpload({ fieldId, value, valueName, valueType, onChange, label, note, required, error, compact }) {
  const ref = useRef();
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onChange(fieldId, ev.target.result, file.name, file.type);
    };
    reader.readAsDataURL(file);
  }
  const hasFile = !!value;
  return (
    <div style={{ border:`2px dashed ${error?"#dc2626":hasFile?"#16a34a":"#d1d5db"}`, borderRadius:8, padding:compact?"8px 10px":"12px 14px", background:hasFile?"#f0fdf4":error?"#fff5f5":"#fafbfc", cursor:"pointer" }} onClick={()=>ref.current&&ref.current.click()}>
      <input ref={ref} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} style={{ display:"none" }}/>
      {hasFile ? (
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:18 }}>{valueType&&valueType.includes("pdf")?"📄":"🖼️"}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:600,color:T.green }}>{valueName||"File uploaded"}</div>
            <div style={{ fontSize:10,color:T.t4 }}>Click to replace</div>
          </div>
          <span style={{ color:T.green,fontWeight:700,fontSize:14 }}>✓</span>
        </div>
      ) : (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:compact?16:22,marginBottom:compact?0:4 }}>📎</div>
          <div style={{ fontSize:12,fontWeight:600,color:error?T.red:T.t2 }}>{label}{required&&<span style={{ color:T.red }}> *</span>}</div>
          {!compact&&note&&<div style={{ fontSize:10,color:T.t4,marginTop:2 }}>{note}</div>}
          {!compact&&<div style={{ fontSize:11,color:T.t3,marginTop:4 }}>Click to upload · PNG, JPG, PDF</div>}
          {error&&<div style={{ fontSize:10,color:T.red,marginTop:3,fontWeight:600 }}>⚠ Required document missing</div>}
        </div>
      )}
    </div>
  );
}

// View uploaded document (image or PDF preview)
function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  const isPdf = doc.type && doc.type.includes("pdf");
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600 }}>
      <div style={{ background:"#fff",borderRadius:10,overflow:"hidden",maxWidth:780,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ padding:"10px 16px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafbfc",flexShrink:0 }}>
          <span style={{ fontSize:13,fontWeight:700,color:T.t1 }}>{doc.name}</span>
          <button onClick={onClose} style={{ background:"transparent",border:"none",fontSize:16,cursor:"pointer",color:T.t3 }}>✕</button>
        </div>
        <div style={{ flex:1,overflow:"auto",padding:16,minWidth:500 }}>
          {isPdf ? (
            <iframe src={doc.data} title={doc.name} style={{ width:"100%",height:"60vh",border:"none" }}/>
          ) : (
            <img src={doc.data} alt={doc.name} style={{ maxWidth:"100%",maxHeight:"70vh",display:"block",margin:"0 auto",borderRadius:6 }}/>
          )}
        </div>
      </div>
    </div>
  );
}

// Incomplete section alert with jump link
function IncompleteSectionAlert({ missingMap, onJump, dark }) {
  const incomplete = Object.entries(missingMap).filter(([,fields])=>fields.length>0);
  if (!incomplete.length) return null;
  const bg = dark ? "rgba(220,38,38,0.12)" : T.redL;
  const border = dark ? "rgba(220,38,38,0.35)" : "#fca5a5";
  const textColor = dark ? "#fca5a5" : T.red;
  return (
    <div style={{ background:bg,border:`1px solid ${border}`,borderRadius:8,padding:"10px 14px",marginBottom:12 }}>
      <div style={{ fontSize:12,fontWeight:700,color:textColor,marginBottom:6 }}>⚠ Incomplete sections — required fields missing</div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {incomplete.map(([secId, fields])=>{
          const sec = APP_SECTIONS.find(s=>s.id===secId);
          return (
            <button key={secId} onClick={()=>onJump&&onJump(secId)} style={{ background:"transparent",border:`1px solid ${textColor}`,borderRadius:6,padding:"3px 10px",fontSize:11,color:textColor,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textDecoration:"underline" }}>
              {sec?.icon} {sec?.label} ({fields.length} missing)
            </button>
          );
        })}
      </div>
    </div>
  );
}



// ─── COMPANY CODE SCREEN ──────────────────────────────────────────────────────

export { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert };
