// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, getVisibleSections, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { TalentLink } from "@/components/talent/TalentLink";

const DASH = {
  pageBg: T.pageBg,
  pagePattern: 'radial-gradient(circle at 15% 85%, rgba(59,130,246,0.06) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(0,45,86,0.04) 0%, transparent 40%)',
  card: { bg: T.cardBg, border: T.cardBorder, radius: 10, shadow: '0 2px 10px rgba(15,23,42,0.08)' },
  header: { bg: T.cardBg, border: T.cardBorder },
  text: { primary: T.t1, secondary: T.t3, muted: T.t4 },
  blue: { link: T.blue, accent: T.blue, light: T.blueL, dark: '#002d56', mid: '#3b82f6' },
  iconBgs: [T.blueL, T.blueL, T.blueL, T.blue],
};

function dashPageStyle(padding) {
  return { padding, flex: 1, overflowY: 'auto', minHeight: '100%', background: DASH.pageBg, backgroundImage: DASH.pagePattern };
}
function dashCardStyle(extra = {}) {
  return { background: DASH.card.bg, border: `1px solid ${DASH.card.border}`, borderRadius: DASH.card.radius, boxShadow: DASH.card.shadow, overflow: 'hidden', ...extra };
}
function dashPanelHeaderStyle(extra = {}) {
  return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: DASH.header.bg, borderBottom: `2px solid ${DASH.blue.accent}`, ...extra };
}
function dashSubCardStyle() {
  return { border: `1px solid ${DASH.header.border}`, borderRadius: 8, padding: '10px 12px', background: DASH.card.bg };
}
function dashAlertStyle(variant = 'accent') {
  const borderColor = variant === 'dark' ? DASH.blue.dark : DASH.blue.accent;
  return { background: DASH.card.bg, border: `1px solid ${DASH.card.border}`, borderLeft: `4px solid ${borderColor}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, boxShadow: DASH.card.shadow };
}

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
    <div style={dashPageStyle("14px 18px")}>
      {/* Submitted complete apps alert */}
      {submittedApps.length>0&&(role==="scout"||role==="director")&&(
        <div onClick={()=>onNav("applications")} style={{ ...dashAlertStyle('accent'), display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div><div style={{ fontWeight:700,color:DASH.text.primary,fontSize:13 }}>{submittedApps.length} Application{submittedApps.length>1?"s":""} Ready to Import</div><div style={{ fontSize:11,color:DASH.text.secondary }}>100% complete — ready to enter pipeline automatically</div></div>
          </div>
          <Btn sm>Import Now →</Btn>
        </div>
      )}
      {incompleteApps.length>0&&(role==="scout"||role==="director")&&(
        <div onClick={()=>onNav("applications")} style={{ ...dashAlertStyle('dark'), display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div><div style={{ fontWeight:700,color:DASH.text.primary,fontSize:13 }}>{incompleteApps.length} Application{incompleteApps.length>1?"s":""} Submitted but Incomplete</div><div style={{ fontSize:11,color:DASH.text.secondary }}>Required fields missing — will not auto-import until complete</div></div>
          </div>
          <Btn sm>Review →</Btn>
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
        return(<div style={{ ...dashAlertStyle('dark'), background:DASH.blue.light }}>
          <div style={{ fontWeight:700,color:DASH.text.primary,fontSize:13,marginBottom:4 }}>⏰ Pipeline Idle Alert</div>
          <div style={{ fontSize:12,color:DASH.text.secondary }}>{idleStages.map(s=>{
            const inStage=talents.filter(t=>t.stage===s);const latest=Math.max(...inStage.map(t=>{const log=t.audit_log||[];return log.length?Date.parse(log[log.length-1].ts):0;}));
            const hrs=Math.round((now-latest)/3600000);
            return <div key={s} style={{ marginBottom:2 }}>• <strong>{STAGE_LABELS[s]}</strong> — no activity for {hrs}h ({inStage.length} talent{inStage.length>1?"s":""})</div>;
          })}</div>
        </div>);
      })()}

      {/* My Queue */}
      <div style={dashCardStyle({ marginBottom:14 })}>
        <div style={dashPanelHeaderStyle()}>
          <span style={{ fontSize:12,fontWeight:700,color:DASH.text.primary,textTransform:"uppercase",letterSpacing:"0.05em" }}>My Queue — {ROLE_LABELS[role]}</span>
          <span style={{ background:DASH.blue.light,color:DASH.blue.link,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700 }}>{myQueue.length}</span>
        </div>
        {myQueue.length===0?<div style={{ padding:"18px",textAlign:"center",color:DASH.text.muted,fontSize:12 }}>✓ Your queue is clear</div>:(
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>Score</TH><TH>App Status</TH><TH>Action</TH></tr></thead>
            <tbody>{myQueue.map(t=><tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background="#f0f4f8"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <TD><TalentLink accountId={t.account_number} name={t.name} /><div style={{ fontSize:10,color:DASH.text.muted }}>{t.social_handle}</div></TD>
              <TD><StageBadge stage={t.stage}/></TD>
              <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
              <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{ color:DASH.text.muted }}>—</span>}</TD>
              <TD>{t.application_status?<span style={{ fontSize:11,fontWeight:600,color:t.application_status==="submitted"?T.green:T.amber }}>{t.application_status}</span>:<span style={{ color:DASH.text.muted,fontSize:11 }}>—</span>}</TD>
              <TD><Btn sm onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
            </tr>)}</tbody>
          </table>
        )}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div style={dashCardStyle()}>
          <div style={dashPanelHeaderStyle()}>
            <span style={{ fontSize:12,fontWeight:700,color:DASH.text.primary,textTransform:"uppercase",letterSpacing:"0.05em" }}>Open Tasks</span>
            <Btn sm onClick={()=>onNav("tasks")}>View All</Btn>
          </div>
          <div style={{ padding:"8px 14px" }}>
            {myTasks.length===0?<div style={{ color:DASH.text.muted,fontSize:12,padding:"6px 0" }}>No open tasks.</div>:myTasks.slice(0,4).map(tk=><div key={tk.id} style={{ display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #f0f4f8",alignItems:"flex-start" }}>
              <PriBadge p={tk.priority}/>
              <div style={{ flex:1 }}><div style={{ fontSize:12,color:DASH.text.primary,fontWeight:500 }}>{tk.title}</div><div style={{ fontSize:10,color:DASH.text.muted }}>Due {tk.due}</div></div>
            </div>)}
          </div>
        </div>
        <div style={dashCardStyle()}>
          <div style={dashPanelHeaderStyle({ justifyContent:'flex-start' })}>
            <span style={{ fontSize:12,fontWeight:700,color:DASH.text.primary,textTransform:"uppercase",letterSpacing:"0.05em" }}>Recent Activity</span>
          </div>
          <div style={{ padding:"8px 14px" }}>
            {history.slice(0,5).map(h=>{const tal=talents.find(t=>t.id===h.talent_id);const usr=USERS.find(u=>u.id===h.user_id);return <div key={h.id} style={{ display:"flex",gap:7,padding:"4px 0",borderBottom:"1px solid #f0f4f8" }}>
              <HIcon type={h.type}/>
              <div style={{ flex:1 }}><TalentLink accountId={tal?.account_number} name={tal?.name} /><span style={{ color:DASH.text.muted,fontSize:11 }}> · {usr?.name}</span><div style={{ fontSize:11,color:DASH.text.secondary }}>{h.text.slice(0,60)}{h.text.length>60?"…":""}</div></div>
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
    "Talent":["Prospects","Clients","Tracking Board","Applications"],
    "Operations":["Tasks","History / Notes"],
    "Reports":["Jordan Score Report","Revenue Forecast","Pipeline Summary"],
  };
  const reports={"Pipeline":["Pipeline Summary","Prospect Box Score"],"Scoring":["Jordan Score Report"],"Revenue":["Revenue Forecast"]};
  const nm={"Prospects":"prospects","Clients":"clients","Tracking Board":"prospect-tracking","All Talent":"clients","Pipeline":"pipeline","Add Talent Applicant":"new-entry","Tasks":"agency-tasks","History / Notes":"history","Jordan Score Report":"reports?tab=jordan_scores","Revenue Forecast":"reports?tab=revenue_forecast","Pipeline Summary":"reports?tab=pipeline_summary","Prospect Box Score":"reports?tab=prospect_box_score","Applications":"applications"};
  function navTo(item) {
    const target=nm[item];
    if(!target) return;
    if(target.includes("?")) {
      const [path,search]=target.split("?");
      onNav(path+"?"+search);
    } else onNav(target);
  }
  return(
    <div style={dashPageStyle("28px 32px")}>
      <div style={{ textAlign:"center",marginBottom:32 }}>
        <div style={{ fontSize:36,fontWeight:700,color:DASH.text.primary,fontFamily:"'Syne',sans-serif" }}>Welcome, {currentUser.name.split(" ")[0]}</div>
        <div style={{ fontSize:16,color:DASH.text.secondary,marginTop:8 }}>Let's get to work.</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:22 }}>
        <div style={{ ...dashCardStyle(), padding: 4 }}>
          <div style={dashPanelHeaderStyle({ justifyContent:'flex-start', padding: '14px 16px' })}><span style={{ fontSize:16,fontWeight:700,color:DASH.text.primary }}>My Favorites</span></div>
          <div style={{ padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            {Object.entries(favItems).map(([cat,items],idx)=><div key={cat} style={{ ...dashSubCardStyle(), padding: '14px 14px' }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:DASH.iconBgs[idx%DASH.iconBgs.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{cat==="Talent"?"🏠":cat==="Operations"?"⚙":"📊"}</div>
                <span style={{ fontSize:13,fontWeight:700,color:DASH.text.primary }}>{cat}</span>
              </div>
              {items.map(item=><div key={item} onClick={()=>navTo(item)} style={{ fontSize:13,color:DASH.blue.link,cursor:"pointer",padding:"4px 0",paddingLeft:38 }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item}</div>)}
            </div>)}
          </div>
        </div>
        <div style={{ ...dashCardStyle(), padding: 4 }}>
          <div style={dashPanelHeaderStyle({ justifyContent:'flex-start', padding: '14px 16px' })}><span style={{ fontSize:16,fontWeight:700,color:DASH.text.primary }}>My Reports</span></div>
          <div style={{ padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            {Object.entries(reports).map(([cat,items],idx)=><div key={cat} style={{ ...dashSubCardStyle(), padding: '14px 14px' }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:DASH.iconBgs[idx%DASH.iconBgs.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{cat==="Pipeline"?"🏠":cat==="Scoring"?"💰":"📊"}</div>
                <span style={{ fontSize:13,fontWeight:700,color:DASH.text.primary }}>{cat}</span>
              </div>
              {items.map(item=><div key={item} onClick={()=>navTo(item)} style={{ fontSize:13,color:DASH.blue.link,cursor:"pointer",padding:"4px 0",paddingLeft:38 }} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{item}</div>)}
            </div>)}
          </div>
        </div>
      </div>
      <div style={{ ...dashCardStyle(), marginTop:14, padding:"9px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12,color:DASH.text.secondary }}>📢 <strong style={{ color:DASH.text.primary }}>Announcements</strong> — No new announcements</span>
        <span onClick={()=>onNav("training")} style={{ fontSize:12,color:DASH.blue.link,cursor:"pointer" }}>🎓 TMX Academy</span>
      </div>
    </div>
  );
}

export { Dashboard, Workspace };
