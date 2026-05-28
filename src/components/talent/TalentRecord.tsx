// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { SendApplicationModal } from "@/components/application/ApplicationModals";

function TalentRecord({ talent, talents, currentUser, allHistory, setHistory, allTasks, setTasks, onClose, onUpdate, onSendApp, applications }) {
  const TABS=["Details","Scoring","Compliance","Documents","Framework","Executive","Onboarding","History / Notes","Tasks","Audit Log"];
  const [tab,setTab]=useState("Details");
  const [local,setLocal]=useState(()=>JSON.parse(JSON.stringify(talent)));
  const [err,setErr]=useState("");
  const [showSendApp,setShowSendApp]=useState(false);
  const [viewingDoc,setViewingDoc]=useState(null);
  const [showDocOnly,setShowDocOnly]=useState(false);
  const role=currentUser.role;
  const tHistory=allHistory.filter(h=>h.talent_id===local.id);
  const tTasks=allTasks.filter(t=>t.related_talent===local.id);
  const [newNote,setNewNote]=useState(""); const [noteType,setNoteType]=useState("note");
  const scoutUser=USERS.find(u=>u.id===local.scout_id);
  const creatorUser=USERS.find(u=>u.id===local.created_by);
  const createdByLabel=local.created_by===null?"Prospect":creatorUser?`${ROLE_LABELS[creatorUser.role]} (${creatorUser.name})`:"System";
  const linkedApp=local.application_id?applications[local.application_id]:null;

  // Incomplete section detection for linked app
  const appMissingMap={};
  if(linkedApp){APP_SECTIONS.forEach(s=>{ appMissingMap[s.id]=validateSection(s.id,linkedApp.data||{}); });}
  const appHasIncomplete=linkedApp&&Object.values(appMissingMap).some(arr=>arr.length>0);

  function p(f,v){setLocal(x=>({...x,[f]:v}));}
  function pc(f,v){setLocal(x=>({...x,compliance:{...x.compliance,[f]:v}}));}
  function pp(i,v){const s=[...local.pillar_scores];s[i]=parseFloat(v)||0;const avg=s.reduce((a,b)=>a+b,0)/5;setLocal(x=>({...x,pillar_scores:s,jordan_score:parseFloat(avg.toFixed(2))}))}
  function pr(i,v){const r=[...local.pillar_rationales];r[i]=v;setLocal(x=>({...x,pillar_rationales:r}));}
  function auditLog(action,stage){return[...local.audit_log,{user:currentUser.name,role:ROLE_LABELS[role],action,stage,ts:new Date().toISOString()}];}
  function save(u){onUpdate(u);}
  function postNote(){
    if(!newNote.trim())return;
    setHistory(prev=>[{id:"h"+Date.now(),talent_id:local.id,user_id:currentUser.id,type:noteType,text:newNote,ts:new Date().toISOString(),flagged:false,is_document:noteType==="document"},...prev]);
    setNewNote("");
  }

  // Upload doc to profile — fixed compliance key mapping, no line-break bug
  function uploadDocToProfile(docId,data,name,type){
    const updDocs={...(local.uploaded_docs||{}),[docId]:{name,data,type}};
    const compKey={gov_id:"gov_id",tax_doc:"tax_doc",banking:"banking",proof_income:"proof_income"}[docId]||docId;
    const updComp={...local.compliance,[compKey]:true};
    const updated={...local,uploaded_docs:updDocs,compliance:updComp};
    setLocal(updated);
    setHistory(prev=>[{id:"h"+Date.now(),talent_id:local.id,user_id:currentUser.id,type:"document",text:`Document uploaded: ${name}`,ts:new Date().toISOString(),flagged:false,is_document:true,doc_name:name,doc_data:data,doc_type:type},...prev]);
    onUpdate(updated);
  }

  // Pipeline action handlers
  function scoutSubmit(){
    for(let i=0;i<5;i++){if(!local.pillar_rationales[i]){setErr("All 5 pillar rationales required.");return;}}
    if(!local.revenue_path||!local.scout_summary||!local.niches.length){setErr("Complete all required fields.");return;}
    setErr("");save({...local,stage:"scout_complete",audit_log:auditLog("Completed Talent Packet → Scout Complete","scout_complete")});onClose();
  }
  function scoutArchive(){save({...local,stage:"not_viable",audit_log:auditLog("Marked Not Viable","not_viable")});onClose();}
  function markLost(){save({...local,stage:"not_viable",audit_log:auditLog("Marked Lost","not_viable")});onClose();}
  function t1(d){
    if(d==="approved"){
      for(let i=0;i<5;i++){if(local.pillar_scores[i]<3){setErr(`Pillar ${i+1} below minimum 3.`);return;}}
      if(local.jordan_score<3.5){setErr(`Jordan Score ${local.jordan_score.toFixed(2)} is below 3.5 threshold.`);return;}
      save({...local,stage:"ops_processing",team1_decision:"approved",audit_log:auditLog("Approved for Ops Processing","team1_review")});onClose();
    }else if(d==="revision"){
      if(!local.team1_notes){setErr("Correction notes required for revision.");return;}
      save({...local,stage:"scout_complete",team1_decision:"revision",audit_log:auditLog("Returned for Revision","team1_review")});
      setTasks(prev=>[{id:"tk_"+Date.now(),title:"Revision Required: "+local.name,assigned_to:local.scout_id||"u1",related_talent:local.id,due:new Date(Date.now()+3*86400000).toISOString().slice(0,10),priority:"high",status:"open",created_by:currentUser.id,created_at:new Date().toISOString(),notes:local.team1_notes},...prev]);
      onClose();
    }else{save({...local,stage:"archived",team1_decision:"rejected",audit_log:auditLog("Rejected at Team 1","team1_review")});onClose();}
  }
  function ops(){
    if(Object.values(local.compliance||{}).filter(Boolean).length<6){setErr("At least 6/8 compliance items must be verified.");return;}
    if(!local.rep_type||!local.commission||!local.term_length){setErr("Complete all Framework fields first.");return;}
    save({...local,stage:"team2_audit",audit_log:auditLog("Compliance verified → Team 2 Audit","ops_processing")});onClose();
  }
  function t2(d){
    if(d==="approved"){save({...local,stage:"executive_review",team2_decision:"approved",audit_log:auditLog("Approved for Director Review","team2_audit")});onClose();}
    else if(d==="returned"){
      save({...local,stage:"ops_processing",team2_decision:"returned",audit_log:auditLog("Returned to Ops","team2_audit")});
      const opsUser=USERS.find(u=>u.role==="ops_specialist");
      setTasks(prev=>[{id:"tk_"+Date.now(),title:"Returned from Audit: "+local.name,assigned_to:opsUser?opsUser.id:"u3",related_talent:local.id,due:new Date(Date.now()+3*86400000).toISOString().slice(0,10),priority:"high",status:"open",created_by:currentUser.id,created_at:new Date().toISOString(),notes:local.team2_notes||"Returned from Team 2 audit — review and resubmit."},...prev]);
      onClose();
    }else{save({...local,stage:"archived",team2_decision:"rejected",audit_log:auditLog("Rejected at Team 2","team2_audit")});onClose();}
  }
  function dir(d){
    if(d==="approved")save({...local,stage:"signed_onboarding",director_decision:"approved",audit_log:auditLog("Approved – Sign Client","executive_review")});
    else if(d==="hold")save({...local,director_decision:"hold",audit_log:auditLog("Decision on Hold","executive_review")});
    else save({...local,stage:"archived",director_decision:"rejected",audit_log:auditLog("Rejected by Director","executive_review")});
    onClose();
  }
  function success(){
    if(!local.warm_handoff){setErr("Warm hand-off name / division required.");return;}
    save({...local,warm_handoff_confirmed:true,audit_log:auditLog("Warm hand-off confirmed: "+local.warm_handoff,"signed_onboarding")});onClose();
  }

  const compFields=[["legal_name","Full Legal Name"],["gov_id","Government ID"],["dob","Date of Birth"],["address","Physical Address"],["email_phone","Email / Phone"],["tax_doc","Tax Documentation (W-9)"],["banking","Banking Information"],["social_ownership","Social Account Ownership"]];
  const filtHistory=showDocOnly?tHistory.filter(h=>h.is_document):tHistory;

  // Can this role upload docs to a profile?
  const canUploadDocs=role==="ops_specialist"||role==="scout"||role==="director";

  return(
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:300,overflowY:"auto",padding:"16px 0" }}>
      {showSendApp&&<SendApplicationModal talent={local} onSend={app=>{onSendApp(app);setLocal(x=>({...x,application_id:app.id,application_status:"sent"}));setShowSendApp(false);}} onClose={()=>setShowSendApp(false)}/>}
      {viewingDoc&&<DocViewer doc={viewingDoc} onClose={()=>setViewingDoc(null)}/>}

      <div style={{ width:970,background:T.pageBg,borderRadius:10,overflow:"hidden",flexShrink:0,boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
        {/* ── Header ── */}
        <div style={{ background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"11px 16px" }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:44,height:44,borderRadius:"50%",background:T.purple+"22",border:`2px solid ${T.purple}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:T.purple,fontFamily:"Georgia,serif" }}>{local.name.split(" ").map(n=>n[0]).join("")}</div>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700,fontSize:16,color:T.t1,fontFamily:"Georgia,serif" }}>{local.name}</span>
                  <StageBadge stage={local.stage}/>
                  {local.niches.map(n=><NichePill key={n} n={n}/>)}
                  {local.application_status&&<span style={{ fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:10,background:local.application_status==="submitted"?T.greenL:T.amberL,color:local.application_status==="submitted"?T.green:T.amber }}>App: {local.application_status}</span>}
                </div>
                <div style={{ display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap" }}>
                  {scoutUser&&<span style={{ fontSize:11,color:T.t3 }}>👤 {scoutUser.name}</span>}
                  <span style={{ fontSize:11,color:T.t3 }}>📱 {local.social_handle}</span>
                  <span style={{ fontSize:11,color:T.t3 }}>📍 {local.location}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
              {local.jordan_score>0&&<div style={{ background:local.jordan_score>=3.5?T.greenL:T.redL,borderRadius:8,padding:"5px 10px",textAlign:"center" }}>
                <div style={{ fontSize:18,fontWeight:800,color:local.jordan_score>=3.5?T.green:T.red }}>{local.jordan_score.toFixed(2)}</div>
                <div style={{ fontSize:9,color:T.t4,textTransform:"uppercase" }}>Jordan Score</div>
              </div>}
              {parseInt(local.revenue_ytd||0)>0&&<div style={{ background:T.greenL,borderRadius:8,padding:"5px 10px",textAlign:"center" }}>
                <div style={{ fontSize:15,fontWeight:700,color:T.green }}>${parseInt(local.revenue_ytd).toLocaleString()}</div>
                <div style={{ fontSize:9,color:T.t4,textTransform:"uppercase" }}>YTD</div>
              </div>}
              {role==="scout"&&<Btn variant="orange" sm onClick={()=>setShowSendApp(true)}>📧 Send App</Btn>}
              <button onClick={onClose} style={{ background:"transparent",border:"1px solid #e5e7eb",borderRadius:6,color:T.t3,cursor:"pointer",padding:"5px 10px",fontSize:12,fontFamily:"inherit" }}>✕</button>
            </div>
          </div>
        </div>

        {/* ── Incomplete app alert with jump links (role-gated) ── */}
        {linkedApp&&appHasIncomplete&&(role==="director"||ROLE_STAGE_ACCESS[role]?.includes(local.stage))&&(
          <div style={{ background:T.amberL,borderBottom:`1px solid ${T.amber}44`,padding:"8px 16px" }}>
            <div style={{ fontSize:12,fontWeight:700,color:T.amber,marginBottom:5 }}>⚠ Linked application has incomplete required sections</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {APP_SECTIONS.filter(s=>(appMissingMap[s.id]||[]).length>0).map(s=>(
                <button key={s.id} onClick={()=>setTab("Documents")} style={{ background:"transparent",border:`1px solid ${T.amber}`,borderRadius:6,padding:"2px 9px",fontSize:11,color:T.amber,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textDecoration:"underline" }}>
                  {s.icon} {s.label} ({(appMissingMap[s.id]||[]).length} missing) →
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display:"flex",borderBottom:"1px solid #e5e7eb",background:"#fff",overflowX:"auto" }}>
          {TABS.map(t=>{
            const showIncomplete=appHasIncomplete&&(role==="director"||ROLE_STAGE_ACCESS[role]?.includes(local.stage));
            const hasBadge=(t==="Documents"&&showIncomplete)||(t==="History / Notes"&&tHistory.filter(h=>h.flagged).length>0);
            return <div key={t} onClick={()=>setTab(t)} style={{ padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t?600:400,color:tab===t?T.blue:T.t3,borderBottom:`2px solid ${tab===t?T.blue:"transparent"}`,whiteSpace:"nowrap",position:"relative" }}>
              {t}{hasBadge&&<span style={{ marginLeft:4,background:T.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>!</span>}
            </div>;
          })}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding:14,maxHeight:"62vh",overflowY:"auto" }}>
          {err&&<div style={{ background:T.redL,border:`1px solid ${T.red}44`,borderRadius:6,padding:"6px 10px",color:T.red,fontSize:12,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>⚠ {err}</div>}

          {/* ─ DETAILS ─ */}
          {tab==="Details"&&<div>
            {/* Application status banner — always visible when linked */}
            {linkedApp&&<div style={{ background:linkedApp.status==="submitted"&&isAppComplete(linkedApp)?T.greenL:T.amberL,border:`1px solid ${T.amber}44`,borderRadius:8,padding:"9px 12px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:12,fontWeight:700,color:isAppComplete(linkedApp)?T.green:T.amber }}>
                  📋 Application: {linkedApp.status==="submitted"?isAppComplete(linkedApp)?"✅ Submitted & Complete":"⚠ Submitted (Incomplete Fields)":"⏳ In Progress"}
                </div>
                <div style={{ fontSize:11,color:T.t3 }}>Code: {linkedApp.access_code} · {Math.round(((linkedApp.completed_sections||[]).length/APP_SECTIONS.length)*100)}% complete · Last saved {new Date(linkedApp.last_saved).toLocaleDateString()}</div>
              </div>
              <div style={{ display:"flex",gap:6 }}>
                <Btn sm variant="ghost" onClick={()=>setTab("Documents")}>View App →</Btn>
                {linkedApp.status==="submitted"&&!isAppComplete(linkedApp)&&(role==="director"||ROLE_STAGE_ACCESS[role]?.includes(local.stage))&&<Btn sm variant="warning" onClick={()=>setTab("Documents")}>⚠ Incomplete Fields</Btn>}
              </div>
            </div>}

            <div style={{ display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:10,marginBottom:10 }}>
              <Section title="Recent History" accent={T.amber} action={<button onClick={()=>setTab("History / Notes")} style={{ background:"transparent",border:"none",color:T.blue,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Add Note ↗</button>}>
                {tHistory.length===0?<div style={{ color:T.t4,fontSize:12 }}>No history yet.</div>:tHistory.slice(0,3).map(h=>{const u=USERS.find(u=>u.id===h.user_id);return <div key={h.id} style={{ display:"flex",gap:6,padding:"3px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t4,minWidth:55,flexShrink:0 }}>{new Date(h.ts).toLocaleDateString()}</span><span style={{ color:T.t3,minWidth:36 }}>{h.type}</span><span style={{ color:T.t2,flex:1 }}>{h.text.slice(0,52)}{h.text.length>52?"…":""}</span></div>;})}
              </Section>
              <Section title="Jordan Score" accent={T.purple}>
                {local.jordan_score>0?<div><div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}><div style={{ fontSize:28,fontWeight:800,color:local.jordan_score>=3.5?T.green:T.red }}>{local.jordan_score.toFixed(2)}</div><div style={{ fontSize:11,color:local.jordan_score>=3.5?T.green:T.red,fontWeight:600 }}>{local.jordan_score>=3.5?"✓ Pass":"✗ Below threshold"}</div></div>{PILLAR_NAMES.map((n,i)=><div key={i} style={{ marginBottom:3 }}><div style={{ fontSize:9,color:T.t4 }}>P{i+1}</div><ScoreBar score={local.pillar_scores[i]}/></div>)}</div>:<div style={{ color:T.t4,fontSize:12 }}>Not yet scored.</div>}
              </Section>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
              <Section title="Lead Info" accent={T.blue}>
                {[["Scout",scoutUser?.name||"—"],["Created By",createdByLabel],["Stage",STAGE_LABELS[local.stage]],["Created",new Date(local.created_at).toLocaleDateString()]].map(([k,v])=><div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1,fontWeight:500 }}>{v}</span></div>)}
                {role==="scout"&&local.stage==="holding_entry"&&<div style={{ marginTop:6 }}><Lbl>Location</Lbl><FInput value={local.location} onChange={v=>p("location",v)} placeholder="City, State"/><Lbl style={{ marginTop:4 }}>Platform</Lbl><FInput value={local.platform} onChange={v=>p("platform",v)} placeholder="Instagram / TikTok"/></div>}
              </Section>
              <Section title="Social Profile" accent={T.cyan}>
                {[["Handle",local.social_handle],["Followers",local.follower_count],["ER%",local.er_pct?local.er_pct+"%":"—"],["Platform",local.platform||"—"]].map(([k,v])=><div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1 }}>{v}</span></div>)}
                {role==="scout"&&local.stage==="holding_entry"&&<div style={{ marginTop:6 }}><Lbl>Niches</Lbl><div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>{["Model","Actor","Influencer","Athlete"].map(n=><label key={n} style={{ display:"flex",alignItems:"center",gap:3,fontSize:11,cursor:"pointer",color:local.niches.includes(n)?T.purple:T.t3 }}><input type="checkbox" checked={local.niches.includes(n)} onChange={e=>p("niches",e.target.checked?[...local.niches,n]:local.niches.filter(x=>x!==n))}/>{n}</label>)}</div></div>}
              </Section>
              <Section title="Revenue" accent={T.green}>
                {[["Rep",local.rep_type||"—"],["Commission",local.commission?local.commission+"%":"—"],["YTD","$"+parseInt(local.revenue_ytd||0).toLocaleString()],["Projected","$"+parseInt(local.revenue_projected||0).toLocaleString()]].map(([k,v])=><div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1,fontWeight:500 }}>{v}</span></div>)}
              </Section>
            </div>
            {linkedApp?.data?.parent_name&&<Section title="Parent / Guardian" accent={T.purple} style={{ marginBottom:10 }}>
              {[["Name",linkedApp.data.parent_name],["Phone",linkedApp.data.parent_phone],["Email",linkedApp.data.parent_email],["Relationship",linkedApp.data.parent_relationship]].filter(([,v])=>v).map(([k,v])=><div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #f5f5f5",fontSize:12 }}><span style={{ color:T.t3 }}>{k}</span><span style={{ color:T.t1,fontWeight:500 }}>{v}</span></div>)}
            </Section>}
            {role==="scout"&&local.stage==="holding_entry"&&<div style={{ display:"flex",gap:7 }}><Btn variant="primary" onClick={()=>setTab("Scoring")}>Complete Talent Packet →</Btn><Btn variant="orange" sm onClick={()=>setShowSendApp(true)}>📧 Send Application</Btn><Btn variant="danger" sm onClick={scoutArchive}>Not Viable</Btn><Btn variant="warning" sm onClick={markLost}>Mark Lost</Btn></div>}
            {role==="team1_lead"&&local.stage==="team1_review"&&<Section title="Gate 1 Decision" accent={T.amber} style={{ marginTop:10 }}><div style={{ marginBottom:8 }}><Lbl>Correction Notes (required for revision)</Lbl><FTextarea value={local.team1_notes} onChange={v=>p("team1_notes",v)} rows={2}/></div><div style={{ display:"flex",gap:7 }}><Btn variant="success" onClick={()=>t1("approved")}>✓ Approve for Ops</Btn><Btn variant="warning" onClick={()=>t1("revision")}>↩ Return for Revision</Btn><Btn variant="danger" onClick={()=>t1("rejected")}>✗ Reject</Btn></div></Section>}
          </div>}

          {/* ─ SCORING ─ */}
          {tab==="Scoring"&&<div>
            {role==="scout"&&(local.stage==="holding_entry"||local.stage==="scout_complete")?<div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
                <Section title="Scout Summary" accent={T.purple}><FTextarea value={local.scout_summary} onChange={v=>p("scout_summary",v)} rows={4} error={!local.scout_summary}/></Section>
                <Section title="90-Day Revenue Path" accent={T.green}><FTextarea value={local.revenue_path} onChange={v=>p("revenue_path",v)} rows={4} error={!local.revenue_path}/></Section>
              </div>
              {PILLAR_NAMES.map((name,i)=><Section key={i} title={`Pillar ${i+1}: ${name}`} accent={local.pillar_scores[i]>=3?T.green:local.pillar_scores[i]>0?T.red:T.t5} style={{ marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <div style={{ flex:1,marginRight:10 }}><ScoreBar score={local.pillar_scores[i]}/></div>
                  <div style={{ display:"flex",gap:3 }}>{[1,2,3,4,5].map(n=><div key={n} onClick={()=>pp(i,n)} style={{ width:30,height:30,borderRadius:5,background:local.pillar_scores[i]>=n?(n>=3?T.greenL:T.redL):"#f3f4f6",border:`1px solid ${local.pillar_scores[i]>=n?(n>=3?T.green:T.red):"#e5e7eb"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:local.pillar_scores[i]>=n?(n>=3?T.green:T.red):T.t4 }}>{n}</div>)}</div>
                </div>
                <FTextarea value={local.pillar_rationales[i]} onChange={v=>pr(i,v)} placeholder={`Written rationale required for Pillar ${i+1}…`} rows={2} error={!local.pillar_rationales[i]}/>
                {!local.pillar_rationales[i]&&<div style={{ fontSize:10,color:T.red,marginTop:2,fontWeight:600 }}>⚠ Rationale required</div>}
              </Section>)}
              <Section title="Jordan Score" accent={local.jordan_score>=3.5?T.green:local.jordan_score>0?T.red:T.t5}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ fontSize:36,fontWeight:800,color:local.jordan_score>=3.5?T.green:local.jordan_score>0?T.red:T.t4 }}>{local.jordan_score.toFixed(2)}</div>
                  <div style={{ fontSize:12,color:local.jordan_score>=3.5?T.green:T.red,fontWeight:600 }}>{local.jordan_score>=3.5?"✓ Meets 3.5 threshold":local.jordan_score>0?"✗ Below 3.5 threshold — cannot advance":"Enter pillar scores above"}</div>
                </div>
              </Section>
              <div style={{ display:"flex",gap:7,marginTop:10 }}><Btn variant="primary" onClick={scoutSubmit} disabled={local.jordan_score<3.5} title={local.jordan_score<3.5?"Jordan Score must be at least 3.5 to send up.":""}>Submit Packet → Team 1 Review</Btn><Btn variant="danger" sm onClick={scoutArchive}>Not Viable</Btn><Btn variant="warning" sm onClick={markLost}>Mark Lost</Btn></div>
            </div>:<div>
              {PILLAR_NAMES.map((name,i)=><Section key={i} title={`P${i+1}: ${name}`} accent={local.pillar_scores[i]>=3?T.green:local.pillar_scores[i]>0?T.red:T.t5} style={{ marginBottom:8 }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}><div style={{ flex:1,marginRight:10 }}><ScoreBar score={local.pillar_scores[i]}/></div><div style={{ width:32,height:32,borderRadius:6,background:local.pillar_scores[i]>=3?T.greenL:T.redL,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:local.pillar_scores[i]>=3?T.green:T.red }}>{local.pillar_scores[i]}</div></div>
                {local.pillar_rationales[i]&&<p style={{ fontSize:11,color:T.t3,fontStyle:"italic",margin:0 }}>"{local.pillar_rationales[i]}"</p>}
              </Section>)}
            </div>}
          </div>}

          {/* ─ COMPLIANCE ─ */}
          {tab==="Compliance"&&((role==="ops_specialist"||role==="team2_lead"||role==="director")?<div>
            <div style={{ display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:10 }}>
              <Section title="Document Checklist" accent={T.blue}>
                {compFields.map(([key,label])=><div key={key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f5f5f5" }}>
                  <span style={{ fontSize:12,color:local.compliance[key]?T.t1:T.red,fontWeight:local.compliance[key]?400:500 }}>{label}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:7 }}><span style={{ fontSize:11,fontWeight:600,color:local.compliance[key]?T.green:T.t4 }}>{local.compliance[key]?"✓ Verified":"Pending"}</span><Toggle on={!!local.compliance[key]} onChange={v=>role==="ops_specialist"&&pc(key,v)} disabled={role!=="ops_specialist"}/></div>
                </div>)}
                <div style={{ marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:11,color:T.t3 }}>{Object.values(local.compliance||{}).filter(Boolean).length}/8 verified</span>
                  <div style={{ height:5,width:140,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:(Object.values(local.compliance||{}).filter(Boolean).length/8*100)+"%",background:T.green,borderRadius:3 }}/></div>
                </div>
                {role==="ops_specialist"&&local.stage==="ops_processing"&&<div style={{ marginTop:10 }}><Btn variant="success" onClick={ops}>Advance to Team 2 Audit →</Btn></div>}
              </Section>
              <Section title="Status Overview" accent={T.green}>
                {compFields.map(([key,label])=><div key={key} style={{ display:"flex",gap:6,padding:"3px 0",fontSize:12 }}>
                  <span style={{ color:local.compliance[key]?T.green:T.red,fontWeight:700,minWidth:12 }}>{local.compliance[key]?"✓":"✗"}</span>
                  <span style={{ color:local.compliance[key]?T.t2:T.red }}>{label}</span>
                </div>)}
              </Section>
            </div>
          </div>:<div style={{ color:T.t4,fontSize:12,padding:"16px 0" }}>Compliance access is restricted to Ops Specialists, Team 2 Leads, and Directors.</div>)}

          {/* ─ DOCUMENTS ─ */}
          {tab==="Documents"&&<div>
            {/* Info bar */}
            <div style={{ marginBottom:10,padding:"8px 12px",background:T.blueL,border:`1px solid ${T.blue}33`,borderRadius:6,fontSize:12,color:T.blue }}>
              📎 Documents are sourced from the prospect's application portal uploads and staff uploads. Viewable by Ops Specialists and above for the Director Ready Packet.
            </div>


            {/* Linked application review — always viewable in profile */}
            {linkedApp&&<div style={{ marginBottom:12,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
              <div style={{ padding:"8px 12px",borderBottom:"2px solid "+T.purple,background:"#fafbfc",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:11,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.06em" }}>Linked Application</span>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ background:linkedApp.status==="submitted"&&isAppComplete(linkedApp)?T.greenL:T.amberL,color:linkedApp.status==="submitted"&&isAppComplete(linkedApp)?T.green:T.amber,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>
                    {linkedApp.status==="submitted"?isAppComplete(linkedApp)?"✅ Complete":"⚠ Incomplete":"⏳ In Progress"}
                  </span>
                  <span style={{ fontSize:11,color:T.t4 }}>Code: <strong>{linkedApp.access_code}</strong></span>
                  <span style={{ fontSize:11,color:T.t4 }}>Saved: {new Date(linkedApp.last_saved).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ padding:"8px 12px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                {[["Name",[linkedApp.data?.legal_first,linkedApp.data?.legal_last].filter(Boolean).join(" ")||linkedApp.talent_name],["Email",linkedApp.data?.email||linkedApp.talent_email],["Handle",linkedApp.data?.primary_handle||"—"],["Platform",linkedApp.data?.primary_platform||"—"],["Niches",(linkedApp.data?.niches||"").split(",").filter(Boolean).join(", ")||"—"],["Goals",linkedApp.data?.goals_90day?.slice(0,60)||"—"]].map(([k,v])=>(
                  <div key={k} style={{ padding:"4px 6px",background:"#f8f9fb",borderRadius:5 }}><div style={{ fontSize:9,color:T.t4,textTransform:"uppercase",letterSpacing:"0.08em" }}>{k}</div><div style={{ fontSize:11,color:T.t1,fontWeight:500 }}>{v}</div></div>
                ))}
              </div>
            </div>}

            {/* Required doc checklist — sourced from portal uploads OR staff uploads */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {REQUIRED_DOCS.map(doc=>{
                const staffDoc=(local.uploaded_docs||{})[doc.id];
                const appDocData=linkedApp&&linkedApp.data&&linkedApp.data["doc_"+doc.id];
                const appDoc=appDocData?{data:appDocData,name:linkedApp.data["doc_"+doc.id+"_name"]||doc.label,type:linkedApp.data["doc_"+doc.id+"_type"]||"image/jpeg"}:null;
                const docData=staffDoc||appDoc;
                const source=staffDoc?"Staff Upload":appDoc?"Prospect Upload":null;
                return <div key={doc.id} style={{ border:`1px solid ${docData?"#86efac":"#fca5a5"}`,borderRadius:8,padding:12,background:docData?"#f0fdf4":"#fff5f5" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                    <span style={{ fontSize:18 }}>{doc.icon}</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:T.t1 }}>{doc.label}</div><div style={{ fontSize:10,color:T.t4 }}>{doc.note}</div></div>
                    <span style={{ fontWeight:700,fontSize:13,color:docData?T.green:T.red }}>{docData?"✓":"✗"}</span>
                  </div>
                  {doc.id==="proof_income"&&<div style={{ fontSize:10,color:T.amber,background:T.amberL,border:`1px solid ${T.amber}33`,borderRadius:4,padding:"2px 7px",marginBottom:6,fontWeight:500 }}>ℹ Self-support verification only — not used in approval decisions</div>}
                  {docData&&source&&<div style={{ fontSize:10,color:T.t4,marginBottom:5,fontStyle:"italic" }}>Source: {source}</div>}
                  {docData?<button onClick={()=>setViewingDoc({name:docData.name||doc.label,data:docData.data,type:docData.type||"image/jpeg"})} style={{ background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"100%",marginBottom:canUploadDocs?6:0 }}>👁 View — {docData.name}</button>:<div style={{ fontSize:11,color:T.red,textAlign:"center",padding:"4px 0",fontWeight:600,marginBottom:canUploadDocs?6:0 }}>⚠ Not yet uploaded</div>}
                  {canUploadDocs&&<div onClick={()=>document.getElementById("pdoc_"+local.id+"_"+doc.id)&&document.getElementById("pdoc_"+local.id+"_"+doc.id).click()} style={{ border:"1px dashed #d1d5db",borderRadius:5,padding:"5px 8px",fontSize:11,color:T.t3,textAlign:"center",cursor:"pointer",background:"#fafbfc" }}>
                    <input id={"pdoc_"+local.id+"_"+doc.id} type="file" accept="image/*,.pdf,.doc,.docx" onChange={e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>uploadDocToProfile(doc.id,ev.target.result,file.name,file.type);r.readAsDataURL(file);}} style={{ display:"none" }}/>
                    📎 {docData?"Replace":"Upload"} document
                  </div>}
                </div>;
              })}
            </div>
          </div>}

          {/* ─ FRAMEWORK ─ */}
          {tab==="Framework"&&((role==="ops_specialist"||role==="team2_lead"||role==="director")?<div>
            <Section title="Contract Framework" accent={T.green}><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
              {[["Rep Type","rep_type"],["Commission %","commission"],["Term Length","term_length"]].map(([label,field])=><div key={field}><Lbl required>{label}</Lbl>
                {role==="ops_specialist"&&local.stage==="ops_processing"?(field==="rep_type"?<FSelect value={local[field]} onChange={v=>p(field,v)} options={[{v:"",l:"Select…"},"Exclusive","Non-Exclusive","Open to Discussion"]} style={{width:"100%"}} error={!local[field]}/>:<FInput value={local[field]} onChange={v=>p(field,v)} error={!local[field]}/>):<div style={{ fontSize:13,color:T.t1,fontWeight:600,padding:"5px 0" }}>{local[field]?local[field]+(field==="commission"?"%":""):"—"}</div>}</div>)}
            </div></Section>
            {role==="team2_lead"&&local.stage==="team2_audit"&&<Section title="Team 2 Decision" accent={T.cyan} style={{ marginTop:10 }}><div style={{ marginBottom:7 }}><Lbl>Audit Notes</Lbl><FTextarea value={local.team2_notes} onChange={v=>p("team2_notes",v)} rows={3}/></div><div style={{ display:"flex",gap:7 }}><Btn variant="success" onClick={()=>t2("approved")}>✓ Approved for Director</Btn><Btn variant="warning" onClick={()=>t2("returned")}>↩ Returned to Ops</Btn><Btn variant="danger" onClick={()=>t2("rejected")}>✗ Rejected</Btn></div></Section>}
          </div>:<div style={{ color:T.t4,fontSize:12,padding:"16px 0" }}>Framework access is restricted to Ops Specialists, Team 2 Leads, and Directors.</div>)}

          {/* ─ EXECUTIVE ─ */}
          {tab==="Executive"&&((role==="director"||role==="team2_lead"||role==="team1_lead")?<div>
            <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:18 }}>
              <div style={{ fontSize:11,color:T.purple,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,fontWeight:700,borderBottom:"2px solid "+T.purple,paddingBottom:7 }}>Executive Summary</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14 }}>
                {[["Talent",local.name],["Niche",local.niches.join(", ")||"—"],["Scout",scoutUser?.name||"—"],["Jordan Score",local.jordan_score.toFixed(2)],["Rep Type",local.rep_type||"—"],["Commission",local.commission?local.commission+"%":"—"]].map(([k,v])=><div key={k} style={{ padding:"7px 10px",background:"#f8f9fb",borderRadius:6 }}><div style={{ fontSize:9,color:T.t4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{k}</div><div style={{ fontSize:13,fontWeight:700,color:T.t1 }}>{v}</div></div>)}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div><div style={{ fontSize:9,color:T.t4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>90-Day Revenue Path</div><p style={{ fontSize:12,color:T.t2,margin:0,lineHeight:1.7 }}>{local.revenue_path||"—"}</p></div>
                <div><div style={{ fontSize:9,color:T.t4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>Scout Assessment</div><p style={{ fontSize:12,color:T.t2,margin:0,lineHeight:1.7 }}>{local.scout_summary||"—"}</p></div>
              </div>
            </div>
            {role==="director"&&local.stage==="executive_review"&&<div style={{ display:"flex",gap:8,marginTop:12 }}><Btn variant="success" style={{ padding:"7px 18px",fontSize:13 }} onClick={()=>dir("approved")}>✓ Approve — Sign Client</Btn><Btn variant="ghost" onClick={()=>dir("hold")}>⏸ Hold</Btn><Btn variant="danger" onClick={()=>dir("rejected")}>✗ Reject</Btn><Btn variant="warning" onClick={markLost}>Mark Lost</Btn></div>}
          </div>:<div style={{ color:T.t4,fontSize:12,padding:"16px 0" }}>Executive summary restricted to leadership roles.</div>)}

          {/* ─ ONBOARDING ─ */}
          {tab==="Onboarding"&&((role==="success_manager"||local.stage==="signed_onboarding")?<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <Section title="System Activation" accent={T.green}>{[["portal_setup","Client Portal Setup"],["technical_routing","Technical Routing"]].map(([key,label])=><div key={key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f5f5f5" }}><span style={{ fontSize:12,color:T.t1 }}>{label}</span><Toggle on={!!local[key]} onChange={v=>role==="success_manager"&&p(key,v)} disabled={role!=="success_manager"}/></div>)}</Section>
            <Section title="Warm Hand-off" accent={T.blue}><Lbl>Division Agent — Name / Division</Lbl><FInput value={local.warm_handoff} onChange={v=>role==="success_manager"&&p("warm_handoff",v)} placeholder="e.g. Keisha Morris – Influencer Division"/>{role==="success_manager"&&!local.warm_handoff_confirmed&&<div style={{ marginTop:8 }}><Btn variant="success" onClick={success}>Confirm Hand-off ✓</Btn></div>}{local.warm_handoff_confirmed&&<div style={{ color:T.green,fontSize:12,marginTop:6,fontWeight:600 }}>✓ {local.warm_handoff}</div>}</Section>
          </div>:<div style={{ color:T.t4,fontSize:12,padding:"16px 0" }}>Onboarding is available once the client is signed.</div>)}

          {/* ─ HISTORY / NOTES ─ */}
          {tab==="History / Notes"&&<div>
            {/* Doc-only filter checkbox */}
            <div style={{ display:"flex",alignItems:"center",marginBottom:10 }}>
              <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.t2,cursor:"pointer",padding:"4px 10px",background:showDocOnly?T.blueL:"transparent",borderRadius:6,border:`1px solid ${showDocOnly?T.blue+"55":"transparent"}` }}>
                <input type="checkbox" checked={showDocOnly} onChange={e=>setShowDocOnly(e.target.checked)} style={{ cursor:"pointer" }}/> 📎 Show attached documents only
              </label>
              {showDocOnly&&<span style={{ marginLeft:8,fontSize:11,color:T.t4 }}>{filtHistory.length} document{filtHistory.length!==1?"s":""}</span>}
            </div>

            <Section title="Add Note / Log" accent={T.amber} style={{ marginBottom:10 }}>
              <div style={{ display:"flex",gap:7,marginBottom:7 }}>
                <FSelect value={noteType} onChange={setNoteType} options={["note","call","email","task","document"]} style={{ width:100 }}/>
                <div style={{ flex:1 }}><FTextarea value={newNote} onChange={setNewNote} placeholder="Log a note, call summary, email, or document note…" rows={2}/></div>
              </div>
              <Btn sm variant="primary" onClick={postNote}>Post Note</Btn>
            </Section>

            <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
              {filtHistory.length===0?<div style={{ padding:"14px",color:T.t4,fontSize:12,textAlign:"center" }}>{showDocOnly?"No documents attached yet.":"No history for this talent."}</div>:filtHistory.map(h=>{const u=USERS.find(u=>u.id===h.user_id);return <div key={h.id} style={{ display:"grid",gridTemplateColumns:"88px 60px 1fr",padding:"7px 10px",borderBottom:"1px solid #f5f5f5",alignItems:"start",gap:6,background:h.is_document?"#f0fdf4":"transparent" }}>
                <span style={{ fontSize:11,color:T.t3 }}>{new Date(h.ts).toLocaleDateString()}</span>
                <div style={{ display:"flex",alignItems:"center",gap:4 }}><HIcon type={h.type}/><span style={{ fontSize:10,color:T.t3,textTransform:"capitalize" }}>{h.type}</span></div>
                <div>
                  <div style={{ fontSize:12,color:T.t1 }}>{h.text}</div>
                  <div style={{ fontSize:10,color:T.t4 }}>{u?.name||"System"}</div>
                  {h.is_document&&<span style={{ background:"#dcfce7",color:T.green,fontSize:10,padding:"1px 6px",borderRadius:8,fontWeight:700 }}>📎 DOCUMENT</span>}
                  {h.is_document&&h.doc_data&&<button onClick={()=>setViewingDoc({name:h.doc_name||"Document",data:h.doc_data,type:h.doc_type||"image/jpeg"})} style={{ marginLeft:6,background:T.green,color:"#fff",border:"none",borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>👁 View</button>}
                </div>
              </div>;})}
            </div>
          </div>}

          {/* ─ TASKS ─ */}
          {tab==="Tasks"&&<div>
            {tTasks.length===0?<div style={{ color:T.t4,fontSize:12,padding:"10px 0" }}>No tasks linked to this talent.</div>:<table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Task</TH><TH>Priority</TH><TH>Assigned</TH><TH>Due</TH><TH>Status</TH></tr></thead><tbody>{tTasks.map(tk=>{const asn=USERS.find(u=>u.id===tk.assigned_to);return <tr key={tk.id}><TD>{tk.title}</TD><TD><PriBadge p={tk.priority}/></TD><TD muted>{asn?.name}</TD><TD muted>{tk.due||"—"}</TD><TD><span style={{ color:tk.status==="completed"?T.green:T.amber,fontSize:11,fontWeight:700,textTransform:"uppercase" }}>{tk.status}</span></TD></tr>;})}</tbody></table>}
          </div>}

          {/* ─ AUDIT LOG ─ */}
          {tab==="Audit Log"&&<Section title="Full Audit Trail" accent={T.purple}>
            {[...local.audit_log].reverse().map((e,i)=><div key={i} style={{ display:"grid",gridTemplateColumns:"120px 110px 1fr 110px",padding:"6px 10px",borderBottom:"1px solid #f5f5f5",alignItems:"center" }}>
              <span style={{ fontSize:11,color:T.t3 }}>{new Date(e.ts).toLocaleDateString()}</span>
              <div><div style={{ fontSize:11,color:T.t1,fontWeight:500 }}>{e.user}</div><div style={{ fontSize:10,color:T.t4 }}>{e.role}</div></div>
              <span style={{ fontSize:12,color:T.t2 }}>{e.action}</span>
              <StageBadge stage={e.stage}/>
            </div>)}
          </Section>}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export { TalentRecord };
