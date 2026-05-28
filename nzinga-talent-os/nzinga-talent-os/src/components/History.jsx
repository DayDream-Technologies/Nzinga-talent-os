import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "../data/constants.js";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "./ui.jsx";

function Reports({ talents, userRole }) {
  const [active,setActive]=useState("pipeline_summary");
  const accessible=ROLE_STAGE_ACCESS[userRole]||[];
  const visible=userRole==="director"?talents:talents.filter(t=>accessible.includes(t.stage));
  const rpts=[{id:"pipeline_summary",label:"Pipeline Summary"},{id:"jordan_scores",label:"Jordan Score Report"},{id:"revenue_forecast",label:"Revenue Forecast"},{id:"compliance_status",label:"Compliance Status"}];
  return <div style={{ padding:"14px 18px",flex:1,overflowY:"auto",display:"flex",gap:14 }}>
    <div style={{ width:170,flexShrink:0 }}>
      <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
        <div style={{ padding:"8px 10px",borderBottom:"2px solid "+T.blue,background:"#f8f9fb",fontSize:11,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.06em" }}>Reports</div>
        {rpts.map(r=><div key={r.id} onClick={()=>setActive(r.id)} style={{ padding:"7px 10px",cursor:"pointer",fontSize:12,color:active===r.id?T.blue:T.t2,background:active===r.id?"#eff6ff":"transparent",borderLeft:`3px solid ${active===r.id?T.blue:"transparent"}`,fontWeight:active===r.id?600:400 }}>{r.label}</div>)}
      </div>
    </div>
    <div style={{ flex:1 }}>
      <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
        {active==="pipeline_summary"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.blue,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Pipeline Summary</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Stage</TH><TH>Count</TH><TH>%</TH><TH>Bar</TH></tr></thead><tbody>
            {accessible.map(s=>{const c=visible.filter(t=>t.stage===s).length;if(!c)return null;return <tr key={s}><TD><StageBadge stage={s}/></TD><TD style={{fontWeight:700}}>{c}</TD><TD muted>{Math.round(c/Math.max(visible.length,1)*100)}%</TD><TD><div style={{ height:7,borderRadius:4,background:STAGE_COLORS[s],width:(c/Math.max(visible.length,1)*100)+"%",minWidth:4 }}/></TD></tr>;})}
          </tbody></table>
        </>}
        {active==="jordan_scores"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.purple,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Jordan Score Report</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Name</TH><TH>P1</TH><TH>P2</TH><TH>P3</TH><TH>P4</TH><TH>P5</TH><TH>Score</TH><TH>Status</TH></tr></thead><tbody>
            {visible.filter(t=>t.jordan_score>0).sort((a,b)=>b.jordan_score-a.jordan_score).map(t=>{const pass=t.jordan_score>=3.5&&t.pillar_scores.every(s=>s>=3);return <tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD>{t.pillar_scores.map((s,i)=><TD key={i} style={{color:s>=3?T.green:T.red,fontWeight:700,textAlign:"center"}}>{s}</TD>)}<TD><span style={{fontSize:15,fontWeight:800,color:t.jordan_score>=3.5?T.green:T.red}}>{t.jordan_score.toFixed(2)}</span></TD><TD><span style={{color:pass?T.green:T.red,fontSize:11,fontWeight:700}}>{pass?"✓ PASS":"✗ FAIL"}</span></TD></tr>;})}
          </tbody></table>
        </>}
        {active==="revenue_forecast"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.green,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Revenue Forecast</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Name</TH><TH>Stage</TH><TH>YTD</TH><TH>Projected</TH><TH>Rep</TH></tr></thead><tbody>
            {visible.filter(t=>!["archived","not_viable"].includes(t.stage)).sort((a,b)=>b.revenue_projected-a.revenue_projected).map(t=><tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD><TD><StageBadge stage={t.stage}/></TD><TD style={{color:T.green,fontWeight:700}}>{parseInt(t.revenue_ytd)>0?"$"+parseInt(t.revenue_ytd).toLocaleString():"—"}</TD><TD style={{color:T.cyan,fontWeight:700}}>{parseInt(t.revenue_projected)>0?"$"+parseInt(t.revenue_projected).toLocaleString():"—"}</TD><TD muted>{t.rep_type||"—"}</TD></tr>)}
          </tbody></table>
        </>}
        {active==="compliance_status"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.blue,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Compliance Status</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Name</TH><TH>Legal</TH><TH>ID</TH><TH>DOB</TH><TH>Address</TH><TH>Email</TH><TH>Tax</TH><TH>Bank</TH><TH>Social</TH><TH>Total</TH></tr></thead><tbody>
            {visible.filter(t=>Object.keys(t.compliance||{}).length>0).map(t=>{const keys=["legal_name","gov_id","dob","address","email_phone","tax_doc","banking","social_ownership"];const done=keys.filter(k=>t.compliance[k]).length;return <tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD>{keys.map(k=><TD key={k} style={{textAlign:"center"}}><span style={{color:t.compliance[k]?T.green:T.red,fontWeight:700}}>{t.compliance[k]?"✓":"✗"}</span></TD>)}<TD><span style={{color:done===8?T.green:T.amber,fontWeight:700}}>{done}/8</span></TD></tr>;})}
          </tbody></table>
        </>}
      </div>
    </div>
  </div>;
}

// ─── NEW ENTRY ────────────────────────────────────────────────────────────────

export { HistoryMod, Reports };
