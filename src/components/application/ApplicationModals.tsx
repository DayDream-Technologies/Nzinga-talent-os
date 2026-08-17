// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, getVisibleSections, ageFromDob, isMinor, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { isEmailConfigured, sendApplicationInviteEmail } from "@/lib/email";

function SendApplicationModal({ talent, onSend, onClose, companyCode = "NZG" }) {
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [sendErr,setSendErr]=useState("");
  const [code]=useState(talent.name.toUpperCase().replace(/\s+/g,"").slice(0,4)+Math.floor(1000+Math.random()*8999));
  const method="email";
  const tenantCode=String(companyCode||"NZG").trim().toUpperCase();

  async function send(){
    const app={id:"app_"+talent.id+"_"+Date.now(),talent_id:talent.id,access_code:code,company_code:tenantCode,talent_name:talent.name,talent_email:email||"",status:"sent",created_at:new Date().toISOString(),last_saved:new Date().toISOString(),completed_sections:[],data:{},delivery_method:method};
    if(method==="email"&&email){
      setSending(true);setSendErr("");
      const result=await sendApplicationInviteEmail({toEmail:email,toName:talent.name,accessCode:code});
      if(result.status==="skipped"){
        setSendErr("Email delivery is not configured yet. Share the access code below with the prospect.");
      }else if(result.status==="failed"){
        setSendErr(`${result.message} Application and access code were saved.`);
      }
      setSending(false);
    }
    onSend(app);setSent(true);
  }

  if(sent){return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400 }}>
      <div style={{ background:"#fff",borderRadius:12,width:440,padding:28,textAlign:"center",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
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
  );}

  return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400 }}>
      <div style={{ background:"#fff",borderRadius:12,width:460,overflow:"hidden",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"2px solid "+T.purple,background:"#fafbfc",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div><div style={{ fontSize:14,fontWeight:700,color:T.t1 }}>Send Application — {talent.name}</div><div style={{ fontSize:11,color:T.t3,marginTop:1 }}>Invite prospect to complete their own application</div></div>
          <button onClick={onClose} style={{ background:"transparent",border:"none",fontSize:16,cursor:"pointer",color:T.t3 }}>✕</button>
        </div>
        <div style={{ padding:18 }}>
          <div style={{ marginBottom:12 }}><Lbl required>Talent Email Address</Lbl><FInput value={email} onChange={setEmail} placeholder="talent@email.com" type="email"/>{email&&<div style={{ marginTop:6,padding:"7px 10px",background:isEmailConfigured()?"#f0fdf4":"#fffbeb",border:`1px solid ${isEmailConfigured()?"#bbf7d0":"#fde68a"}`,borderRadius:6,fontSize:11,color:isEmailConfigured()?"#15803d":"#b45309" }}>{isEmailConfigured()?"📧 Will email invitation via Mailjet":"📋 Will save application — email delivery available in production"} <strong>{code}</strong></div>}</div>
          <div style={{ padding:"8px 10px",background:"#f8f9fb",border:"1px solid #e5e7eb",borderRadius:6,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:T.t3 }}>Generated code:</span>
            <span style={{ fontSize:13,fontWeight:800,color:T.purple,letterSpacing:"0.12em" }}>{code}</span>
          </div>
          <div style={{ display:"flex",gap:8 }}><Btn variant="purple" onClick={send} disabled={sending} full>{sending?"⟳ Sending…":"📧 Send Invitation"}</Btn><Btn variant="ghost" onClick={onClose}>Cancel</Btn></div>
        </div>
      </div>
    </div>
  );
}

// ─── APPLICATION REVIEW (staff side) ─────────────────────────────────────────
function ApplicationReview({ app, onClose, onImportToPipeline }) {
  const [tab,setTab]=useState("overview");
  const [viewingDoc,setViewingDoc]=useState(null);
  const d=app.data||{};
  const isSubmitted=app.status==="submitted";
  const isPendingGuardian=app.status==="pending_guardian"||app.guardian_status==="pending";
  const isComplete=isAppComplete(app);
  const visible=getVisibleSections(d);
  const progress=Math.round((visible.filter(s=>(app.completed_sections||[]).includes(s.id)&&validateSection(s.id,d).length===0).length/Math.max(visible.length,1))*100);
  const missingMap={};visible.forEach(s=>{missingMap[s.id]=validateSection(s.id,d);});
  const age=ageFromDob(d.dob);
  const interests=String(d.representation_interests||"").split(",").filter(Boolean);
  const docFields=Object.keys(d).filter(k=>k.startsWith("doc_")&&!k.endsWith("_name")&&!k.endsWith("_type")&&d[k]);
  const tabIds=["overview",...visible.map(s=>s.id),"documents","incomplete"];

  return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:350,padding:"16px 0",overflowY:"auto" }}>
      {viewingDoc&&<DocViewer doc={viewingDoc} onClose={()=>setViewingDoc(null)}/>}
      <div style={{ width:880,background:"#fff",borderRadius:10,overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"2px solid "+T.blue,background:"#fafbfc",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:T.t1,fontFamily:"'Syne',sans-serif" }}>Application Review — {app.talent_name}</div>
              <div style={{ display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ background:isPendingGuardian?T.amberL:isSubmitted?T.greenL:T.amberL,color:isPendingGuardian?T.amber:isSubmitted?T.green:T.amber,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>{isPendingGuardian?"GUARDIAN PENDING":isSubmitted?"SUBMITTED":"IN PROGRESS"}</span>
                {isMinor(d.dob)&&<span style={{ background:T.purpleL,color:T.purple,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>MINOR</span>}
                {d.currently_represented==="Yes"&&<span style={{ background:T.redL,color:T.red,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>EXISTING REP</span>}
                {isComplete&&isSubmitted&&!isPendingGuardian&&<span style={{ background:T.greenL,color:T.green,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>100% COMPLETE</span>}
                <span style={{ fontSize:11,color:T.t4 }}>Code: <strong style={{ color:T.purple }}>{app.access_code}</strong> · {progress}%</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              {isComplete&&isSubmitted&&!isPendingGuardian&&<Btn variant="success" sm onClick={onImportToPipeline}>Import to New / Lead</Btn>}
              <button onClick={onClose} style={{ background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,color:T.t3,cursor:"pointer",padding:"4px 10px",fontSize:12,fontFamily:"inherit" }}>✕</button>
            </div>
          </div>
        </div>

        <div style={{ display:"flex",borderBottom:"1px solid #e5e7eb",background:"#fff",flexShrink:0,overflowX:"auto" }}>
          {tabIds.map(t=><div key={t} onClick={()=>setTab(t)} style={{ padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t?600:400,color:tab===t?T.blue:T.t3,borderBottom:`2px solid ${tab===t?T.blue:"transparent"}`,textTransform:"capitalize",whiteSpace:"nowrap" }}>{t==="incomplete"?"Incomplete":t.replace(/_/g," ")}</div>)}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {tab==="overview"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
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
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1,fontWeight:500,textAlign:"right",maxWidth:"60%" }}>{v}</span></div>
              ))}
              <div style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:6 }}>{interests.map(n=><NichePill key={n} n={n}/>)}</div>
            </Section>
            <Section title="Flags & Goals" accent={isPendingGuardian||d.currently_represented==="Yes"?T.amber:T.green}>
              <div style={{ fontSize:12,color:T.t2,lineHeight:1.55,marginBottom:8 }}><strong>Goals:</strong> {d.career_goals||d.goals_1_2_years||"—"}</div>
              <div style={{ fontSize:12,color:T.t2,lineHeight:1.55,marginBottom:8 }}><strong>About:</strong> {d.about_yourself||"—"}</div>
              <div style={{ fontSize:12,marginBottom:4 }}>Guardian: <strong>{app.guardian_status||"not_required"}</strong>{app.guardian_email?` · ${app.guardian_email}`:""}</div>
              <div style={{ fontSize:12,marginBottom:4 }}>Existing representation: <strong>{d.currently_represented||"—"}</strong></div>
              <div style={{ fontSize:12,marginBottom:4 }}>Conflicts: <strong>{d.has_conflicting_obligations||"—"}</strong></div>
              <div style={{ fontSize:12 }}>Socials: {[d.link_instagram,d.link_tiktok,d.influencer_handle].filter(Boolean).join(" · ")||"—"}</div>
              <div style={{ marginTop:10,padding:"8px 10px",background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:6,fontSize:11,color:"#9a3412",lineHeight:1.45 }}>
                Scout boundary (SOP): Do not promise representation, guarantee bookings, offer contracts, or negotiate terms.
              </div>
            </Section>
            <Section title="Section Completion" accent={T.purple}>
              {visible.map(s=>{
                const done=(app.completed_sections||[]).includes(s.id);
                const missing=missingMap[s.id]||[];
                return <div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}>
                  <span style={{ color:T.t2 }}>{s.icon} {s.label}</span>
                  <span style={{ color:done&&missing.length===0?T.green:missing.length>0?T.red:T.t4,fontWeight:600 }}>{done&&missing.length===0?"Done":missing.length>0?`${missing.length} missing`:"Incomplete"}</span>
                </div>;
              })}
            </Section>
          </div>}

          {tab==="incomplete"&&<div>
            {visible.map(s=>{
              const missing=missingMap[s.id]||[];
              if(missing.length===0)return null;
              return <div key={s.id} style={{ background:"#fff",border:"1px solid #fca5a5",borderRadius:8,padding:12,marginBottom:10 }}>
                <div style={{ fontSize:12,fontWeight:700,color:T.red,marginBottom:8 }}>{s.label} — {missing.length} missing</div>
                {missing.map(fieldId=>{const field=s.fields.find(f=>f.id===fieldId);return <div key={fieldId} style={{ fontSize:12,padding:"4px 0" }}>{field?.label||fieldId}</div>;})}
              </div>;
            })}
          </div>}

          {tab==="documents"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {docFields.length===0&&<div style={{ gridColumn:"1/-1",fontSize:13,color:T.t3 }}>No documents uploaded yet.</div>}
            {docFields.map(fieldKey=>{
              const name=d[fieldKey+"_name"]||fieldKey;
              const type=d[fieldKey+"_type"]||"application/octet-stream";
              return <div key={fieldKey} style={{ border:"1px solid #86efac",borderRadius:8,padding:14,background:"#f0fdf4" }}>
                <div style={{ fontSize:12,fontWeight:700,marginBottom:8 }}>{String(name)}</div>
                <button onClick={()=>setViewingDoc({name:String(name),data:d[fieldKey],type:String(type),doc_type:fieldKey.replace(/^doc_/,""),uploaded_by:"applicant",status:"received"})} style={{ background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"100%" }}>View</button>
              </div>;
            })}
          </div>}

          {visible.some(s=>s.id===tab)&&(()=>{
            const secDef=APP_SECTIONS.find(s=>s.id===tab);if(!secDef)return null;
            return <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {secDef.fields.map(field=>{
                const val=d[field.id];
                const hasVal=val&&val.toString().trim();
                return <div key={field.id} style={{ gridColumn:field.type==="textarea"||field.type==="multicheck"||field.type==="checkbox"||field.type==="file_upload"?"1/-1":"auto" }}>
                  <Lbl>{field.label}</Lbl>
                  <div style={{ padding:"7px 10px",background:"#f8f9fb",border:"1px solid #e5e7eb",borderRadius:5,fontSize:12,color:hasVal?T.t1:T.t4,minHeight:30 }}>
                    {field.type==="checkbox"?(val?"Agreed":"—"):field.type==="multicheck"?(val||"").split(",").filter(Boolean).map(n=><NichePill key={n} n={n}/>):field.type==="file_upload"?(val?String(d[field.id+"_name"]||"Uploaded"):"—"):val||"—"}
                  </div>
                </div>;
              })}
            </div>;
          })()}
        </div>
      </div>
    </div>
  );
}
// ─── TOP NAV ──────────────────────────────────────────────────────────────────

export { SendApplicationModal, ApplicationReview };
