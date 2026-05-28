// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";

function ProspectPortal({ applications, onSaveApp, onBack }) {
  const [mode,setMode]=useState("landing");
  const [accessCode,setAccessCode]=useState("");
  const [foundApp,setFoundApp]=useState(null);
  const [lookupErr,setLookupErr]=useState("");
  const [newData,setNewData]=useState({talent_name:"",talent_email:""});

  function lookup(){
    const code=accessCode.trim().toUpperCase();
    const app=Object.values(applications).find(a=>a.access_code===code);
    if(app){setFoundApp(app);setMode("form");setLookupErr("");}
    else setLookupErr("Access code not found. Check your invitation email.");
  }

  function startNew(){
    if(!newData.talent_name||!newData.talent_email)return;
    const normalizedEmail=newData.talent_email.trim().toLowerCase();
    const hasSubmittedForEmail=Object.values(applications).some(a=>
      a.status==="submitted"&&String(a.talent_email||"").trim().toLowerCase()===normalizedEmail
    );
    if(hasSubmittedForEmail){
      setLookupErr("An application has already been submitted with this email address.");
      return;
    }
    const id="app_"+Date.now();
    const code=newData.talent_name.toUpperCase().replace(/\s+/g,"").slice(0,4)+Math.floor(1000+Math.random()*8999);
    const app={id,talent_id:null,access_code:code,talent_name:newData.talent_name,talent_email:newData.talent_email.trim(),status:"in_progress",created_at:new Date().toISOString(),last_saved:new Date().toISOString(),completed_sections:[],data:{}};
    onSaveApp(app);
    setFoundApp(app);
    setMode("form");
  }

  if(mode==="form"&&foundApp) return <ApplicationForm applications={applications} app={foundApp} onSave={updated=>{onSaveApp(updated);setFoundApp(updated);}} onExit={()=>setMode("landing")}/>;

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44,#162038)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"rgba(124,58,237,0.08)",top:-150,right:-100,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
      <div style={{ width:500,zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:60,height:60,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontFamily:"Georgia,serif",fontWeight:800,margin:"0 auto 12px",boxShadow:"0 8px 24px rgba(124,58,237,0.4)" }}>N</div>
          <div style={{ fontSize:28,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif" }}>Nzinga Talent</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:3 }}>Talent Application Portal</div>
        </div>

        {mode==="landing"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:4 }}>Welcome, Talent</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24,lineHeight:1.6 }}>Apply to join the Nzinga Talent Group roster, or continue a saved application.</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <button onClick={()=>setMode("apply")} style={{ width:"100%",padding:"12px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>🎭 Start New Application</button>
              <button onClick={()=>setMode("lookup")} style={{ width:"100%",padding:"12px",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>🔑 Resume Saved Application</button>
            </div>
            <div style={{ marginTop:16,textAlign:"center" }}><button onClick={onBack} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>← Back to company login</button></div>
          </div>
        )}

        {mode==="apply"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <button onClick={()=>setMode("landing")} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>← Back</button>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:16 }}>Create Your Application</div>
            {[["Full Name","talent_name","text","Your full legal name"],["Email Address","talent_email","email","your@email.com"]].map(([l,k,type,ph])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>{l} *</div>
                <input type={type} value={newData[k]} onChange={e=>setNewData(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
              </div>
            ))}
            {lookupErr&&<div style={{ color:"#fca5a5",fontSize:12,marginBottom:8 }}>{lookupErr}</div>}
            <button onClick={startNew} style={{ width:"100%",padding:"11px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4 }}>Begin Application →</button>
          </div>
        )}

        {mode==="lookup"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <button onClick={()=>setMode("landing")} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>← Back</button>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:4 }}>Resume Application</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18 }}>Enter the access code from your invitation email.</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>Access Code *</div>
            <input value={accessCode} onChange={e=>setAccessCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup()} placeholder="e.g. KAI2026" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:15,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit",textAlign:"center",marginBottom:6 }}/>
            {lookupErr&&<div style={{ color:"#fca5a5",fontSize:12,marginBottom:8,textAlign:"center" }}>{lookupErr}</div>}
            <button onClick={lookup} style={{ width:"100%",padding:"11px",background:T.orange,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Find My Application →</button>
            <div style={{ marginTop:10,textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)" }}>Demo code: <span style={{ color:"rgba(255,255,255,0.5)",cursor:"pointer" }} onClick={()=>setAccessCode("KAI2026")}>KAI2026</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APPLICATION FORM (multi-step, autosave, file upload, validation) ─────────
function ApplicationForm({ applications, app, onSave, onExit }) {
  const [data,setData]=useState({...app.data});
  const [currentSection,setCurrentSection]=useState(0);
  const [completedSections,setCompletedSections]=useState(new Set(app.completed_sections||[]));
  const [saveStatus,setSaveStatus]=useState("saved");
  const [submitted,setSubmitted]=useState(app.status==="submitted");
  const [touched,setTouched]=useState({});
  const [jumpTarget,setJumpTarget]=useState(null);
  const [submitErr,setSubmitErr]=useState("");
  const autoRef=useRef(null);
  const total=APP_SECTIONS.length;

  // Build missing map across all sections
  const missingMap={};
  APP_SECTIONS.forEach(s=>{ missingMap[s.id]=validateSection(s.id,data); });
  const allComplete=Object.values(missingMap).every(arr=>arr.length===0);

  useEffect(()=>{
    if(jumpTarget!==null){setCurrentSection(jumpTarget);setJumpTarget(null);}
  },[jumpTarget]);

  function updateField(fieldId,value,fileName,fileType){
    setData(prev=>{
      const next={...prev,[fieldId]:value};
      if(fileName) next[fieldId+"_name"]=fileName;
      if(fileType) next[fieldId+"_type"]=fileType;
      setSaveStatus("unsaved");
      clearTimeout(autoRef.current);
      autoRef.current=setTimeout(()=>{
        setSaveStatus("saving");
        const updated={...app,data:next,last_saved:new Date().toISOString(),completed_sections:Array.from(completedSections)};
        onSave(updated);
        setTimeout(()=>setSaveStatus("saved"),600);
      },2000);
      return next;
    });
    setTouched(t=>({...t,[fieldId]:true}));
  }

  function completeSection(idx){
    const secId=APP_SECTIONS[idx].id;
    const missing=validateSection(secId,data);
    if(missing.length>0){setTouched(t=>{const n={...t};missing.forEach(id=>{n[id]=true;});return n;});return;}
    setCompletedSections(prev=>{
      const next=new Set(prev);next.add(secId);
      const updated={...app,data,last_saved:new Date().toISOString(),completed_sections:Array.from(next)};
      onSave(updated);return next;
    });
    if(idx<total-1) setCurrentSection(idx+1);
  }

  function submitApp(){
    // Check all sections complete
    const allMissing={};
    APP_SECTIONS.forEach(s=>{allMissing[s.id]=validateSection(s.id,data);});
    const hasAny=Object.values(allMissing).some(arr=>arr.length>0);
    if(hasAny){const allFields={};Object.values(allMissing).flat().forEach(id=>{allFields[id]=true;});setTouched(allFields);return;}
    const emailToCheck=String(data.email||app.talent_email||"").trim().toLowerCase();
    const duplicateSubmitted=Object.values(applications).some(a=>
      a.id!==app.id&&a.status==="submitted"&&String((a.data&&a.data.email)||a.talent_email||"").trim().toLowerCase()===emailToCheck
    );
    if(duplicateSubmitted){
      setSubmitErr("An application with this email has already been submitted.");
      return;
    }
    setSubmitErr("");
    const updated={...app,data,status:"submitted",last_saved:new Date().toISOString(),completed_sections:APP_SECTIONS.map(s=>s.id),submitted_at:new Date().toISOString()};
    onSave(updated);setSubmitted(true);
  }

  const sec=APP_SECTIONS[currentSection];
  const progress=Math.round((completedSections.size/total)*100);

  if(submitted){return(
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:"center",maxWidth:440,padding:36 }}>
        <div style={{ fontSize:52,marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:26,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:8 }}>Application Submitted!</div>
        <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginBottom:20 }}>Thank you, <strong style={{ color:"rgba(255,255,255,0.8)" }}>{app.talent_name}</strong>. Your application is under review. A scout will reach out within 5–7 business days.</div>
        <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:14,marginBottom:20 }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3 }}>Your Access Code</div>
          <div style={{ fontSize:22,fontWeight:800,color:"#7c3aed",letterSpacing:"0.15em" }}>{app.access_code}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:3 }}>Save this to check status or re-access your application</div>
        </div>
        <button onClick={onExit} style={{ background:T.orange,color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Return to Portal</button>
      </div>
    </div>
  );}

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44)",fontFamily:"'Inter',sans-serif",display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"9px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontFamily:"Georgia,serif",fontWeight:800 }}>N</div>
          <div><div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Nzinga Talent Application</div><div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>{app.talent_name} · Code: {app.access_code}</div></div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ fontSize:11,color:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#fbbf24":"rgba(255,255,255,0.35)" }}>
            {saveStatus==="saved"&&"✓ Saved"}{saveStatus==="saving"&&"⟳ Saving…"}{saveStatus==="unsaved"&&"● Unsaved"}
          </div>
          <button onClick={onExit} style={{ background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Exit & Save</button>
        </div>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        {/* Section sidebar */}
        <div style={{ width:210,background:"rgba(0,0,0,0.2)",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"16px 0",flexShrink:0,overflowY:"auto" }}>
          <div style={{ padding:"0 14px",marginBottom:16 }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:5,display:"flex",justifyContent:"space-between" }}><span>Progress</span><span style={{ color:"#4ade80",fontWeight:700 }}>{progress}%</span></div>
            <div style={{ height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:progress+"%",background:"linear-gradient(90deg,#7c3aed,#2563eb)",borderRadius:2,transition:"width 0.4s" }}/></div>
          </div>
          {APP_SECTIONS.map((s,i)=>{
            const done=completedSections.has(s.id);
            const active=i===currentSection;
            const hasMissing=missingMap[s.id]&&missingMap[s.id].length>0&&Array.from(completedSections).includes(s.id);
            return <div key={s.id} onClick={()=>setCurrentSection(i)} style={{ padding:"8px 14px",cursor:"pointer",background:active?"rgba(124,58,237,0.2)":"transparent",borderLeft:`3px solid ${active?"#7c3aed":done&&!hasMissing?"#4ade80":hasMissing?"#dc2626":"transparent"}`,display:"flex",alignItems:"center",gap:8,marginBottom:1 }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:done&&!hasMissing?"#4ade80":hasMissing?"#dc2626":active?"#7c3aed":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:done&&!hasMissing?"#052e16":hasMissing?"#fff":active?"#fff":"rgba(255,255,255,0.4)",flexShrink:0 }}>{done&&!hasMissing?"✓":hasMissing?"!":i+1}</div>
              <span style={{ fontSize:11,fontWeight:active?700:400,color:active?"#fff":done&&!hasMissing?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.4)" }}>{s.label}</span>
            </div>;
          })}
          <div style={{ padding:"12px 14px 0",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:6 }}>
            {allComplete&&<button onClick={submitApp} style={{ width:"100%",padding:"9px",background:"linear-gradient(135deg,#15803d,#16a34a)",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Submit Application ✓</button>}
            {!allComplete&&<div style={{ fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center",lineHeight:1.5 }}>Complete all sections to submit</div>}
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex:1,overflowY:"auto",padding:"24px 28px" }}>
          <div style={{ maxWidth:600 }}>
            {/* Incomplete alert for this section */}
            {missingMap[sec.id]&&missingMap[sec.id].length>0&&completedSections.has(sec.id)&&(
              <div style={{ background:"rgba(220,38,38,0.12)",border:"1px solid rgba(220,38,38,0.35)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#fca5a5",fontWeight:600 }}>
                ⚠ {missingMap[sec.id].length} required field{missingMap[sec.id].length>1?"s":""} missing in this section
              </div>
            )}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}><span style={{ fontSize:20 }}>{sec.icon}</span><div style={{ fontSize:20,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif" }}>{sec.label}</div></div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>Section {currentSection+1} of {total}</div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {sec.fields.map(field=>{
                const val=data[field.id]||"";
                const isErr=touched[field.id]&&field.required&&!val.trim();
                const isFull=field.type==="textarea"||field.type==="multicheck"||field.type==="checkbox"||field.type==="file_upload";
                const inputStyle={background:"rgba(255,255,255,0.08)",border:`1px solid ${isErr?"#dc2626":"rgba(255,255,255,0.12)"}`,borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
                return (
                  <div key={field.id} style={{ gridColumn:isFull?"1/-1":"auto" }}>
                    {field.type!=="checkbox"&&field.type!=="file_upload"&&<div style={{ fontSize:11,color:isErr?"#fca5a5":"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:3 }}>{field.label}{field.required&&<span style={{ color:"#ef4444" }}> *</span>}</div>}
                    {isErr&&<div style={{ fontSize:10,color:"#fca5a5",marginBottom:3,fontWeight:600 }}>⚠ Required</div>}
                    {(field.type==="text"||field.type==="url")&&<input value={val} onChange={e=>{updateField(field.id,e.target.value);setTouched(t=>({...t,[field.id]:true}));}} placeholder={field.label} style={inputStyle}/>}
                    {field.type==="email"&&<input type="email" value={val} onChange={e=>updateField(field.id,e.target.value)} placeholder="email@example.com" style={inputStyle}/>}
                    {field.type==="tel"&&<input type="tel" value={val} onChange={e=>updateField(field.id,e.target.value)} placeholder="(555) 000-0000" style={inputStyle}/>}
                    {field.type==="date"&&<input type="date" value={val} onChange={e=>updateField(field.id,e.target.value)} style={inputStyle}/>}
                    {field.type==="textarea"&&<textarea rows={3} value={val} onChange={e=>updateField(field.id,e.target.value)} placeholder={field.label} style={{ ...inputStyle,resize:"vertical" }}/>}
                    {field.type==="select"&&<select value={val} onChange={e=>updateField(field.id,e.target.value)} style={{ ...inputStyle,cursor:"pointer" }}><option value="">Select…</option>{(field.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>}
                    {field.type==="multicheck"&&<div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{(field.options||[]).map(o=>{const sel=(val||"").split(",").filter(Boolean);const checked=sel.includes(o);return <label key={o} style={{ display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"4px 10px",borderRadius:20,background:checked?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)",border:`1px solid ${checked?"#7c3aed":"rgba(255,255,255,0.1)"}`,fontSize:12,color:checked?"#c4b5fd":"rgba(255,255,255,0.5)" }}><input type="checkbox" checked={checked} onChange={e=>{const n=e.target.checked?[...sel,o]:sel.filter(x=>x!==o);updateField(field.id,n.join(","));}} style={{ display:"none" }}/>{o}</label>;})}
                    {isErr&&<div style={{ width:"100%",fontSize:10,color:"#fca5a5",fontWeight:600 }}>⚠ Select at least one</div>}</div>}
                    {field.type==="checkbox"&&<label style={{ display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",padding:"10px 12px",borderRadius:8,background:val?"rgba(22,163,74,0.15)":isErr?"rgba(220,38,38,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${val?"rgba(22,163,74,0.3)":isErr?"rgba(220,38,38,0.5)":"rgba(255,255,255,0.1)"}` }}>
                      <div onClick={()=>updateField(field.id,val?"":"yes")} style={{ width:18,height:18,borderRadius:4,background:val?"#16a34a":"rgba(255,255,255,0.1)",border:`2px solid ${val?"#16a34a":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",marginTop:1 }}>{val&&<span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>✓</span>}</div>
                      <span style={{ fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.5 }}>{field.label}</span>
                    </label>}
                    {field.type==="file_upload"&&<div style={{ border:`2px dashed ${isErr?"#dc2626":val?"#4ade80":"rgba(255,255,255,0.2)"}`,borderRadius:8,padding:12,background:val?"rgba(22,163,74,0.08)":isErr?"rgba(220,38,38,0.08)":"rgba(255,255,255,0.03)",cursor:"pointer",position:"relative" }} onClick={()=>document.getElementById("fu_"+field.id)&&document.getElementById("fu_"+field.id).click()}>
                      <input id={"fu_"+field.id} type="file" accept="image/*,.pdf" onChange={e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>updateField(field.id,ev.target.result,file.name,file.type);r.readAsDataURL(file);}} style={{ display:"none" }}/>
                      <div style={{ fontSize:11,color:isErr?"#fca5a5":"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>{field.label}{field.required&&<span style={{ color:"#ef4444" }}> *</span>}</div>
                      {field.note&&<div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:6 }}>{field.note}</div>}
                      {val?<div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#4ade80",fontWeight:600 }}><span>✓</span>{data[field.id+"_name"]||"Uploaded"}</div>:<div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>📎 Click to upload · PNG, JPG, PDF</div>}
                      {isErr&&<div style={{ fontSize:10,color:"#fca5a5",marginTop:3,fontWeight:600 }}>⚠ Required document missing</div>}
                    </div>}
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,paddingTop:18,borderTop:"1px solid rgba(255,255,255,0.07)" }}>
              <div>{currentSection>0&&<button onClick={()=>setCurrentSection(currentSection-1)} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.7)",borderRadius:6,padding:"7px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>← Previous</button>}</div>
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)" }}>Autosaved every 2s</div>
                <button onClick={()=>completeSection(currentSection)} style={{ background:currentSection===total-1?"linear-gradient(135deg,#15803d,#16a34a)":"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:6,padding:"7px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  {currentSection<total-1?"Save & Continue →":"Complete Section ✓"}
                </button>
              </div>
            </div>
            {submitErr&&<div style={{ marginTop:10,fontSize:12,color:"#fca5a5",fontWeight:600 }}>{submitErr}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── SEND APPLICATION MODAL ───────────────────────────────────────────────────

export { ProspectPortal, ApplicationForm };
