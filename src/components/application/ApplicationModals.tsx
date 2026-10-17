// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, getVisibleSections, ageFromDob, isMinor, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { completedSectionsFromData, prefillApplicationData } from "@/lib/application-prefill";
import { applicationUploadFieldIds, fileFromApplication, immediateFileUrl } from "@/lib/file-access";
import { jordanScoreFromPillars, jordanScoreMeetsThreshold } from "@/lib/jordan-score";
import { JordanScorePanel } from "@/components/application/JordanScorePanel";

/**
 * @param {{ talent: any, prospect?: any, onSend: Function, onClose: Function, companyCode?: string }} props
 */
function SendApplicationModal({ talent, prospect, onSend, onClose, companyCode = "NZG" }) {
  const [email,setEmail]=useState(talent.email || prospect?.email || "");
  const [sent,setSent]=useState(false);
  const [sendErr,setSendErr]=useState("");
  const [code]=useState((talent.name||prospect?.name||"APPL").toUpperCase().replace(/\s+/g,"").slice(0,4)+Math.floor(1000+Math.random()*8999));
  const method="email";
  const tenantCode=String(companyCode||"NZG").trim().toUpperCase();

  function send(){
    const data=prefillApplicationData({ talent, prospect, existing: talent.application_data });
    const app={
      id:"app_"+talent.id+"_"+Date.now(),
      talent_id:talent.id,
      access_code:code,
      company_code:tenantCode,
      talent_name:talent.name||prospect?.name||"",
      talent_email:email||data.email||"",
      status:"sent",
      created_at:new Date().toISOString(),
      last_saved:new Date().toISOString(),
      completed_sections:completedSectionsFromData({ ...data, email: email || data.email }),
      data:{ ...data, email: email || data.email || "" },
      delivery_method:method,
    };
    if(method==="email"&&email){
      setSendErr("Share the access code below with the prospect. Auth emails (signup, reset, guardian links) are sent by Supabase.");
    }
    onSend(app);setSent(true);
  }

  if(sent){return createPortal(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
      <div style={{ background: T.cardBg,borderRadius:12,width:440,padding:28,textAlign:"center",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize:40,marginBottom:10 }}>✅</div>
        <div style={{ fontSize:17,fontWeight:700,color:T.t1,marginBottom:6,fontFamily:"'Syne',sans-serif" }}>Application Ready!</div>
        <div style={{ fontSize:13,color:T.t3,marginBottom:16,lineHeight:1.6 }}>
          {method==="email"?`Invitation prepared for ${email}. `:"Code generated for in-person delivery. "}
          {sendErr&&<span style={{ color:T.amber }}>{sendErr}</span>}
        </div>
        <div style={{ background:T.purpleL,border:`1px solid ${T.purple}44`,borderRadius:8,padding:"12px 16px",marginBottom:16 }}>
          <div style={{ fontSize:11,color:T.purple,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3 }}>Access Code</div>
          <div style={{ fontSize:24,fontWeight:800,color:T.purple,letterSpacing:"0.15em" }}>{code}</div>
          <div style={{ fontSize:11,color:T.t4,marginTop:3 }}>Prospect uses this at the Nzinga Portal to access their application</div>
        </div>
        <Btn variant="primary" onClick={onClose} full>Done</Btn>
      </div>
    </div>
  ,document.body);}

  return createPortal(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
      <div style={{ background: T.cardBg,borderRadius:12,width:460,overflow:"hidden",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"2px solid "+T.purple,background:T.mutedBg,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div><div style={{ fontSize:14,fontWeight:700,color:T.t1 }}>Send Application — {talent.name}</div><div style={{ fontSize:11,color:T.t3,marginTop:1 }}>Invite prospect to complete their own application</div></div>
          <button onClick={onClose} style={{ background:"transparent",border:"none",fontSize:16,cursor:"pointer",color:T.t3 }}>✕</button>
        </div>
        <div style={{ padding:18 }}>
          <div style={{ marginBottom:12 }}><Lbl required>Talent Email Address</Lbl><FInput value={email} onChange={setEmail} placeholder="talent@email.com" type="email"/>{email&&<div style={{ marginTop:6,padding:"7px 10px",background:T.amberL,border:`1px solid ${T.amber}55`,borderRadius:6,fontSize:11,color:T.amber }}>📋 Invitation will be saved. Share access code <strong>{code}</strong> with the prospect.</div>}</div>
          <div style={{ padding:"8px 10px",background:T.mutedBg,border:`1px solid ${T.cardBorder}`,borderRadius:6,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:T.t3 }}>Generated code:</span>
            <span style={{ fontSize:13,fontWeight:800,color:T.purple,letterSpacing:"0.12em" }}>{code}</span>
          </div>
          <div style={{ display:"flex",gap:8 }}><Btn variant="purple" onClick={send} full>Save Invitation</Btn><Btn variant="ghost" onClick={onClose}>Cancel</Btn></div>
        </div>
      </div>
    </div>
  ,document.body);
}

// ─── APPLICATION REVIEW (staff side) ─────────────────────────────────────────
function ApplicationReview({ app, onClose, onImportToPipeline, talent, canScore, onScore }) {
  const [tab,setTab]=useState("overview");
  const [viewingDoc,setViewingDoc]=useState(null);
  const [importing,setImporting]=useState(false);
  const d=app.data||{};
  const isSubmitted=app.status==="submitted";
  const isPendingGuardian=app.status==="pending_guardian"||app.guardian_status==="pending";
  const isComplete=isAppComplete(app);
  const visible=getVisibleSections(d);
  const completedCount=visible.filter(s=>(app.completed_sections||[]).includes(s.id)&&validateSection(s.id,d).length===0).length;
  const progress=Math.round((completedCount/Math.max(visible.length,1))*100);
  const missingMap={};visible.forEach(s=>{missingMap[s.id]=validateSection(s.id,d);});
  const totalMissing=Object.values(missingMap).reduce((sum,arr)=>sum+arr.length,0);
  const age=ageFromDob(d.dob);
  const interests=String(d.representation_interests||"").split(",").filter(Boolean);
  function uploadLabel(fieldId){
    for(const sec of APP_SECTIONS){
      const field=sec.fields.find(f=>f.id===fieldId);
      if(field) return field.label;
    }
    return fieldId;
  }
  const uploads=applicationUploadFieldIds(d).map(id=>fileFromApplication(d,id,uploadLabel(id))).filter(Boolean);
  const scoreTalent=talent||{
    id:"t_app_"+app.id,
    pillar_scores:[0,0,0,0,0],
    pillar_rationales:["","","","",""],
    jordan_score:0,
  };
  const jordanAverage=jordanScoreFromPillars(scoreTalent.pillar_scores);
  const jordanMeets=jordanScoreMeetsThreshold(scoreTalent.pillar_scores);
  const jordanColor=jordanMeets?T.green:jordanAverage>0?T.red:T.purple;
  const jordanTint=jordanMeets?T.greenL:jordanAverage>0?T.redL:T.purpleL;
  const tabIds=["overview","jordan",...visible.map(s=>s.id),"documents","incomplete"];

  function tabLabel(t){
    if(t==="overview") return "Overview";
    if(t==="jordan") return "Jordan Score";
    if(t==="documents") return "Documents";
    if(t==="incomplete") return "Incomplete";
    const sec=visible.find(s=>s.id===t);
    return sec?sec.label:t.replace(/_/g," ");
  }
  function tabIcon(t){
    if(t==="overview") return "📋";
    if(t==="jordan") return "★";
    if(t==="documents") return "📁";
    if(t==="incomplete") return "⚠️";
    const sec=visible.find(s=>s.id===t);
    return sec?.icon||"";
  }
  function tabDone(t){
    if(t==="overview"||t==="jordan"||t==="documents"||t==="incomplete") return false;
    const sec=visible.find(s=>s.id===t);
    if(!sec) return false;
    return (app.completed_sections||[]).includes(sec.id)&&(missingMap[sec.id]||[]).length===0;
  }
  function tabHasMissing(t){
    if(t==="overview"||t==="jordan"||t==="documents"||t==="incomplete") return false;
    return (missingMap[t]||[]).length>0;
  }
  function tabIndex(t){
    const secIdx=visible.findIndex(s=>s.id===t);
    return secIdx>=0?secIdx+1:0;
  }

  const stepIdx=tabIds.indexOf(tab);
  const prevTab=stepIdx>0?tabIds[stepIdx-1]:null;
  const nextTab=stepIdx>=0&&stepIdx<tabIds.length-1?tabIds[stepIdx+1]:null;

  return createPortal(
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16 }}>
      {viewingDoc&&<DocViewer doc={viewingDoc} onClose={()=>setViewingDoc(null)}/>}
      <div style={{ width:"min(1040px, 96vw)",background:T.cardBg,borderRadius:14,overflow:"hidden",height:"min(860px, 92vh)",display:"flex",flexDirection:"column",boxShadow:"0 16px 56px rgba(0,0,0,0.22)" }}>
        {/* ── Header ── */}
        <div style={{ padding:"14px 20px",borderBottom:`2px solid ${T.blue}`,background:T.mutedBg,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:16,fontWeight:700,color:T.t1,fontFamily:"'Syne',sans-serif" }}>Application Review — {app.talent_name}</div>
              <div style={{ display:"flex",gap:8,marginTop:6,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ background:isPendingGuardian?T.amberL:isSubmitted?T.greenL:T.amberL,color:isPendingGuardian?T.amber:isSubmitted?T.green:T.amber,borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700 }}>{isPendingGuardian?"PENDING PARENT APPROVAL":isSubmitted?"SUBMITTED":"IN PROGRESS"}</span>
                {isMinor(d.dob)&&<span style={{ background:T.purpleL,color:T.purple,borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700 }}>MINOR</span>}
                {d.currently_represented==="Yes"&&<span style={{ background:T.redL,color:T.red,borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700 }}>EXISTING REP</span>}
                {isComplete&&isSubmitted&&!isPendingGuardian&&<span style={{ background:T.greenL,color:T.green,borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700 }}>100% COMPLETE</span>}
                <span style={{ fontSize:11,color:T.t4 }}>Code: <strong style={{ color:T.purple }}>{app.access_code}</strong></span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <button type="button" onClick={()=>setTab("jordan")} style={{ background:jordanTint,border:`1px solid ${jordanColor}55`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"center",minWidth:72 }}>
                <div style={{ fontSize:18,fontWeight:800,color:jordanColor,fontFamily:"'Syne',sans-serif",lineHeight:1 }}>{jordanAverage.toFixed(2)}</div>
                <div style={{ fontSize:9,color:jordanColor,fontWeight:700,letterSpacing:"0.06em",marginTop:2 }}>JORDAN</div>
              </button>
              {isComplete&&isSubmitted&&!isPendingGuardian&&<Btn variant="success" loading={importing} disabled={importing} onClick={async ()=>{ if(importing) return; setImporting(true); try { await onImportToPipeline?.(); } finally { setImporting(false); } }}>{importing?"Importing…":"Import to Pipeline"}</Btn>}
              <button type="button" aria-label="Close review" onClick={onClose} style={{ background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:8,color:T.t2,cursor:"pointer",padding:"8px 12px",fontSize:13,fontFamily:"inherit" }}>Close</button>
            </div>
          </div>
        </div>

        {/* ── Body: sidebar + content ── */}
        <div style={{ display:"flex",flex:1,overflow:"hidden",minHeight:0 }}>
          {/* ── Sidebar ── */}
          <div style={{ width:228,flexShrink:0,background:T.mutedBg,borderRight:`1px solid ${T.cardBorder}`,display:"flex",flexDirection:"column",overflowY:"auto" }}>
            {/* Progress */}
            <div style={{ padding:"14px 14px 10px" }}>
              <div style={{ fontSize:11,color:T.t3,marginBottom:5,display:"flex",justifyContent:"space-between" }}>
                <span>Progress</span>
                <span style={{ color:T.green,fontWeight:700 }}>{progress}%</span>
              </div>
              <div style={{ height:5,background:T.cardBorder,borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",width:progress+"%",background:`linear-gradient(90deg,${T.purple},${T.blue})`,borderRadius:3,transition:"width 0.4s" }}/>
              </div>
              <div style={{ fontSize:10,color:T.t4,marginTop:4 }}>{completedCount} of {visible.length} sections complete</div>
            </div>

            {/* Tab buttons */}
            <div style={{ flex:1 }}>
              {tabIds.map((t,i)=>{
                const active=tab===t;
                const done=tabDone(t);
                const hasMissing=tabHasMissing(t);
                const idx=tabIndex(t);
                const isSpecial=t==="overview"||t==="jordan"||t==="documents"||t==="incomplete";
                const borderColor=active?T.blue:t==="jordan"&&jordanAverage>0?jordanColor:done?T.green:hasMissing?T.red:"transparent";
                const circleBg=done?T.green:hasMissing?T.red:t==="jordan"?jordanColor:active?T.blue:T.cardBorder;
                const circleContent=done?"✓":isSpecial?tabIcon(t):String(idx);
                return <button type="button" key={t} aria-label={tabLabel(t)} onClick={()=>setTab(t)} style={{
                  width:"100%",
                  textAlign:"left",
                  padding:"9px 12px",
                  cursor:"pointer",
                  background:active?T.blueL:"transparent",
                  border:"none",
                  borderLeft:`3px solid ${borderColor}`,
                  borderRadius:0,
                  display:"flex",alignItems:"center",gap:8,
                  marginBottom:1,
                  fontFamily:"inherit",
                  transition:"background 0.15s",
                }}>
                  <div style={{
                    width:22,height:22,borderRadius:"50%",
                    background:circleBg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:isSpecial&&!done?12:10,fontWeight:700,
                    color:done||active||hasMissing||t==="jordan"?"#fff":T.t3,
                    flexShrink:0,lineHeight:1,
                  }}>{circleContent}</div>
                  <span style={{ fontSize:12,fontWeight:active||t==="jordan"?700:400,color:active?T.t1:t==="jordan"?jordanColor:T.t3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                    {tabLabel(t)}
                  </span>
                  {t==="jordan"&&<span style={{ marginLeft:"auto",background:jordanTint,color:jordanColor,borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700,flexShrink:0 }}>{jordanAverage.toFixed(1)}</span>}
                  {t==="incomplete"&&totalMissing>0&&<span style={{ marginLeft:"auto",background:T.redL,color:T.red,borderRadius:10,padding:"0 6px",fontSize:10,fontWeight:700,flexShrink:0 }}>{totalMissing}</span>}
                  {t==="documents"&&<span style={{ marginLeft:"auto",background:T.blueL,color:T.blue,borderRadius:10,padding:"0 6px",fontSize:10,fontWeight:700,flexShrink:0 }}>{uploads.length}</span>}
                </button>;
              })}
            </div>

            {/* Bottom action */}
            <div style={{ padding:"12px 14px",borderTop:`1px solid ${T.cardBorder}` }}>
              {isComplete&&isSubmitted&&!isPendingGuardian
                ?<Btn variant="success" full loading={importing} disabled={importing} onClick={async ()=>{ if(importing) return; setImporting(true); try { await onImportToPipeline?.(); } finally { setImporting(false); } }}>{importing?"Importing…":"Import to Pipeline"}</Btn>
                :<div style={{ fontSize:10,color:T.t4,textAlign:"center",lineHeight:1.5 }}>{totalMissing>0?`${totalMissing} field${totalMissing===1?"":"s"} still missing`:"Application not ready to import"}</div>}
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ flex:1,minWidth:0,minHeight:0,display:"flex",flexDirection:"column" }}>
          <div style={{ flex:1,minWidth:0,overflowY:"auto",overflowX:"hidden",padding:"20px 22px 12px" }}>
            {/* Section heading */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                <span style={{ fontSize:20 }}>{tabIcon(tab)}</span>
                <div style={{ fontSize:18,fontWeight:700,color:T.t1,fontFamily:"'Syne',sans-serif" }}>{tabLabel(tab)}</div>
              </div>
              {tab==="jordan"&&<div style={{ fontSize:12,color:T.t3 }}>Scout scoring · saved on the talent record</div>}
              {visible.some(s=>s.id===tab)&&(()=>{
                const secIdx=visible.findIndex(s=>s.id===tab);
                return <div style={{ fontSize:12,color:T.t3 }}>Section {secIdx+1} of {visible.length}{age!==null?` · Age ${age}`:""}</div>;
              })()}
            </div>

            {tab==="overview"&&<div style={{ display:"flex",flexDirection:"column",gap:14,minWidth:0 }}>
              <button type="button" onClick={()=>setTab("jordan")} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,width:"100%",textAlign:"left",cursor:"pointer",fontFamily:"inherit",padding:"14px 16px",borderRadius:10,background:jordanTint,border:`1px solid ${jordanColor}55` }}>
                <div>
                  <div style={{ fontSize:12,fontWeight:800,letterSpacing:"0.08em",color:jordanColor }}>JORDAN SCORE</div>
                  <div style={{ fontSize:13,color:T.t1,marginTop:4,fontWeight:600 }}>{jordanMeets?"Meets the 3.5 threshold":jordanAverage>0?"Below the 3.5 threshold":"Not scored yet"}</div>
                  <div style={{ fontSize:12,color:T.t3,marginTop:2 }}>Open to score the five pillars</div>
                </div>
                <div style={{ fontSize:32,fontWeight:800,color:jordanColor,fontFamily:"'Syne',sans-serif",lineHeight:1 }}>{jordanAverage.toFixed(2)}</div>
              </button>
              <Section title="Quick Profile" accent={T.blue}>
                {[
                  ["Name",[d.legal_first,d.legal_last].filter(Boolean).join(" ")||app.talent_name],
                  ["Preferred",d.preferred_name||"—"],
                  ["Age",age!==null?String(age):"—"],
                  ["Location",[d.city,d.state,d.country].filter(Boolean).join(", ")||"—"],
                  ["Market",d.current_market||"—"],
                  ["Experience",d.experience_level||"—"],
                  ["Travel",d.willing_to_travel||"—"],
                  ["Available",d.currently_available||"—"],
                  ["Work markets",d.work_markets||"—"],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",gap:12,padding:"5px 0",borderBottom:`1px solid ${T.cardBorder}`,fontSize:12,minWidth:0 }}><span style={{ color:T.t3,flexShrink:0 }}>{k}</span><span style={{ color:T.t1,fontWeight:500,textAlign:"right",overflowWrap:"anywhere" }}>{v}</span></div>
                ))}
                <div style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:6 }}>{interests.map(n=><NichePill key={n} n={n}/>)}</div>
              </Section>
              <Section title="Flags & Goals" accent={isPendingGuardian||d.currently_represented==="Yes"?T.amber:T.green}>
                <div style={{ fontSize:12,color:T.t2,lineHeight:1.55,marginBottom:8,overflowWrap:"anywhere" }}><strong>Goals:</strong> {d.career_goals||d.goals_1_2_years||"—"}</div>
                <div style={{ fontSize:12,color:T.t2,lineHeight:1.55,marginBottom:8,overflowWrap:"anywhere" }}><strong>About:</strong> {d.about_yourself||"—"}</div>
                <div style={{ fontSize:12,marginBottom:4,overflowWrap:"anywhere" }}>Guardian: <strong>{app.guardian_status||"not_required"}</strong>{app.guardian_email?` · ${app.guardian_email}`:""}</div>
                <div style={{ fontSize:12,marginBottom:4,overflowWrap:"anywhere" }}>Existing representation: <strong>{d.currently_represented||"—"}</strong></div>
                <div style={{ fontSize:12,marginBottom:4,overflowWrap:"anywhere" }}>Conflicts: <strong>{d.has_conflicting_obligations||"—"}</strong></div>
                <div style={{ fontSize:12,overflowWrap:"anywhere" }}>Socials: {[d.link_instagram,d.link_tiktok,d.influencer_handle].filter(Boolean).join(" · ")||"—"}</div>
                <div style={{ marginTop:10,padding:"8px 10px",background:T.amberL,border:`1px solid ${T.amber}55`,borderRadius:6,fontSize:11,color:T.amber,lineHeight:1.45,overflowWrap:"anywhere" }}>
                  Scout boundary (SOP): Do not promise representation, guarantee bookings, offer contracts, or negotiate terms.
                </div>
              </Section>
              <Section title="Section Completion" accent={T.purple}>
                {visible.map(s=>{
                  const done=(app.completed_sections||[]).includes(s.id);
                  const missing=missingMap[s.id]||[];
                  return <div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.cardBorder}`,fontSize:12 }}>
                    <span style={{ color:T.t2 }}>{s.icon} {s.label}</span>
                    <span style={{ color:done&&missing.length===0?T.green:missing.length>0?T.red:T.t4,fontWeight:600 }}>{done&&missing.length===0?"Done":missing.length>0?`${missing.length} missing`:"Incomplete"}</span>
                  </div>;
                })}
              </Section>
            </div>}

            {tab==="jordan"&&<JordanScorePanel talent={scoreTalent} canEdit={!!canScore} onScore={onScore} />}

            {tab==="incomplete"&&<div>
              {totalMissing===0&&<div style={{ fontSize:13,color:T.green,fontWeight:600,padding:16,textAlign:"center" }}>All sections complete — no missing fields.</div>}
              {visible.map(s=>{
                const missing=missingMap[s.id]||[];
                if(missing.length===0)return null;
                return <div key={s.id} style={{ background:T.cardBg,border:`1px solid ${T.red}44`,borderRadius:8,padding:14,marginBottom:10 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:T.red,marginBottom:8 }}>{s.icon} {s.label} — {missing.length} missing</div>
                  {missing.map(fieldId=>{const field=s.fields.find(f=>f.id===fieldId);return <div key={fieldId} style={{ fontSize:12,padding:"4px 0",color:T.t2 }}>{field?.label||fieldId}</div>;})}
                </div>;
              })}
            </div>}

            {tab==="documents"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {uploads.length===0&&<div style={{ gridColumn:"1/-1",fontSize:13,color:T.t3 }}>No documents uploaded yet.</div>}
              {uploads.map(doc=>{
                const preview=immediateFileUrl(doc);
                const showImage=Boolean(preview)&&String(doc.type||"").startsWith("image/");
                return <div key={doc.doc_type||doc.name} style={{ border:`1px solid ${T.green}44`,borderRadius:8,padding:14,background:T.greenL }}>
                  <div style={{ fontSize:11,color:T.t3,marginBottom:2 }}>{uploadLabel("doc_"+(doc.doc_type||""))}</div>
                  <div style={{ fontSize:12,fontWeight:700,marginBottom:8,color:T.t1 }}>{doc.name}</div>
                  {showImage&&<img src={preview} alt="" style={{ width:"100%",maxHeight:160,objectFit:"cover",borderRadius:6,marginBottom:8 }}/>}
                  <button onClick={()=>setViewingDoc(doc)} style={{ background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"100%" }}>View</button>
                </div>;
              })}
            </div>}

            {visible.some(s=>s.id===tab)&&(()=>{
              const secDef=APP_SECTIONS.find(s=>s.id===tab);if(!secDef)return null;
              const missing=missingMap[tab]||[];
              return <>
                {missing.length>0&&<div style={{ background:T.redL,border:`1px solid ${T.red}44`,borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:T.red,fontWeight:600 }}>
                  {missing.length} required field{missing.length>1?"s":""} missing in this section
                </div>}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  {secDef.fields.map(field=>{
                    const val=d[field.id];
                    const hasVal=val&&val.toString().trim();
                    if(field.type==="note")return <div key={field.id} style={{ gridColumn:"1/-1",padding:"10px 12px",borderRadius:8,background:T.blueL,border:`1px solid ${T.blue}33`,fontSize:13,color:T.t1,lineHeight:1.5 }}>{field.label}</div>;
                    const isMissing=missing.includes(field.id);
                    return <div key={field.id} style={{ gridColumn:field.type==="textarea"||field.type==="multicheck"||field.type==="checkbox"||field.type==="file_upload"?"1/-1":"auto" }}>
                      <Lbl>{field.label}</Lbl>
                      <div style={{ padding:"8px 12px",background:isMissing?T.redL:T.mutedBg,border:`1px solid ${isMissing?T.red+"66":T.cardBorder}`,borderRadius:6,fontSize:13,color:hasVal?T.t1:T.t4,minHeight:32,lineHeight:1.5 }}>
                        {field.type==="checkbox"?(val?"Agreed":"—"):field.type==="multicheck"?(val||"").split(",").filter(Boolean).map(n=><NichePill key={n} n={n}/>):field.type==="file_upload"?(val?(()=>{const doc=fileFromApplication(d,field.id,field.label);return <span style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8 }}><span>{String(d[field.id+"_name"]||doc?.name||"Uploaded")}</span>{doc&&<button type="button" onClick={()=>setViewingDoc(doc)} style={{ background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>View</button>}</span>;})():"—"):val||"—"}
                      </div>
                    </div>;
                  })}
                </div>
              </>;
            })()}

          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"12px 22px",borderTop:`1px solid ${T.cardBorder}`,background:T.cardBg,flexShrink:0 }}>
            <div>{prevTab&&<button type="button" onClick={()=>setTab(prevTab)} style={{ background:T.mutedBg,border:`1px solid ${T.cardBorder}`,color:T.t2,borderRadius:8,padding:"8px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>← {tabLabel(prevTab)}</button>}</div>
            <div style={{ fontSize:11,color:T.t4 }}>{stepIdx+1} of {tabIds.length}</div>
            <div>{nextTab&&<button type="button" onClick={()=>setTab(nextTab)} style={{ background:T.blue,border:"none",color:"#fff",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{tabLabel(nextTab)} →</button>}</div>
          </div>
          </div>
        </div>
      </div>
    </div>
  ,document.body);
}
// ─── TOP NAV ──────────────────────────────────────────────────────────────────

export { SendApplicationModal, ApplicationReview };
