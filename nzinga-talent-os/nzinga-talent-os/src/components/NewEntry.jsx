import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "../data/constants.js";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "./ui.jsx";

function NewEntry({ currentUser, onSave, onCancel, onSendApp }) {
  const [entryType,setEntryType]=useState("manual");
  const [f,setF]=useState({name:"",social_handle:"",follower_count:"",er_pct:"",platform:"",location:""});
  const [docs,setDocs]=useState({});
  const p=(k,v)=>setF(x=>({...x,[k]:v}));
  function saveDoc(docId,data,name,type){setDocs(x=>({...x,[docId]:{data,name,type}}));}

  function save(){
    if(!f.name||!f.social_handle)return;
    const t={id:"t"+Date.now(),...f,stage:"holding_entry",niches:[],scout_id:currentUser.id,created_at:new Date().toISOString(),last_contacted:new Date().toISOString().split("T")[0],
      pillar_scores:[0,0,0,0,0],pillar_rationales:["","","","",""],jordan_score:0,revenue_path:"",scout_summary:"",team1_notes:"",team1_decision:null,compliance:{gov_id:!!docs.gov_id,tax_doc:!!docs.tax_doc,banking:!!docs.banking},rep_type:"",commission:"",term_length:"",team2_notes:"",team2_decision:null,director_decision:null,portal_setup:false,technical_routing:false,warm_handoff:"",warm_handoff_confirmed:false,revenue_ytd:"0",revenue_projected:"0",
      application_id:null,application_status:null,uploaded_docs:docs,
      audit_log:[{user:currentUser.name,role:ROLE_LABELS[currentUser.role],action:"Created holding record manually",stage:"holding_entry",ts:new Date().toISOString()}]};
    onSave(t);
  }

  return <div style={{ padding:"20px 24px",flex:1,overflowY:"auto" }}>
    <div style={{ maxWidth:580 }}>
      <div style={{ marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
        {[["manual","🖊","Manual Entry","Scout fills in details"],["send_app","📧","Send Application","Prospect fills their form"]].map(([v,icon,label,desc])=>(
          <div key={v} onClick={()=>setEntryType(v)} style={{ padding:12,borderRadius:8,border:`2px solid ${entryType===v?T.purple:"#e5e7eb"}`,background:entryType===v?T.purpleL:"#fff",cursor:"pointer" }}>
            <div style={{ fontSize:20,marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:13,fontWeight:700,color:entryType===v?T.purple:T.t1 }}>{label}</div>
            <div style={{ fontSize:11,color:T.t3 }}>{desc}</div>
          </div>
        ))}
      </div>

      {entryType==="manual"&&<div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden" }}>
        <div style={{ padding:"10px 14px",borderBottom:"2px solid "+T.purple,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.06em" }}>New Holding Entry</span></div>
        <div style={{ padding:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
            {[["Full Name","name","Alex Rivera"],["Social Handle","social_handle","@handle"],["Followers","follower_count","800K"],["ER%","er_pct","5.2"],["Platform","platform","Instagram / TikTok"],["Location","location","City, State"]].map(([l,k,ph])=>(
              <div key={k}><Lbl>{l}</Lbl><FInput value={f[k]} onChange={v=>p(k,v)} placeholder={ph}/></div>
            ))}
          </div>
          {/* Document uploads */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8 }}>Upload Documents (optional)</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {REQUIRED_DOCS.map(doc=>(
                <div key={doc.id}>
                  <Lbl>{doc.label}</Lbl>
                  <FileUpload fieldId={doc.id} value={docs[doc.id]?.data} valueName={docs[doc.id]?.name} valueType={docs[doc.id]?.type}
                    onChange={(id,data,name,type)=>saveDoc(id,data,name,type)} label={doc.label} note={doc.note} compact/>
                  {doc.id==="proof_income"&&<div style={{ fontSize:10,color:T.amber,marginTop:3 }}>ℹ Self-support only — not used in approvals</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}><Btn variant="purple" onClick={save}>Create Holding Record</Btn><Btn onClick={onCancel}>Cancel</Btn></div>
        </div>
      </div>}

      {entryType==="send_app"&&<div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden" }}>
        <div style={{ padding:"10px 14px",borderBottom:"2px solid "+T.purple,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.06em" }}>Send Application to Prospect</span></div>
        <div style={{ padding:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
            {[["Name","name","Alex Rivera"],["Social Handle","social_handle","@handle"],["Followers","follower_count","800K"],["Platform","platform","Instagram/TikTok"],["Location","location","City, State"]].map(([l,k,ph])=>(
              <div key={k}><Lbl>{l}</Lbl><FInput value={f[k]} onChange={v=>p(k,v)} placeholder={ph}/></div>
            ))}
          </div>
          <div style={{ background:T.purpleL,border:`1px solid ${T.purple}33`,borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.purple }}>
            📧 Creates a holding record and sends the prospect a link to complete their own application with document uploads.
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="purple" onClick={()=>{if(!f.name)return;save();if(onSendApp){const t={id:"t_tmp",name:f.name,...f};onSendApp(t);}}}>Create & Send →</Btn>
            <Btn onClick={onCancel}>Cancel</Btn>
          </div>
        </div>
      </div>}
    </div>
  </div>;
}
// ─── TALENT RECORD ────────────────────────────────────────────────────────────

export { NewEntry };
