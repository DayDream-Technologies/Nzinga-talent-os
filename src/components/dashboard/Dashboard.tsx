// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";

function Dashboard({ talents, tasks, history, currentUser, onSelectTalent, onNav, applications }) {
  const role=currentUser.role;
  const actionStage=ROLE_ACTION_STAGE[role];
  const accessible=ROLE_STAGE_ACCESS[role]||[];
  // Strict RBAC: scouts see holding+scout_complete, team leads see their stage only, etc.
  const myQueue=talents.filter(t=>t.stage===actionStage);
  const myTasks=tasks.filter(t=>t.assigned_to===currentUser.id&&t.status==="open");
  const submittedApps=Object.values(applications).filter(a=>a.status==="submitted"&&isAppComplete(a));
  const incompleteApps=Object.values(applications).filter(a=>a.status==="submitted"&&!isAppComplete(a));

  return(
    <div style={{ padding:"14px 18px",flex:1,overflowY:"auto" }}>
      {/* Submitted complete apps alert */}
      {submittedApps.length>0&&(role==="scout"||role==="director")&&(
        <div onClick={()=>onNav("applications")} style={{ background:"linear-gradient(135deg,#dcfce7,#d1fae5)",border:"1px solid #86efac",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div><div style={{ fontWeight:700,color:T.green,fontSize:13 }}>{submittedApps.length} Application{submittedApps.length>1?"s":""} Ready to Import</div><div style={{ fontSize:11,color:T.t3 }}>100% complete — ready to enter pipeline automatically</div></div>
          </div>
          <Btn sm variant="success">Import Now →</Btn>
        </div>
      )}
      {incompleteApps.length>0&&(role==="scout"||role==="director")&&(
        <div onClick={()=>onNav("applications")} style={{ background:T.amberL,border:`1px solid ${T.amber}55`,borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div><div style={{ fontWeight:700,color:T.amber,fontSize:13 }}>{incompleteApps.length} Application{incompleteApps.length>1?"s":""} Submitted but Incomplete</div><div style={{ fontSize:11,color:T.t3 }}>Required fields missing — will not auto-import until complete</div></div>
          </div>
          <Btn sm variant="warning">Review →</Btn>
        </div>
      )}

      {/* Director idle pipeline alert */}
      {role==="director"&&(()=>{
        const now=Date.now();const idleStages=STAGES.filter(s=>s!=="archived"&&s!=="not_viable").filter(stg=>{
          const inStage=talents.filter(t=>t.stage===stg);if(!inStage.length)return false;
          const latest=Math.max(...inStage.map(t=>{const log=t.audit_log||[];return log.length?Date.parse(log[log.length-1].ts):0;}));
          return latest>0&&(now-latest)>24*60*60*1000;
        });
        if(!idleStages.length)return null;
        return(<div style={{ background:"#fef3c7",border:"1px solid #f59e0b55",borderRadius:8,padding:"10px 14px",marginBottom:12 }}>
          <div style={{ fontWeight:700,color:T.amber,fontSize:13,marginBottom:4 }}>⏰ Pipeline Idle Alert</div>
          <div style={{ fontSize:12,color:T.t2 }}>{idleStages.map(s=>{
            const inStage=talents.filter(t=>t.stage===s);const latest=Math.max(...inStage.map(t=>{const log=t.audit_log||[];return log.length?Date.parse(log[log.length-1].ts):0;}));
            const hrs=Math.round((now-latest)/3600000);
            return <div key={s} style={{ marginBottom:2 }}>• <strong>{STAGE_LABELS[s]}</strong> — no activity for {hrs}h ({inStage.length} talent{inStage.length>1?"s":""})</div>;
          })}</div>
        </div>);
      })()}

      {/* My Queue */}
      <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:14,overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:"2px solid "+T.blue,background:"#fafbfc" }}>
          <span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.05em" }}>My Queue — {ROLE_LABELS[role]}</span>
          <span style={{ background:T.blueL,color:T.blue,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>{myQueue.length}</span>
        </div>
        {myQueue.length===0?<div style={{ padding:"18px",textAlign:"center",color:T.t4,fontSize:12 }}>✓ Your queue is clear</div>:(
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>Score</TH><TH>App Status</TH><TH>Action</TH></tr></thead>
            <tbody>{myQueue.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="#f8f9fb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <TD><span style={{ color:T.blue,fontWeight:600,cursor:"pointer" }} onClick={()=>onSelectTalent(t)}>{t.name}</span><div style={{ fontSize:10,color:T.t4 }}>{t.social_handle}</div></TD>
              <TD><StageBadge stage={t.stage}/></TD>
              <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
              <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{ color:T.t4 }}>—</span>}</TD>
              <TD>{t.application_status?<span style={{ fontSize:11,fontWeight:600,color:t.application_status==="submitted"?T.green:T.amber }}>{t.application_status}</span>:<span style={{ color:T.t4,fontSize:11 }}>—</span>}</TD>
              <TD><Btn sm onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
            </tr>)}</tbody>
          </table>
        )}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:"2px solid "+T.amber,background:"#fafbfc" }}>
            <span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.05em" }}>Open Tasks</span>
            <Btn sm onClick={()=>onNav("tasks")}>View All</Btn>
          </div>
          <div style={{ padding:"8px 14px" }}>
            {myTasks.length===0?<div style={{ color:T.t4,fontSize:12,padding:"6px 0" }}>No open tasks.</div>:myTasks.slice(0,4).map(tk=><div key={tk.id} style={{ display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #f5f5f5",alignItems:"flex-start" }}>
              <PriBadge p={tk.priority}/>
              <div style={{ flex:1 }}><div style={{ fontSize:12,color:T.t1,fontWeight:500 }}>{tk.title}</div><div style={{ fontSize:10,color:T.t4 }}>Due {tk.due}</div></div>
            </div>)}
          </div>
        </div>
        <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden" }}>
          <div style={{ padding:"9px 14px",borderBottom:"2px solid "+T.purple,background:"#fafbfc" }}>
            <span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase",letterSpacing:"0.05em" }}>Recent Activity</span>
          </div>
          <div style={{ padding:"8px 14px" }}>
            {history.slice(0,5).map(h=>{const tal=talents.find(t=>t.id===h.talent_id);const usr=USERS.find(u=>u.id===h.user_id);return <div key={h.id} style={{ display:"flex",gap:7,padding:"4px 0",borderBottom:"1px solid #f5f5f5" }}>
              <HIcon type={h.type}/>
              <div style={{ flex:1 }}><span style={{ color:T.blue,fontSize:11,fontWeight:600 }}>{tal?.name}</span><span style={{ color:T.t4,fontSize:11 }}> · {usr?.name}</span><div style={{ fontSize:11,color:T.t2 }}>{h.text.slice(0,60)}{h.text.length>60?"…":""}</div></div>
            </div>;})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORKSPACE ────────────────────────────────────────────────────────────────
function Workspace({ currentUser, onNav }) {
  const favItems={
    "Talent":["All Talent","Pipeline","New Holding Entry","Applications"],
    "Operations":["Tasks","History / Notes"],
    "Reports":["Jordan Score Report","Revenue Forecast","Pipeline Summary"],
  };
  const reports={"Pipeline":["Pipeline Summary","Prospect Box Score"],"Scoring":["Jordan Score Report"],"Revenue":["Revenue Forecast"]};
  const nm={"All Talent":"roster","Pipeline":"pipeline","New Holding Entry":"new-entry","Tasks":"tasks","History / Notes":"history","Jordan Score Report":"reports?tab=jordan_scores","Revenue Forecast":"reports?tab=revenue_forecast","Pipeline Summary":"reports?tab=pipeline_summary","Prospect Box Score":"reports?tab=prospect_box_score","Applications":"applications"};
  function navTo(item) {
    const target=nm[item];
    if(!target) return;
    if(target.includes("?")) {
      const [path,search]=target.split("?");
      onNav(path+"?"+search);
    } else onNav(target);
  }
  return(
    <div style={{ padding:"22px 26px",flex:1,overflowY:"auto" }}>
      <div style={{ textAlign:"center",marginBottom:28 }}>
        <div style={{ fontSize:26,fontWeight:700,color:T.t1,fontFamily:"Georgia,serif" }}>Welcome, {currentUser.name.split(" ")[0]}</div>
        <div style={{ fontSize:13,color:T.t3,marginTop:3 }}>Let's get to work.</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
        <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",borderBottom:"1px solid #f0f0f0" }}><span style={{ fontSize:14,fontWeight:700,color:T.t1 }}>My Favorites</span></div>
          <div style={{ padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            {Object.entries(favItems).map(([cat,items])=><div key={cat}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:cat==="Talent"?"#dcfce7":cat==="Operations"?"#dbeafe":"#f3e8ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{cat==="Talent"?"🏠":cat==="Operations"?"⚙":"📊"}</div>
                <span style={{ fontSize:12,fontWeight:700,color:T.t1 }}>{cat}</span>
              </div>
              {items.map(item=><div key={item} onClick={()=>navTo(item)} style={{ fontSize:12,color:T.blue,cursor:"pointer",padding:"2px 0",paddingLeft:33 }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item}</div>)}
            </div>)}
          </div>
        </div>
        <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden" }}>
          <div style={{ padding:"11px 14px",borderBottom:"3px solid #16a34a" }}><span style={{ fontSize:14,fontWeight:700,color:T.t1 }}>My Reports</span></div>
          <div style={{ padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            {Object.entries(reports).map(([cat,items])=><div key={cat}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:cat==="Pipeline"?"#dcfce7":cat==="Scoring"?"#dbeafe":"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{cat==="Pipeline"?"🏠":cat==="Scoring"?"💰":"📊"}</div>
                <span style={{ fontSize:12,fontWeight:700,color:T.t1 }}>{cat}</span>
              </div>
              {items.map(item=><div key={item} onClick={()=>navTo(item)} style={{ fontSize:12,color:T.blue,cursor:"pointer",padding:"2px 0",paddingLeft:33 }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item}</div>)}
            </div>)}
          </div>
        </div>
      </div>
      <div style={{ marginTop:14,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:12,color:T.t3 }}>📢 <strong>Announcements</strong> — No new announcements</span>
        <span onClick={()=>onNav("training")} style={{ fontSize:12,color:T.blue,cursor:"pointer" }}>🎓 My Training</span>
      </div>
    </div>
  );
}

// ─── APPLICATIONS PANEL ───────────────────────────────────────────────────────
function ApplicationsPanel({ applications, talents, onViewApp, onImportApp }) {
  const [filter,setFilter]=useState("all");
  const apps=Object.values(applications);
  const filtered=apps.filter(a=>{
    if(filter==="pending") return a.status==="sent"||a.status==="in_progress";
    if(filter==="submitted_complete") return a.status==="submitted"&&isAppComplete(a);
    if(filter==="submitted_incomplete") return a.status==="submitted"&&!isAppComplete(a);
    return true;
  });
  const counts={all:apps.length,pending:apps.filter(a=>a.status==="sent"||a.status==="in_progress").length,submitted_complete:apps.filter(a=>a.status==="submitted"&&isAppComplete(a)).length,submitted_incomplete:apps.filter(a=>a.status==="submitted"&&!isAppComplete(a)).length};

  return(
    <div style={{ padding:"14px 18px",flex:1,overflowY:"auto" }}>
      <div style={{ background:T.blueL,border:`1px solid ${T.blue}33`,borderRadius:8,padding:"9px 14px",marginBottom:12,fontSize:12,color:T.blue }}>
        <strong>Application Pipeline Rules:</strong> Incomplete applications remain here until 100% complete. Once fully submitted, they auto-import into the main pipeline as a Holding Entry.
      </div>
      <div style={{ display:"flex",gap:6,marginBottom:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:5 }}>
          {[["all","All",T.t3],["pending","⏳ In Progress",T.amber],["submitted_complete","✅ Ready to Import",T.green],["submitted_incomplete","⚠ Incomplete",T.red]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{ background:filter===v?"#fff":"transparent",border:`1px solid ${filter===v?"#d1d5db":"transparent"}`,borderRadius:5,padding:"4px 10px",fontSize:11,color:filter===v?c:T.t3,cursor:"pointer",fontWeight:filter===v?600:400,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
              {l}<span style={{ background:"#f3f4f6",color:T.t3,borderRadius:8,padding:"0 5px",fontSize:10 }}>{counts[v]}</span>
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0?<div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:28,textAlign:"center" }}><div style={{ fontSize:28,marginBottom:6 }}>📋</div><div style={{ fontSize:13,fontWeight:600,color:T.t1 }}>No applications in this filter</div></div>:(
        <table style={{ width:"100%",borderCollapse:"collapse",background:"#fff",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <thead><tr><TH>Talent</TH><TH>Status</TH><TH>Progress</TH><TH>Access Code</TH><TH>Missing Fields</TH><TH>Last Activity</TH><TH>Actions</TH></tr></thead>
          <tbody>
            {filtered.map(app=>{
              const progress=Math.round(((app.completed_sections||[]).length/APP_SECTIONS.length)*100);
              const complete=isAppComplete(app);
              const missingCount=APP_SECTIONS.reduce((a,s)=>a+(validateSection(s.id,app.data||{}).length),0);
              const st={sent:{bg:T.amberL,c:T.amber,l:"Sent"},in_progress:{bg:T.blueL,c:T.blue,l:"In Progress"},submitted:{bg:complete?T.greenL:T.redL,c:complete?T.green:T.red,l:complete?"✅ Complete":"⚠ Incomplete"}}[app.status]||{bg:"#f3f4f6",c:T.t3,l:"Draft"};
              return <tr key={app.id} onMouseEnter={e=>e.currentTarget.style.background="#f8f9fb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <TD><span style={{ fontWeight:600,color:T.t1 }}>{app.talent_name}</span><div style={{ fontSize:10,color:T.t4 }}>{app.talent_email}</div></TD>
                <TD><span style={{ background:st.bg,color:st.c,borderRadius:10,padding:"2px 8px",fontSize:11,fontWeight:700 }}>{st.l}</span></TD>
                <TD><div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:60,height:5,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:progress+"%",background:complete?T.green:T.blue,borderRadius:3 }}/></div><span style={{ fontSize:11,color:T.t3,fontWeight:600 }}>{progress}%</span></div></TD>
                <TD><span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,color:T.purple,background:T.purpleL,padding:"2px 8px",borderRadius:5 }}>{app.access_code}</span></TD>
                <TD>{missingCount>0?<span style={{ color:T.red,fontWeight:600,fontSize:11 }}>⚠ {missingCount} fields</span>:<span style={{ color:T.green,fontWeight:600,fontSize:11 }}>✓ None</span>}</TD>
                <TD muted>{new Date(app.last_saved).toLocaleDateString()}</TD>
                <TD><div style={{ display:"flex",gap:5 }}>
                  <Btn sm variant="ghost" onClick={()=>onViewApp(app)}>Review</Btn>
                  {complete&&app.status==="submitted"&&<Btn sm variant="success" onClick={()=>onImportApp(app)}>Import →</Btn>}
                </div></TD>
              </tr>;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────

export { Dashboard, Workspace, ApplicationsPanel };
