import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "../data/constants.js";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "./ui.jsx";

function SendApplicationModal({ talent, onSend, onClose }) {
  const [method,setMethod]=useState("email");
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [sendErr,setSendErr]=useState("");
  const [code]=useState(talent.name.toUpperCase().replace(/\s+/g,"").slice(0,4)+Math.floor(1000+Math.random()*8999));

  async function send(){
    const app={id:"app_"+talent.id+"_"+Date.now(),talent_id:talent.id,access_code:code,talent_name:talent.name,talent_email:email||"(in-person)",status:"sent",created_at:new Date().toISOString(),last_saved:new Date().toISOString(),completed_sections:[],data:{},delivery_method:method};
    if(method==="email"&&email){
      setSending(true);setSendErr("");
      try {
        // EmailJS — uses public API, no server needed
        // Note: In production, configure your EmailJS service/template IDs
        const payload={service_id:"service_nzinga",template_id:"template_app_invite",user_id:"public_key_placeholder",
          template_params:{to_email:email,to_name:talent.name,access_code:code,portal_link:"https://nzinga.co/apply",from_name:"Nzinga Talent Group"}};
        const res=await fetch("https://api.emailjs.com/api/v1.0/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(!res.ok){setSendErr("Email service not configured (demo mode). Code generated successfully.");} 
      } catch(e){setSendErr("Email service unavailable in demo (no live credentials). Code generated successfully.");}
      setSending(false);
    }
    onSend(app);setSent(true);
  }

  if(sent){return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400 }}>
      <div style={{ background:"#fff",borderRadius:12,width:440,padding:28,textAlign:"center",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize:40,marginBottom:10 }}>✅</div>
        <div style={{ fontSize:17,fontWeight:700,color:T.t1,marginBottom:6,fontFamily:"Georgia,serif" }}>Application Ready!</div>
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
          <div style={{ marginBottom:14 }}>
            <Lbl>Delivery Method</Lbl>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {[["email","📧","Email Link"],["inperson","🤝","In-Person Code"],["link","🔗","Copy Link"]].map(([v,icon,label])=>(
                <div key={v} onClick={()=>setMethod(v)} style={{ padding:"10px 8px",borderRadius:8,border:`2px solid ${method===v?T.purple:"#e5e7eb"}`,background:method===v?T.purpleL:"#fff",cursor:"pointer",textAlign:"center" }}>
                  <div style={{ fontSize:18,marginBottom:3 }}>{icon}</div>
                  <div style={{ fontSize:11,fontWeight:600,color:method===v?T.purple:T.t2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {method==="email"&&<div style={{ marginBottom:12 }}><Lbl required>Talent Email Address</Lbl><FInput value={email} onChange={setEmail} placeholder="talent@email.com" type="email"/>{email&&<div style={{ marginTop:6,padding:"7px 10px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:6,fontSize:11,color:"#15803d" }}>📧 Will email invitation with code <strong>{code}</strong></div>}</div>}
          {method==="inperson"&&<div style={{ marginBottom:12,padding:14,background:T.purpleL,border:`1px solid ${T.purple}33`,borderRadius:8,textAlign:"center" }}><div style={{ fontSize:11,color:T.purple,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3 }}>Show this code to the talent</div><div style={{ fontSize:30,fontWeight:800,color:T.purple,letterSpacing:"0.2em" }}>{code}</div><div style={{ fontSize:11,color:T.t4,marginTop:4 }}>They enter this at the portal to start their application</div></div>}
          {method==="link"&&<div style={{ marginBottom:12 }}><Lbl>Shareable Link</Lbl><div style={{ display:"flex",gap:6 }}><FInput value={`https://nzinga.co/apply?code=${code}`} readOnly style={{ fontFamily:"monospace",fontSize:11 }}/><Btn sm variant="ghost" onClick={()=>{}}>Copy</Btn></div><div style={{ marginTop:6,fontSize:11,color:T.t4 }}>Send via text, DM, or any platform</div></div>}
          <div style={{ padding:"8px 10px",background:"#f8f9fb",border:"1px solid #e5e7eb",borderRadius:6,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:T.t3 }}>Generated code:</span>
            <span style={{ fontSize:13,fontWeight:800,color:T.purple,letterSpacing:"0.12em" }}>{code}</span>
          </div>
          <div style={{ display:"flex",gap:8 }}><Btn variant="purple" onClick={send} disabled={sending} full>{sending?"⟳ Sending…":method==="email"?"📧 Send Invitation":method==="inperson"?"🤝 Create Code":"🔗 Generate Link"}</Btn><Btn variant="ghost" onClick={onClose}>Cancel</Btn></div>
        </div>
      </div>
    </div>
  );
}

// ─── APPLICATION REVIEW (staff side) ─────────────────────────────────────────
function ApplicationReview({ app, onClose, onImportToPipeline }) {
  const [tab,setTab]=useState("overview");
  const [viewingDoc,setViewingDoc]=useState(null);
  const isSubmitted=app.status==="submitted";
  const isComplete=isAppComplete(app);
  const progress=Math.round(((app.completed_sections||[]).length/APP_SECTIONS.length)*100);
  const missingMap={};APP_SECTIONS.forEach(s=>{missingMap[s.id]=validateSection(s.id,app.data||{});});

  return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:350,padding:"16px 0",overflowY:"auto" }}>
      {viewingDoc&&<DocViewer doc={viewingDoc} onClose={()=>setViewingDoc(null)}/>}
      <div style={{ width:840,background:"#fff",borderRadius:10,overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ padding:"12px 16px",borderBottom:"2px solid "+T.blue,background:"#fafbfc",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:T.t1,fontFamily:"Georgia,serif" }}>Application Review — {app.talent_name}</div>
              <div style={{ display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ background:isSubmitted?T.greenL:T.amberL,color:isSubmitted?T.green:T.amber,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>{isSubmitted?"✓ SUBMITTED":"⏳ IN PROGRESS"}</span>
                {isSubmitted&&!isComplete&&<span style={{ background:T.redL,color:T.red,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>⚠ INCOMPLETE FIELDS</span>}
                {isComplete&&<span style={{ background:T.greenL,color:T.green,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>✓ 100% COMPLETE</span>}
                <span style={{ fontSize:11,color:T.t4 }}>Code: <strong style={{ color:T.purple }}>{app.access_code}</strong> · {progress}%</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              {isComplete&&isSubmitted&&<Btn variant="success" sm onClick={onImportToPipeline}>Import to Pipeline ↓</Btn>}
              {!isComplete&&isSubmitted&&<Btn variant="warning" sm onClick={()=>setTab("incomplete")}>View Incomplete Fields</Btn>}
              <button onClick={onClose} style={{ background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,color:T.t3,cursor:"pointer",padding:"4px 10px",fontSize:12,fontFamily:"inherit" }}>✕</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:"1px solid #e5e7eb",background:"#fff",flexShrink:0,overflowX:"auto" }}>
          {["overview","personal","social","talent","business","documents","consent","incomplete"].map(t=><div key={t} onClick={()=>setTab(t)} style={{ padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t?600:400,color:tab===t?T.blue:T.t3,borderBottom:`2px solid ${tab===t?T.blue:"transparent"}`,textTransform:"capitalize",whiteSpace:"nowrap" }}>{t==="incomplete"?"⚠ Incomplete":t}</div>)}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {tab==="overview"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <Section title="Application Status" accent={isComplete?T.green:T.amber}>
              {[["Status",isSubmitted?"Submitted":"In Progress"],["Name",app.talent_name],["Email",app.talent_email],["Code",app.access_code],["Created",new Date(app.created_at).toLocaleDateString()],["Last Saved",new Date(app.last_saved).toLocaleString()],["Complete",isComplete?"Yes — ready for pipeline":"No — fields missing"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1,fontWeight:500 }}>{v}</span></div>
              ))}
            </Section>
            <Section title="Section Completion" accent={T.blue}>
              {APP_SECTIONS.map(s=>{
                const done=(app.completed_sections||[]).includes(s.id);
                const missing=missingMap[s.id]||[];
                return <div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}>
                  <span style={{ color:T.t2 }}>{s.icon} {s.label}</span>
                  <span style={{ color:done&&missing.length===0?T.green:missing.length>0?T.red:T.t4,fontWeight:600 }}>{done&&missing.length===0?"✓":missing.length>0?`⚠ ${missing.length} missing`:"Incomplete"}</span>
                </div>;
              })}
              <div style={{ marginTop:8,height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:progress+"%",background:isComplete?T.green:T.blue,borderRadius:3 }}/></div>
            </Section>
          </div>}

          {tab==="incomplete"&&<div>
            <div style={{ background:T.redL,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",marginBottom:14 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.red,marginBottom:4 }}>⚠ Incomplete / Missing Fields</div>
              <div style={{ fontSize:12,color:T.t2 }}>The following required fields have not been completed. The application will remain in the Applications Pipeline until all items are resolved.</div>
            </div>
            {APP_SECTIONS.map(s=>{
              const missing=missingMap[s.id]||[];
              if(missing.length===0)return null;
              const secDef=s;
              return <div key={s.id} style={{ background:"#fff",border:"1px solid #fca5a5",borderRadius:8,padding:12,marginBottom:10 }}>
                <div style={{ fontSize:12,fontWeight:700,color:T.red,marginBottom:8 }}>{s.icon} {s.label} — {missing.length} field{missing.length>1?"s":""} missing</div>
                {missing.map(fieldId=>{const field=secDef.fields.find(f=>f.id===fieldId);return <div key={fieldId} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid #fef2f2",fontSize:12 }}><span style={{ color:T.red,fontWeight:700 }}>✗</span><span style={{ color:T.t1 }}>{field?.label||fieldId}</span>{field?.required&&<span style={{ fontSize:10,background:T.redL,color:T.red,borderRadius:8,padding:"0 5px",fontWeight:700 }}>REQUIRED</span>}</div>;})}
              </div>;
            })}
          </div>}

          {tab==="documents"&&<div>
            <div style={{ marginBottom:12,padding:"8px 12px",background:T.blueL,border:`1px solid ${T.blue}33`,borderRadius:6,fontSize:12,color:T.blue,fontWeight:500 }}>
              📎 Documents uploaded by the prospect. Click any document to view. These are accessible to Ops Specialists for the Director Ready Packet.
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {REQUIRED_DOCS.map(doc=>{
                const fieldKey="doc_"+doc.id;
                const val=app.data&&app.data[fieldKey];
                const name=app.data&&app.data[fieldKey+"_name"];
                const type=app.data&&app.data[fieldKey+"_type"];
                return <div key={doc.id} style={{ border:`1px solid ${val?"#86efac":"#fca5a5"}`,borderRadius:8,padding:14,background:val?"#f0fdf4":"#fff5f5" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{doc.icon}</span>
                    <div><div style={{ fontSize:12,fontWeight:700,color:T.t1 }}>{doc.label}</div><div style={{ fontSize:10,color:T.t4 }}>{doc.note}</div></div>
                    <span style={{ marginLeft:"auto",fontWeight:700,color:val?T.green:T.red }}>{val?"✓":"✗"}</span>
                  </div>
                  {doc.id==="proof_income"&&<div style={{ fontSize:10,color:T.amber,background:T.amberL,border:`1px solid ${T.amber}33`,borderRadius:5,padding:"3px 8px",marginBottom:6 }}>ℹ Self-support verification only — not used in approval decisions</div>}
                  {val?<button onClick={()=>setViewingDoc({name:name||doc.label,data:val,type:type||"image/jpeg"})} style={{ background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"100%" }}>👁 View Document</button>:<div style={{ fontSize:11,color:T.t4,textAlign:"center",padding:"4px 0" }}>Not yet uploaded</div>}
                </div>;
              })}
            </div>
          </div>}

          {/* Section data tabs */}
          {["personal","social","talent","business","consent"].includes(tab)&&(()=>{
            const secDef=APP_SECTIONS.find(s=>s.id===tab);if(!secDef)return null;
            return <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {secDef.fields.map(field=>{
                const val=app.data&&app.data[field.id];
                const hasVal=val&&val.toString().trim();
                const isMissing=field.required&&!hasVal;
                return <div key={field.id} style={{ gridColumn:field.type==="textarea"||field.type==="multicheck"||field.type==="checkbox"?"1/-1":"auto" }}>
                  <Lbl required={field.required}>{field.label}</Lbl>
                  <div style={{ padding:"7px 10px",background:isMissing?"#fff5f5":"#f8f9fb",border:`1px solid ${isMissing?"#fca5a5":"#e5e7eb"}`,borderRadius:5,fontSize:12,color:hasVal?T.t1:T.t4,minHeight:30 }}>
                    {isMissing?<span style={{ color:T.red,fontWeight:600 }}>⚠ Missing — required field</span>:field.type==="checkbox"?(val?"✓ Agreed":"—"):field.type==="multicheck"?(val||"").split(",").filter(Boolean).map(n=><NichePill key={n} n={n}/>):val||"—"}
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
