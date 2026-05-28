// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";

function HistoryMod({ history, setHistory, talents, currentUser }) {
  const [filter, setFilter] = useState('all')
  const [showDocs, setShowDocs] = useState(false)
  const [note, setNote] = useState('')
  const [talentId, setTalentId] = useState('')
  const [type, setType] = useState('note')
  const [viewingDoc, setViewingDoc] = useState(null)
  const filt = history.filter((h) => {
    if (showDocs && !h.is_document) return false
    if (filter === 'my') return h.user_id === currentUser.id
    if (filter === 'flagged') return h.flagged
    if (filter === 'documents') return h.is_document
    return true
  })
  function add() {
    if (!note || !talentId) return
    setHistory((p) => [
      {
        id: 'h' + Date.now(),
        talent_id: talentId,
        user_id: currentUser.id,
        type,
        text: note,
        ts: new Date().toISOString(),
        flagged: false,
        is_document: false,
      },
      ...p,
    ])
    setNote('')
  }
  function flag(id) {
    setHistory((p) => p.map((h) => (h.id === id ? { ...h, flagged: !h.flagged } : h)))
  }

  return (
    <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
      {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            ['all', 'All Activity'],
            ['my', 'My Notes'],
            ['flagged', 'Flagged'],
            ['documents', 'Documents Only'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                background: filter === v ? '#fff' : 'transparent',
                border: `1px solid ${filter === v ? '#d1d5db' : 'transparent'}`,
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 11,
                color: filter === v ? T.blue : T.t3,
                cursor: 'pointer',
                fontWeight: filter === v ? 600 : 400,
                fontFamily: 'inherit',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: T.t2,
            cursor: 'pointer',
            marginLeft: 8,
            padding: '4px 8px',
            background: showDocs ? T.blueL : 'transparent',
            borderRadius: 5,
            border: `1px solid ${showDocs ? T.blue + '44' : 'transparent'}`,
          }}
        >
          <input
            type="checkbox"
            checked={showDocs}
            onChange={(e) => setShowDocs(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Attached documents only
        </label>
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <Lbl>Talent</Lbl>
            <FSelect
              value={talentId}
              onChange={setTalentId}
              options={[{ v: '', l: 'Select talent?' }, ...talents.map((t) => ({ v: t.id, l: t.name }))]}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Lbl>Type</Lbl>
            <FSelect
              value={type}
              onChange={setType}
              options={['note', 'call', 'email', 'task', 'document']}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <FTextarea
          value={note}
          onChange={setNote}
          placeholder="Enter note, call summary, or email log?"
          rows={2}
        />
        <div style={{ marginTop: 8 }}>
          <Btn sm variant="primary" onClick={add}>
            Post Note
          </Btn>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        {filt.length === 0 ? (
          <div style={{ padding: '14px 12px', color: T.t4, fontSize: 12, textAlign: 'center' }}>
            No entries match this filter.
          </div>
        ) : (
          filt.map((h) => {
            const tal = talents.find((t) => t.id === h.talent_id)
            const usr = USERS.find((u) => u.id === h.user_id)
            return (
              <div
                key={h.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 60px 32px 1fr auto',
                  padding: '8px 14px',
                  borderBottom: '1px solid #f5f5f5',
                  alignItems: 'start',
                  gap: 8,
                  background: h.is_document ? '#f0fdf4' : 'transparent',
                }}
              >
                <span style={{ fontSize: 11, color: T.t3 }}>
                  {new Date(h.ts).toLocaleDateString()}
                </span>
                <span style={{ fontSize: 11, color: T.t3, textTransform: 'capitalize' }}>{h.type}</span>
                <HIcon type={h.type} />
                <div>
                  <span style={{ color: T.blue, fontSize: 12, fontWeight: 600 }}>{tal?.name}</span>
                  <span style={{ color: T.t4, fontSize: 11 }}> · {usr?.name}</span>
                  {h.flagged && (
                    <span
                      style={{
                        background: T.amberL,
                        color: T.amber,
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 8,
                        fontWeight: 700,
                        marginLeft: 6,
                      }}
                    >
                      FLAGGED
                    </span>
                  )}
                  {h.is_document && (
                    <span
                      style={{
                        background: '#dcfce7',
                        color: T.green,
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 8,
                        fontWeight: 700,
                        marginLeft: 6,
                      }}
                    >
                      DOC
                    </span>
                  )}
                  <div style={{ fontSize: 12, color: T.t2, marginTop: 1 }}>{h.text}</div>
                  {h.is_document && h.doc_data && (
                    <button
                      onClick={() =>
                        setViewingDoc({
                          name: h.doc_name || 'Document',
                          data: h.doc_data,
                          type: h.doc_type || 'image/jpeg',
                        })
                      }
                      style={{
                        marginTop: 5,
                        background: T.green,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      View Document
                    </button>
                  )}
                </div>
                <button
                  onClick={() => flag(h.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: 4,
                    padding: '2px 7px',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: h.flagged ? T.amber : T.t4,
                    fontFamily: 'inherit',
                  }}
                >
                  {h.flagged ? '?' : '?'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

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
            {visible.filter(t=>t.jordan_score>0).sort((a,b)=>b.jordan_score-a.jordan_score).map(t=>{const pass=t.jordan_score>=3.5&&t.pillar_scores.every(s=>s>=3);return <tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD>{t.pillar_scores.map((s,i)=><TD key={i} style={{color:s>=3?T.green:T.red,fontWeight:700,textAlign:"center"}}>{s}</TD>)}<TD><span style={{fontSize:15,fontWeight:800,color:t.jordan_score>=3.5?T.green:T.red}}>{t.jordan_score.toFixed(2)}</span></TD><TD><span style={{color:pass?T.green:T.red,fontSize:11,fontWeight:700}}>{pass?"G£ô PASS":"G£ù FAIL"}</span></TD></tr>;})}
          </tbody></table>
        </>}
        {active==="revenue_forecast"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.green,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Revenue Forecast</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Name</TH><TH>Stage</TH><TH>YTD</TH><TH>Projected</TH><TH>Rep</TH></tr></thead><tbody>
            {visible.filter(t=>!["archived","not_viable"].includes(t.stage)).sort((a,b)=>b.revenue_projected-a.revenue_projected).map(t=><tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD><TD><StageBadge stage={t.stage}/></TD><TD style={{color:T.green,fontWeight:700}}>{parseInt(t.revenue_ytd)>0?"$"+parseInt(t.revenue_ytd).toLocaleString():"GÇö"}</TD><TD style={{color:T.cyan,fontWeight:700}}>{parseInt(t.revenue_projected)>0?"$"+parseInt(t.revenue_projected).toLocaleString():"GÇö"}</TD><TD muted>{t.rep_type||"GÇö"}</TD></tr>)}
          </tbody></table>
        </>}
        {active==="compliance_status"&&<>
          <div style={{ padding:"9px 12px",borderBottom:"2px solid "+T.blue,background:"#f8f9fb" }}><span style={{ fontSize:12,fontWeight:700,color:T.t1,textTransform:"uppercase" }}>Compliance Status</span></div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Name</TH><TH>Legal</TH><TH>ID</TH><TH>DOB</TH><TH>Address</TH><TH>Email</TH><TH>Tax</TH><TH>Bank</TH><TH>Social</TH><TH>Total</TH></tr></thead><tbody>
            {visible.filter(t=>Object.keys(t.compliance||{}).length>0).map(t=>{const keys=["legal_name","gov_id","dob","address","email_phone","tax_doc","banking","social_ownership"];const done=keys.filter(k=>t.compliance[k]).length;return <tr key={t.id}><TD><span style={{color:T.blue,fontWeight:600}}>{t.name}</span></TD>{keys.map(k=><TD key={k} style={{textAlign:"center"}}><span style={{color:t.compliance[k]?T.green:T.red,fontWeight:700}}>{t.compliance[k]?"G£ô":"G£ù"}</span></TD>)}<TD><span style={{color:done===8?T.green:T.amber,fontWeight:700}}>{done}/8</span></TD></tr>;})}
          </tbody></table>
        </>}
      </div>
    </div>
  </div>;
}

// GöÇGöÇGöÇ NEW ENTRY GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ

export { HistoryMod, Reports };
