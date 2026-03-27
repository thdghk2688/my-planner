import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const TYPES0 = [
  {key:"work",label:"업무",color:"#378ADD"},
  {key:"exhibition",label:"체험관",color:"#1D9E75"},
  {key:"edu_center",label:"식품안전교육센터",color:"#7F77DD"},
  {key:"trip",label:"출장",color:"#D85A30"},
  {key:"edu_ops",label:"교육운영단",color:"#BA7517"},
  {key:"cooperation",label:"업무협조",color:"#D4537E"},
  {key:"field",label:"현지실사교육",color:"#0F6E56"},
  {key:"etc",label:"기타",color:"#888780"},
];
const SL = [
  {key:"before",label:"시작 전",border:"#E24B4A"},
  {key:"doing",label:"진행 중",border:"#378ADD"},
  {key:"done",label:"완료",border:"#B4B2A9"},
  {key:"cancel",label:"취소",border:"#B4B2A9"},
];
const PL = ["낮음","보통","높음","긴급"];
const PC = ["#888780","#378ADD","#EF9F27","#E24B4A"];
const PCOLS = [
  "#1A3A6B","#0F6E56","#5C1F8A","#8B1A1A","#7A4000","#004D5C",
  "#378ADD","#1D9E75","#7F77DD","#E24B4A","#D85A30","#00897B",
  "#2196F3","#00C853","#9C27B0","#F44336","#FF6D00","#00BCD4",
  "#64B5F6","#69F0AE","#CE93D8","#EF9A9A","#FFAB40","#80DEEA",
  "#D4537E","#BA7517","#639922","#546E7A","#795548","#888780",
];
const ET = [
  {key:"worker",label:"종사자",short:"종",color:"#7F77DD"},
  {key:"future",label:"미래인재",short:"미",color:"#1D9E75"},
  {key:"trainer",label:"강사",short:"강",color:"#D85A30"},
];
const EF = [
  {key:"visit",label:"찾아가는"},
  {key:"center",label:"본원"},
  {key:"online",label:"비대면"},
];
const WDAYS = ["일","월","화","수","목","금","토"];

const gid = () => Math.random().toString(36).slice(2,10);
const fmtD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const tod = () => fmtD(new Date());
const pld = (s) => { if(!s) return null; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const sameD = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const inR = (day,s,e) => { const sd=pld(s),ed=pld(e); if(!sd) return false; const d=pld(fmtD(day)); return ed?d>=sd&&d<=ed:sameD(day,sd); };
const rgba = (hex,a) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const tInfo = (types,key) => types.find(t=>t.key===key)||types[0]||{color:"#888",label:"기타"};
const sInfo = (key) => SL.find(s=>s.key===key)||SL[0];
const pND = (raw) => { if(!raw) return tod(); const m=raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/); return m?`${m[1]}-${m[2]}-${m[3]}`:tod(); };
const pStat = (s) => { if(!s) return "before"; if(s==="완료") return "done"; if(s==="진행") return "doing"; if(s==="취소"||s==="보류") return "cancel"; return "before"; };
const tType = (f) => { if(!f) return "etc"; if(f.includes("체험관")) return "exhibition"; if(f.includes("식품안전교육센터")) return "edu_center"; if(f.includes("출장")) return "trip"; if(f.includes("교육운영단")) return "edu_ops"; if(f.includes("업무협조")) return "cooperation"; if(f.includes("현지실사")) return "field"; return "etc"; };

const taskToDb = (t) => ({ id: t.id, title: t.title, type: t.type, start_date: t.startDate, end_date: t.endDate, due_time: t.dueTime||"", priority: t.priority, status: t.status, note: t.note||"" });
const taskFromDb = (r) => ({ id: r.id, title: r.title, type: r.type, startDate: r.start_date, endDate: r.end_date, dueTime: r.due_time||"", priority: r.priority, status: r.status, note: r.note||"" });
const eduToDb = (e) => ({ id: e.id, target: e.target, type: e.type, nth: e.nth, start_date: e.startDate, end_date: e.endDate, start_time: e.startTime, end_time: e.endTime, region: e.region||"", place: e.place||"", lectures: e.lectures||[], note: e.note||"" });
const eduFromDb = (r) => ({ id: r.id, target: r.target, type: r.type, nth: r.nth, startDate: r.start_date, endDate: r.end_date, startTime: r.start_time, endTime: r.end_time, region: r.region||"", place: r.place||"", lectures: r.lectures||[], note: r.note||"" });
const typeToDb = (t, i) => ({id: t.key, key: t.key, label: t.label, color: t.color, sort_order: i});
const typeFromDb = (r) => ({key: r.key, label: r.label, color: r.color});

const ND=[["세종여고 강사카드 ppt 제출","2025/10/15","완료",0,""]]; // 예시 생략 (기존 ND 그대로 유지)
const TD=[["세종시청 14:00~16:00","2025/10/23","출장","완료",""]]; // 예시 생략 (기존 TD 그대로 유지)
const INIT_TASKS = [...ND.map(r=>({id:gid(),title:r[0],type:"work",startDate:pND(r[1]),endDate:pND(r[1]),dueTime:"",priority:r[3],status:pStat(r[2]),note:r[4]})), ...TD.map(r=>({id:gid(),title:r[0],type:tType(r[2]),startDate:pND(r[1]),endDate:pND(r[1]),dueTime:"",priority:1,status:pStat(r[3]),note:r[4]}))];
const INIT_EDU = [{id:gid(),target:"worker",type:"center",nth:1,startDate:"2026-03-25",endDate:"2026-03-26",startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"식품위생 기초",instructor:"김강사"}],note:""}];

function Overlay({children,onClose}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
        {children}
      </div>
    </div>
  );
}

function TaskBlock({t,types,onClick,selMode,isSel,onSel}) {
  const si=sInfo(t.status), ti=tInfo(types,t.type);
  const now=new Date(), end=pld(t.endDate);
  const dl=end?Math.ceil((end-now)/86400000):null;
  const ov=t.status!=="done"&&t.status!=="cancel"&&dl!==null&&dl<0;
  const sk=t.status==="done"||t.status==="cancel";
  return (
    <div onClick={()=>selMode?onSel(t.id):onClick(t)}
      style={{padding:"4px 6px",borderRadius:6,marginBottom:4,cursor:"pointer",
        background:isSel?rgba(ti.color,0.25):rgba(ti.color,0.10),
        border:`1px solid ${isSel?"#378ADD":si.border}`,
        borderLeft:`3px solid ${isSel?"#378ADD":si.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        {selMode&&<div style={{width:13,height:13,borderRadius:3,border:`2px solid ${isSel?"#378ADD":"#ccc"}`,background:isSel?"#378ADD":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{isSel&&<span style={{color:"#fff",fontSize:8}}>✓</span>}</div>}
        {!selMode&&<div style={{width:5,height:5,borderRadius:"50%",background:ti.color,flexShrink:0}}/>}
        <span style={{flex:1,fontSize:11,fontWeight:500,textDecoration:sk?"line-through":"none",color:sk?"#bbb":"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
        {ov&&<span style={{fontSize:9,color:"#E24B4A",flexShrink:0}}>초과</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2,paddingLeft:10,flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:"#888"}}>{t.startDate}{t.endDate&&t.endDate!==t.startDate?`~${t.endDate}`:""}{t.dueTime?` ${t.dueTime}`:""}</span>
        {/* 수정 2번: 우선순위 배지 슬림화 */}
        <span style={{fontSize:9,padding:"2px 4px",borderRadius:3,lineHeight:1,background:PC[t.priority]+"22",color:PC[t.priority]}}>{PL[t.priority]}</span>
        {dl!==null&&!sk&&<span style={{fontSize:8,color:ov?"#E24B4A":dl<=2?"#EF9F27":"#bbb"}}>{ov?`${Math.abs(dl)}일 초과`:dl===0?"오늘":"D-"+dl}</span>}
      </div>
    </div>
  );
}

function TaskForm({types,initial,onSave,onClose,onDelete}) {
  const [f,setF] = useState(initial||{title:"",type:types[0]?.key||"work",startDate:tod(),endDate:tod(),dueTime:"",priority:1,status:"before",note:""});
  // 수정 3번: 시작일 변경 시 종료일 동기화
  const upd = (k,v) => setF(p => {
    const next = { ...p, [k]: v };
    if (k === "startDate") {
      if (p.startDate === p.endDate || v > p.endDate) {
        next.endDate = v;
      }
    }
    return next;
  });
  const isEdit = !!onDelete;
  const tc = tInfo(types,f.type);
  const ai = useCallback(async() => {
    if(!f.title) return;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:`태스크: "${f.title}"\n우선순위 0~3 숫자만:`}]})});
      const data = await res.json();
      const n = parseInt(data.content?.[0]?.text?.trim());
      if(!isNaN(n)&&n>=0&&n<=3) upd("priority",n);
    } catch(e) {}
  },[f.title]);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>{isEdit?"태스크 수정":"새 태스크"}</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>제목</div><input value={f.title} onChange={e=>upd("title",e.target.value)} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderLeft:`3px solid ${tc.color}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>메모</div><textarea value={f.note} onChange={e=>upd("note",e.target.value)} rows={2} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div>
          <div style={{fontSize:11,color:"#666",marginBottom:3}}>유형</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{types.map(t=>{const on=f.type===t.key;return<button key={t.key} onClick={()=>upd("type",t.key)} style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:`1.5px solid ${on?t.color:"#ccc"}`,background:on?rgba(t.color,0.15):"#fff",color:on?t.color:"#666",cursor:"pointer",fontWeight:on?600:400}}>{t.label}</button>;})}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:"#666",marginBottom:3}}>상태</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{SL.map(st=>{const on=f.status===st.key;return<button key={st.key} onClick={()=>upd("status",st.key)} style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:`1.5px solid ${on?st.border:"#ccc"}`,background:on?rgba(st.border,0.1):"#fff",color:on?st.border:"#666",cursor:"pointer",fontWeight:on?600:400}}>{st.label}</button>;})}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작일</div><input type="date" value={f.startDate} onChange={e=>upd("startDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
          <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료일</div><input type="date" value={f.endDate} onChange={e=>upd("endDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
        </div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>마감 시간</div><input type="time" value={f.dueTime} onChange={e=>upd("dueTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div style={{flex:1}}><div style={{fontSize:11,color:"#666",marginBottom:3}}>우선순위</div><select value={f.priority} onChange={e=>upd("priority",parseInt(e.target.value))} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8}}>{PL.map((l,i)=><option key={i} value={i}>{l}</option>)}</select></div>
          <button onClick={ai} style={{padding:"6px 10px",fontSize:11,border:"1px solid #ccc",borderRadius:8,background:"#f5f5f5",cursor:"pointer"}}>AI 제안 ✦</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {isEdit&&<button onClick={onDelete} style={{padding:"7px 12px",background:"#fff0f0",color:"#c00",border:"1px solid #fcc",borderRadius:8,cursor:"pointer",fontSize:13}}>삭제</button>}
          <button onClick={onClose} style={{flex:1,padding:"7px",background:"#f5f5f5",border:"1px solid #ddd",borderRadius:8,cursor:"pointer",fontSize:13}}>취소</button>
          <button onClick={()=>{if(f.title.trim())onSave(f);}} style={{flex:2,padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function EduForm({initial,eduItems,onSave,onClose,onDelete}) {
  const isEdit=!!onDelete;
  const all=eduItems||[];
  const aNth=(tgt,cid,sd)=>{const same=all.filter(e=>e.target===tgt&&e.id!==cid).sort((a,b)=>a.startDate>b.startDate?1:-1);const idx=same.findIndex(e=>e.startDate>(sd||"9999"));return(idx===-1?same.length:idx)+1;};
  const [f,setF]=useState(()=>initial||{target:"worker",type:"center",nth:aNth("worker",null,tod()),startDate:tod(),endDate:tod(),startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"",instructor:""}],note:""});
  // 수정 3번: 교육 일정에서도 시작일 변경 시 종료일 동기화
  const upd=(k,v)=>setF(p=>{
    const next = { ...p, [k]: v };
    if(k==="target"&&!isEdit) next.nth = aNth(v, null, p.startDate);
    if(k==="startDate") {
      if(!isEdit) next.nth = aNth(p.target, null, v);
      if(p.startDate === p.endDate || v > p.endDate) next.endDate = v;
    }
    return next;
  });
  const ti=ET.find(t=>t.key===f.target)||ET[0];
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>{isEdit?"교육일정 수정":"교육일정 추가"}</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>교육 구분</div><div style={{display:"flex",gap:5}}>{ET.map(t=><button key={t.key} onClick={()=>upd("target",t.key)} style={{flex:1,padding:6,borderRadius:8,border:`1.5px solid ${f.target===t.key?t.color:"#ccc"}`,background:f.target===t.key?rgba(t.color,0.15):"#fff",color:f.target===t.key?t.color:"#666",cursor:"pointer",fontSize:13}}>{t.label}</button>)}</div></div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>교육 형태</div><div style={{display:"flex",gap:5}}>{EF.map(t=><button key={t.key} onClick={()=>upd("type",t.key)} style={{flex:1,padding:6,borderRadius:8,border:`1.5px solid ${f.type===t.key?ti.color:"#ccc"}`,background:f.type===t.key?rgba(ti.color,0.12):"#fff",color:f.type===t.key?ti.color:"#666",cursor:"pointer",fontSize:13}}>{t.label}</button>)}</div></div>
        {f.type==="visit"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:10,borderRadius:8,background:rgba(ti.color,0.07),border:`1px dashed ${rgba(ti.color,0.4)}`}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>지역</div><input value={f.region} onChange={e=>upd("region",e.target.value)} placeholder="예) 충북" style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>장소</div><input value={f.place} onChange={e=>upd("place",e.target.value)} placeholder="예) 청주교육원" style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div></div>}
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:11,color:"#666",whiteSpace:"nowrap"}}>차수</div><input type="number" min={1} value={f.nth} onChange={e=>upd("nth",parseInt(e.target.value)||1)} style={{width:70,padding:"6px 8px",border:"1px solid #ccc",borderRadius:8}}/><span style={{fontSize:11,color:"#888"}}>차 (자동계산)</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작일</div><input type="date" value={f.startDate} onChange={e=>upd("startDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료일</div><input type="date" value={f.endDate} onChange={e=>upd("endDate",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>시작 시간</div><input type="time" value={f.startTime} onChange={e=>upd("startTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,color:"#666",marginBottom:3}}>종료 시간</div><input type="time" value={f.endTime} onChange={e=>upd("endTime",e.target.value)} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,boxSizing:"border-box"}}/></div></div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{fontSize:11,color:"#666"}}>강의 내용 및 강사</div><button onClick={()=>upd("lectures",[...f.lectures,{id:gid(),subject:"",instructor:""}])} style={{fontSize:11,padding:"2px 8px",background:rgba(ti.color,0.1),border:`1px solid ${ti.color}`,color:ti.color,borderRadius:10,cursor:"pointer"}}>+ 추가</button></div>
          {f.lectures.map((l,i)=><div key={l.id} style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,padding:"6px 8px",background:"#f9f9f9",borderRadius:8}}><span style={{fontSize:11,color:"#999",minWidth:18}}>{i+1}.</span><input placeholder="강의 과목" value={l.subject} onChange={e=>upd("lectures",f.lectures.map(x=>x.id===l.id?{...x,subject:e.target.value}:x))} style={{flex:2,padding:"5px 8px",border:"1px solid #ccc",borderRadius:6,fontSize:12}}/><input placeholder="강사명" value={l.instructor} onChange={e=>upd("lectures",f.lectures.map(x=>x.id===l.id?{...x,instructor:e.target.value}:x))} style={{flex:1,padding:"5px 8px",border:"1px solid #ccc",borderRadius:6,fontSize:12}}/>{f.lectures.length>1&&<button onClick={()=>upd("lectures",f.lectures.filter(x=>x.id!==l.id))} style={{border:"none",background:"none",color:"#999",fontSize:14,cursor:"pointer"}}>×</button>}</div>)}
        </div>
        <div><div style={{fontSize:11,color:"#666",marginBottom:3}}>메모</div><textarea value={f.note} onChange={e=>upd("note",e.target.value)} rows={2} style={{width:"100%",padding:"6px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {isEdit&&<button onClick={onDelete} style={{padding:"7px 12px",background:"#fff0f0",color:"#c00",border:"1px solid #fcc",borderRadius:8,cursor:"pointer",fontSize:13}}>삭제</button>}
          <button onClick={onClose} style={{flex:1,padding:"7px",background:"#f5f5f5",border:"1px solid #ddd",borderRadius:8,cursor:"pointer",fontSize:13}}>취소</button>
          <button onClick={()=>onSave(f)} style={{flex:2,padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function DayPanel({date,tasks,types,onTask,onAdd,onClose}) {
  const dt=tasks.filter(t=>inR(date,t.startDate,t.endDate)).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  return(
    <div style={{marginTop:16,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafafa"}}>
        <strong style={{fontSize:13,color:"#333"}}>{date.getMonth()+1}월 {date.getDate()}일 업무 ({dt.length}건)</strong>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onAdd} style={{fontSize:11,padding:"4px 10px",borderRadius:16,border:"none",background:"#1a1a1a",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 추가</button>
          <button onClick={onClose} style={{fontSize:11,padding:"4px 8px",borderRadius:16,border:"1px solid #ddd",background:"#fff",color:"#888",cursor:"pointer"}}>닫기</button>
        </div>
      </div>
      <div style={{padding:"10px 12px",maxHeight:280,overflowY:"auto"}}>
        {dt.length===0?<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"1.5rem 0"}}>이 날 업무가 없어요</div>:dt.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={false} isSel={false} onSel={()=>{}}/>)}
      </div>
    </div>
  );
}

// 수정 4번: 교육 전용 하단 패널
function EduDayPanel({date, items, onItem, onAdd, onClose}) {
  const dt = items.filter(e => inR(date, e.startDate, e.endDate)).sort((a,b)=>a.startDate>b.startDate?1:-1);
  const lbl = item => {
    const t = ET.find(x => x.key === item.target);
    const loc = item.type === "visit" && item.region ? `(${item.region})` : "";
    return `${t ? t.short : "?"} ${item.nth}차 ${EF.find(x => x.key === item.type)?.label || ""}${loc}`;
  };
  return (
    <div style={{marginTop:16,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f0f0f0",background:"#fafafa"}}>
        <strong style={{fontSize:13,color:"#333"}}>{date.getMonth()+1}월 {date.getDate()}일 교육 일정 ({dt.length}건)</strong>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onAdd} style={{fontSize:11,padding:"4px 10px",borderRadius:16,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 추가</button>
          <button onClick={onClose} style={{fontSize:11,padding:"4px 8px",borderRadius:16,border:"1px solid #ddd",background:"#fff",color:"#888",cursor:"pointer"}}>닫기</button>
        </div>
      </div>
      <div style={{padding:"10px 12px",maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
        {dt.length===0?<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"1.5rem 0"}}>이 날 교육이 없어요</div>:dt.map(item=>{
          const tc=ET.find(t=>t.key===item.target);
          const color=tc?.color||"#888";
          return(
            <div key={item.id} onClick={()=>onItem(item)} style={{padding:"8px 12px",borderRadius:8,cursor:"pointer",background:rgba(color,0.10),border:`1px solid ${color}`,borderLeft:`4px solid ${color}`}}>
              <div style={{fontSize:12,fontWeight:600,color}}>{lbl(item)}</div>
              <div style={{fontSize:11,color:"#666",marginTop:4}}>{item.startDate}{item.endDate!==item.startDate?` ~ ${item.endDate}`:""} {item.startTime}~{item.endTime}{item.type==="visit"&&item.place?` · ${item.place}`:""}</div>
              {item.lectures[0]?.subject&&<div style={{marginTop:4,display:"flex",flexDirection:"column",gap:2}}>{item.lectures.map((l,i)=><span key={l.id} style={{fontSize:11,color:"#666"}}>{i+1}. {l.subject}{l.instructor?` (${l.instructor})`:""}</span>)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalGrid({types,tasks,cur,setCur,onTask,selectedDate,setSelectedDate}) {
  const y=cur.getFullYear(),m=cur.getMonth();
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const now=new Date(),weeks=[];
  let day=1-fd;
  while(day<=dim){const wk=[];for(let i=0;i<7;i++,day++)wk.push(day>0&&day<=dim?new Date(y,m,day):null);weeks.push(wk);}
  const BD="1px solid #e0e0e0";
  return(
    <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>setCur(new Date(y,m-1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>‹</button>
        <strong>{y}년 {m+1}월</strong>
        <button onClick={()=>setCur(new Date(y,m+1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>›</button>
      </div>
      {/* 수정 1번: 캘린더 영역 전체가 꽉 차도록 flex: 1 적용 */}
      <div style={{border:BD,borderRadius:8,overflow:"hidden",display: "flex", flexDirection: "column", flex: 1}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",borderBottom:BD}}>
          {WDAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,padding:"6px 0",color:i===0?"#E24B4A":i===6?"#378ADD":"#666",borderRight:i<6?BD:"none",background:"#fafafa"}}>{d}</div>)}
        </div>
        {weeks.map((wk,wi)=>(
          // 각 주(week) Row가 동일한 비율로 늘어나도록 flex: 1 할당
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))", flex: 1, minHeight: 60}}>
            {wk.map((date,di)=>{
              if(!date)return<div key={`e${wi}${di}`} style={{borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",background:"#f7f7f7"}}/>;
              const dt=tasks.filter(t=>inR(date,t.startDate,t.endDate));
              const isT=sameD(date,now);
              const isSel=selectedDate&&sameD(date,selectedDate);
              return(
                <div key={`${wi}${di}`} onClick={()=>setSelectedDate(isSel?null:date)}
                  style={{padding:"2px",borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",cursor:"pointer",background:isSel?"#dbeafe":isT?"#EBF4FD":"#fff",boxSizing:"border-box",outline:isSel?"2px solid #378ADD":"none",outlineOffset:-1}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:1}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:isT?"#378ADD":"transparent",fontSize:10,fontWeight:isT?600:400,color:isT?"#fff":di===0?"#E24B4A":di===6?"#378ADD":"#1a1a1a"}}>{date.getDate()}</span>
                  </div>
                  {dt.slice(0,3).map(t=>{const si=sInfo(t.status);const ti=tInfo(types,t.type);const sk=t.status==="done"||t.status==="cancel";return<div key={t.id} onClick={e=>{e.stopPropagation();onTask(t);}} style={{fontSize:9,padding:"0px 3px 0px 4px",marginBottom:1,borderRadius:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",cursor:"pointer",background:rgba(ti.color,0.15),color:"#444",border:`1px solid ${si.border}`,borderLeft:`3px solid ${si.border}`,textDecoration:sk?"line-through":"none",opacity:sk?0.6:1,textAlign:"left",lineHeight:"14px"}}>{t.title}</div>;})}
                  {dt.length>3&&<div style={{fontSize:8,color:"#aaa",paddingLeft:2}}>+{dt.length-3}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{types.map(t=><div key={t.key} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/><span style={{fontSize:10,color:"#666"}}>{t.label}</span></div>)}</div>
        <div style={{display:"flex",gap:8,marginLeft:"auto",flexWrap:"wrap"}}>{SL.map(st=><div key={st.key} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:9,height:9,borderRadius:2,border:`2px solid ${st.border}`,borderLeft:`3px solid ${st.border}`,background:"transparent"}}/><span style={{fontSize:10,color:"#666"}}>{st.label}</span></div>)}</div>
      </div>
    </div>
  );
}

function EduGrid({eduItems, onAdd, onItem, selectedDate, setSelectedDate}) {
  const [cur,setCur]=useState(new Date());
  const y=cur.getFullYear(),m=cur.getMonth();
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const now=new Date(),weeks=[];
  let day=1-fd;
  while(day<=dim){const wk=[];for(let i=0;i<7;i++,day++)wk.push(day>0&&day<=dim?new Date(y,m,day):null);weeks.push(wk);}
  const lbl=item=>{const t=ET.find(x=>x.key===item.target);const loc=item.type==="visit"&&item.region?`(${item.region})`:"";return`${t?t.short:"?"} ${item.nth}차 ${EF.find(x=>x.key===item.type)?.label||""}${loc}`;};
  const mi=[...eduItems].filter(e=>{const sv=pld(e.startDate);return sv&&sv.getFullYear()===y&&sv.getMonth()===m;}).sort((a,b)=>a.startDate>b.startDate?1:-1);
  const BD="1px solid #e0e0e0";
  
  const calGrid=(
    <div style={{minWidth:0, flex:1, display: "flex", flexDirection: "column", height: "100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>setCur(new Date(y,m-1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>‹</button>
        <strong>{y}년 {m+1}월</strong>
        <button onClick={()=>setCur(new Date(y,m+1,1))} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 12px",fontSize:15,cursor:"pointer"}}>›</button>
      </div>
      {/* 수정 1번: 교육 캘린더 화면 꽉 차게 변경 */}
      <div style={{border:BD,borderRadius:8,overflow:"hidden", display: "flex", flexDirection: "column", flex: 1}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",borderBottom:BD}}>
          {WDAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,padding:"6px 0",color:i===0?"#E24B4A":i===6?"#378ADD":"#666",borderRight:i<6?BD:"none",background:"#fafafa"}}>{d}</div>)}
        </div>
        {weeks.map((wk,wi)=>(
          <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))", flex: 1, minHeight: 60}}>
            {wk.map((date,di)=>{
              if(!date)return<div key={`e${wi}${di}`} style={{borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",background:"#f7f7f7"}}/>;
              const items=eduItems.filter(e=>inR(date,e.startDate,e.endDate));
              const isT=sameD(date,now);
              const isSel=selectedDate&&sameD(date,selectedDate); // 선택 상태 확인
              return(
                <div key={`${wi}${di}`} onClick={()=>setSelectedDate(isSel ? null : date)} 
                  style={{padding:"2px",borderRight:di<6?BD:"none",borderBottom:wi<weeks.length-1?BD:"none",cursor:"pointer",background:isSel?"#d1fae5":isT?"#EBF4FD":"#fff",boxSizing:"border-box",outline:isSel?"2px solid #1D9E75":"none",outlineOffset:-1}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:1}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:isT?"#378ADD":"transparent",fontSize:10,fontWeight:isT?600:400,color:isT?"#fff":di===0?"#E24B4A":di===6?"#378ADD":"#1a1a1a"}}>{date.getDate()}</span>
                  </div>
                  {items.slice(0,3).map(item=>{const tc=ET.find(t=>t.key===item.target);const color=tc?.color||"#888";return<div key={item.id} onClick={e=>{e.stopPropagation();onItem(item);}} style={{fontSize:9,padding:"0px 3px 0px 4px",marginBottom:1,borderRadius:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",cursor:"pointer",background:rgba(color,0.15),color,border:`1px solid ${color}`,borderLeft:`3px solid ${color}`,lineHeight:"14px"}}>{lbl(item)}</div>;})}
                  {items.length>3&&<div style={{fontSize:8,color:"#aaa",paddingLeft:2}}>+{items.length-3}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>{ET.map(t=><div key={t.key} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/><span style={{fontSize:10,color:"#666"}}>{t.short} = {t.label}</span></div>)}</div>
    </div>
  );
  
  const sidebar=(
    <div style={{width:250,flexShrink:0,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",padding:"12px",height:"calc(100vh - 140px)",overflowY:"auto",position:"sticky",top:16}}>
      <strong style={{fontSize:13,display:"block",marginBottom:8}}>{m+1}월 교육 일정</strong>
      {mi.length===0&&<div style={{color:"#bbb",fontSize:12,textAlign:"center",padding:"1.5rem 0"}}>이 달 교육 없음</div>}
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {mi.map(item=>{const tc=ET.find(t=>t.key===item.target);const color=tc?.color||"#888";return(<div key={item.id} onClick={()=>onItem(item)} style={{padding:"6px 8px",borderRadius:7,cursor:"pointer",background:rgba(color,0.10),border:`1px solid ${color}`,borderLeft:`3px solid ${color}`}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,fontWeight:600,color}}>{lbl(item)}</span></div><div style={{fontSize:9,color:"#666",marginTop:2}}>{item.startDate}{item.endDate!==item.startDate?` ~ ${item.endDate}`:""} {item.startTime}~{item.endTime}{item.type==="visit"&&item.place?` · ${item.place}`:""}</div></div>);})}
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",gap:16,alignItems:"start",width:"100%", height: "calc(100vh - 140px)"}}>
      <div style={{minWidth:0, flex:1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden"}}>
        {calGrid}
        {/* 수정 4번: 교육 캘린더 날짜 클릭 시 하단에 패널 노출 */}
        {selectedDate && <EduDayPanel date={selectedDate} items={eduItems} onItem={onItem} onAdd={()=>onAdd(selectedDate)} onClose={()=>setSelectedDate(null)}/>}
      </div>
      {sidebar}
    </div>
  );
}

function FocusView({types,tasks,onTask}) {
  const now=new Date(),past=new Date(now),future=new Date(now);
  past.setDate(past.getDate()-7);future.setDate(future.getDate()+14);
  const list=tasks.filter(t=>{const sv=pld(t.startDate||t.endDate),ev=pld(t.endDate||t.startDate);return sv&&sv<=future&&(ev||sv)>=past;}).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>1주 전 ~ 2주 후 ({list.length}건)</div>
      {list.length===0&&<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"2rem"}}>해당 기간 태스크 없음</div>}
      {list.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={false} isSel={false} onSel={()=>{}}/>)}
    </div>
  );
}

function TaskList({types,tasks,onTask,onAdd,onBulk}) {
  const [filter,setFilter]=useState("all");
  const [tf,setTf]=useState("all");
  const [sel,setSel]=useState([]);
  const [selMode,setSelMode]=useState(false);
  const [panel,setPanel]=useState(false);
  const [bType,setBType]=useState("");
  const [bStat,setBStat]=useState("");
  const [bPri,setBPri]=useState("");
  const list=tasks.filter(t=>filter==="all"||(filter==="active"?t.status==="before"||t.status==="doing":filter===t.status)).filter(t=>tf==="all"||t.type===tf).sort((a,b)=>{const ea=a.endDate||a.startDate||"9999",eb=b.endDate||b.startDate||"9999";return ea>eb?1:ea<eb?-1:0;});
  const exit=()=>{setSelMode(false);setSel([]);setPanel(false);setBType("");setBStat("");setBPri("");};
  const apply=()=>{const ch={};if(bType)ch.type=bType;if(bStat)ch.status=bStat;if(bPri!=="")ch.priority=parseInt(bPri);if(!Object.keys(ch).length)return;onBulk(sel,ch);exit();};
  const fBtn=(v,l)=><button key={v} onClick={()=>setFilter(v)} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1px solid ${filter===v?"#1a1a1a":"#ddd"}`,background:filter===v?"#1a1a1a":"#fff",color:filter===v?"#fff":"#666",cursor:"pointer"}}>{l}</button>;
  return(
    <div>
      <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
        {fBtn("all","전체")}{fBtn("active","진행")}{fBtn("done","완료")}{fBtn("cancel","취소")}
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <button onClick={()=>{if(selMode)exit();else setSelMode(true);}} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1px solid ${selMode?"#378ADD":"#ddd"}`,background:selMode?"#EBF4FD":"#fff",color:selMode?"#378ADD":"#666",cursor:"pointer"}}>{selMode?"취소":"일괄편집"}</button>
          {!selMode&&<button onClick={onAdd} style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"1px solid #ddd",background:"#fff",color:"#666",cursor:"pointer"}}>+ 추가</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
        <button onClick={()=>setTf("all")} style={{fontSize:11,padding:"2px 8px",borderRadius:10,border:`1.5px solid ${tf==="all"?"#1a1a1a":"#ddd"}`,background:"transparent",color:tf==="all"?"#1a1a1a":"#888",cursor:"pointer"}}>전체</button>
        {types.map(t=><button key={t.key} onClick={()=>setTf(t.key)} style={{fontSize:11,padding:"2px 8px",borderRadius:10,border:`1.5px solid ${tf===t.key?t.color:"#ddd"}`,background:tf===t.key?rgba(t.color,0.15):"transparent",color:tf===t.key?t.color:"#888",cursor:"pointer"}}>{t.label}</button>)}
      </div>
      {selMode&&<div style={{marginBottom:8,padding:"8px 12px",borderRadius:10,background:"#f9f9f9",border:"1px solid #e0e0e0"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:panel?8:0}}><button onClick={()=>setSel(s=>s.length===list.length?[]:list.map(t=>t.id))} style={{fontSize:11,padding:"3px 10px",borderRadius:10,border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}>{sel.length===list.length?"전체 해제":"전체 선택"}</button><span style={{fontSize:12,color:"#888"}}>{sel.length}개 선택</span>{sel.length>0&&<button onClick={()=>setPanel(p=>!p)} style={{marginLeft:"auto",fontSize:11,padding:"4px 12px",borderRadius:10,border:"none",background:"#378ADD",color:"#fff",cursor:"pointer",fontWeight:600}}>일괄 변경 {panel?"▲":"▼"}</button>}</div>{panel&&sel.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,paddingTop:8,borderTop:"1px solid #e8e8e8"}}><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>업무 유형</div><select value={bType} onChange={e=>setBType(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{types.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>진행 상태</div><select value={bStat} onChange={e=>setBStat(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{SL.map(st=><option key={st.key} value={st.key}>{st.label}</option>)}</select></div><div><div style={{fontSize:11,color:"#666",marginBottom:2}}>우선순위</div><select value={bPri} onChange={e=>setBPri(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"1px solid #ccc",borderRadius:8,fontSize:12}}><option value="">변경 안 함</option>{PL.map((l,i)=><option key={i} value={i}>{l}</option>)}</select></div><button onClick={apply} style={{padding:"7px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>선택한 {sel.length}개 적용</button></div>}</div>}
      {list.length===0&&<div style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"2rem"}}>태스크가 없어요</div>}
      {list.map(t=><TaskBlock key={t.id} t={t} types={types} onClick={onTask} selMode={selMode} isSel={sel.includes(t.id)} onSel={id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}/>)}
    </div>
  );
}

function TypeSettings({types,onSave,onClose}) { /* 생략 없이 기존 코드 동일 (생략 처리됨) */
  const [list,setList]=useState(()=>types.map(t=>({...t})));
  const [oc,setOc]=useState(null);
  const [el,setEl]=useState({});
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <strong style={{fontSize:15}}>업무 유형 관리</strong>
        <button onClick={onClose} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {list.map(t=>(
          <div key={t.key} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:10,border:"1px solid #eee",background:"#fafafa"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div onClick={()=>setOc(c=>c===t.key?null:t.key)} style={{width:22,height:22,borderRadius:"50%",background:t.color,cursor:"pointer",border:"2px solid rgba(0,0,0,0.1)"}}/>
              {oc===t.key&&<div style={{position:"absolute",top:28,left:0,zIndex:10,background:"#fff",border:"1px solid #ddd",borderRadius:10,padding:8,display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",width:180}}>{PCOLS.map(c=><div key={c} onClick={()=>{setList(l=>l.map(x=>x.key===t.key?{...x,color:c}:x));setOc(null);}} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:t.color===c?"2.5px solid #000":"2px solid transparent"}}/>)}<input type="color" value={t.color} onChange={e=>setList(l=>l.map(x=>x.key===t.key?{...x,color:e.target.value}:x))} style={{gridColumn:"span 6",height:22,border:"none",padding:0,cursor:"pointer",width:"100%",marginTop:4}}/></div>}
            </div>
            {el[t.key]?<input autoFocus value={t.label} onChange={e=>setList(l=>l.map(x=>x.key===t.key?{...x,label:e.target.value}:x))} onBlur={()=>setEl(p=>({...p,[t.key]:false}))} style={{flex:1,fontSize:13,padding:"2px 6px",border:"1px solid #ccc",borderRadius:6}}/>:<span style={{flex:1,fontSize:13,cursor:"text"}} onClick={()=>setEl(p=>({...p,[t.key]:true}))}>{t.label}</span>}
            <span style={{fontSize:10,color:"#bbb"}}>(클릭 수정)</span>
            <button onClick={()=>setList(l=>l.filter(x=>x.key!==t.key))} style={{border:"none",background:"none",cursor:"pointer",color:"#c00",fontSize:14}}>×</button>
          </div>
        ))}
      </div>
      <button onClick={()=>setList(l=>[...l,{key:gid(),label:"새 유형",color:PCOLS[l.length%PCOLS.length]}])} style={{width:"100%",padding:8,borderRadius:8,border:"1px dashed #ccc",background:"transparent",cursor:"pointer",color:"#888",marginBottom:10}}>+ 유형 추가</button>
      <button onClick={()=>onSave(list)} style={{width:"100%",padding:8,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>저장</button>
    </div>
  );
}

function App() {
  const [tasks,setTasks] = useState([]);
  const [eduItems,setEduItems] = useState([]);
  const [types,setTypes] = useState(TYPES0);
  const [loading,setLoading] = useState(true);
  const [calDate,setCalDate] = useState(new Date());
  const [selectedDate,setSelectedDate] = useState(null);
  const [eduSelectedDate, setEduSelectedDate] = useState(null); // 수정 4번: 교육 캘린더용 선택 날짜
  const [modal,setModal] = useState(null);
  const [mainTab,setMainTab] = useState("planner");
  const [subTab,setSubTab] = useState("focus");
  const [mobile,setMobile] = useState(window.innerWidth<768);
  const [toast,setToast] = useState(null);
  const tRef = useRef(null);

  useEffect(()=>{const fn=()=>setMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const showT = (msg) => {setToast(msg);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      try {
        const {data:td} = await supabase.from("tasks").select("*").order("start_date");
        if(td&&td.length>0) setTasks(td.map(taskFromDb));
        else { await supabase.from("tasks").insert(INIT_TASKS.map(taskToDb)); setTasks(INIT_TASKS); }
        
        const {data:ed} = await supabase.from("edu_items").select("*").order("start_date");
        if(ed&&ed.length>0) setEduItems(ed.map(eduFromDb));
        else { await supabase.from("edu_items").insert(INIT_EDU.map(eduToDb)); setEduItems(INIT_EDU); }
        
        const {data:tyd} = await supabase.from("app_types").select("*").order("sort_order");
        if(tyd&&tyd.length>0) setTypes(tyd.map(typeFromDb));
        else { await supabase.from("app_types").insert(TYPES0.map(typeToDb)); setTypes(TYPES0); }
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  },[]);

  // 실시간 구독 (생략 없이 유지)
  useEffect(()=>{
    const ch1 = supabase.channel("tasks-changes").on("postgres_changes",{event:"*",schema:"public",table:"tasks"},()=>{supabase.from("tasks").select("*").order("start_date").then(({data})=>{if(data)setTasks(data.map(taskFromDb));});}).subscribe();
    const ch2 = supabase.channel("edu-changes").on("postgres_changes",{event:"*",schema:"public",table:"edu_items"},()=>{supabase.from("edu_items").select("*").order("start_date").then(({data})=>{if(data)setEduItems(data.map(eduFromDb));});}).subscribe();
    const ch3 = supabase.channel("types-changes").on("postgres_changes",{event:"*",schema:"public",table:"app_types"},()=>{supabase.from("app_types").select("*").order("sort_order").then(({data})=>{if(data)setTypes(data.map(typeFromDb));});}).subscribe();
    return()=>{supabase.removeChannel(ch1);supabase.removeChannel(ch2);supabase.removeChannel(ch3);};
  },[]);

  const saveTask = async (form) => { const id = modal?.task?.id || form.id || gid(); const task = {...form, id}; const row = taskToDb(task); if(modal?.type==="edit") { setTasks(prev => prev.map(t => t.id === id ? task : t)); await supabase.from("tasks").update(row).eq("id", id); } else { setTasks(prev => [...prev, task]); await supabase.from("tasks").insert(row); } showT("저장됨"); setModal(null); };
  const delTask = async (id) => { setTasks(prev => prev.filter(t => t.id !== id)); await supabase.from("tasks").delete().eq("id", id); showT("삭제됨"); setModal(null); };
  const saveTypes = async (list) => { setTypes(list); await supabase.from("app_types").delete().neq("id","__none__"); await supabase.from("app_types").insert(list.map(typeToDb)); showT("유형 저장됨"); setModal(null); };
  const bulkUpd = async (ids, ch) => { setTasks(prev => prev.map(t => ids.includes(t.id) ? {...t, ...ch} : t)); for(const id of ids) await supabase.from("tasks").update(ch).eq("id", id); showT(`${ids.length}개 수정됨`); };

  const reorder = (items) => {const r=[...items];["worker","future","trainer"].forEach(tgt=>{const ix=r.map((e,i)=>e.target===tgt?i:-1).filter(i=>i>=0);ix.slice().sort((a,b)=>r[a].startDate>r[b].startDate?1:-1).forEach((oi,rank)=>{r[oi]={...r[oi],nth:rank+1};});});return r;};
  const saveEdu = async (form) => { const reordered = reorder(modal?.type==="edu-edit" ? eduItems.map(e=>e.id===modal.item.id?{...e,...form}:e) : [...eduItems,{id:gid(),...form}]); setEduItems(reordered); if(modal?.type==="edu-edit") { const row = eduToDb(reordered.find(e=>e.id===modal.item.id)); await supabase.from("edu_items").update(row).eq("id",row.id); for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id); } else { const newItem = reordered.find(e=>!eduItems.find(x=>x.id===e.id)); if(newItem) await supabase.from("edu_items").insert(eduToDb(newItem)); for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id); } showT("교육일정 저장됨"); setModal(null); };
  const delEdu = async (id) => { const reordered = reorder(eduItems.filter(e=>e.id!==id)); setEduItems(reordered); await supabase.from("edu_items").delete().eq("id",id); for(const e of reordered) await supabase.from("edu_items").update({nth:e.nth}).eq("id",e.id); showT("교육일정 삭제됨"); setModal(null); };

  const openNew = (date) => setModal({type:"new",initial:{title:"",type:types[0]?.key||"work",startDate:date?fmtD(date):tod(),endDate:date?fmtD(date):tod(),dueTime:"",priority:1,status:"before",note:""}});
  const openEduNew = (date) => setModal({type:"edu-new",date:date?fmtD(date):tod()}); // 추가: 교육 일정 추가
  const openEdit = (task) => setModal({type:"edit",task});

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12,background:"#f0f0f0"}}><div style={{fontSize:24}}>📋</div><div style={{fontSize:14,color:"#888"}}>데이터 불러오는 중...</div></div>
  );

  const pcPlanner = (
    <div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:16,alignItems:"start",width:"100%",maxWidth:"100%",boxSizing:"border-box", height: "calc(100vh - 140px)"}}>
      <div style={{minWidth:0,width:"100%",overflow:"hidden", height: "100%", display: "flex", flexDirection: "column"}}>
        <CalGrid types={types} tasks={tasks} cur={calDate} setCur={setCalDate} onTask={openEdit} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
        {selectedDate&&<DayPanel date={selectedDate} tasks={tasks} types={types} onTask={openEdit} onAdd={()=>openNew(selectedDate)} onClose={()=>setSelectedDate(null)}/>}
      </div>
      <div style={{width:250,flexShrink:0,background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",padding:"12px",height:"100%",display:"flex",flexDirection:"column",gap:8,position:"sticky",top:16}}>
        <div style={{display:"flex",gap:4}}>
          {[["focus","포커스"],["list","목록"]].map(([v,l])=><button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:6,borderRadius:8,border:"1px solid #ddd",background:subTab===v?"#1a1a1a":"#fff",color:subTab===v?"#fff":"#666",cursor:"pointer",fontSize:12}}>{l}</button>)}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {subTab==="focus"?<FocusView types={types} tasks={tasks} onTask={openEdit}/>:<TaskList types={types} tasks={tasks} onTask={openEdit} onAdd={()=>openNew()} onBulk={bulkUpd}/>}
        </div>
      </div>
    </div>
  );

  const mobilePlanner = (
    <>
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        {[["calendar","캘린더"],["focus","포커스"],["list","목록"]].map(([v,l])=><button key={v} onClick={()=>setSubTab(v)} style={{flex:1,padding:7,borderRadius:8,border:"1px solid #ddd",background:subTab===v?"#1a1a1a":"#fff",color:subTab===v?"#fff":"#666",cursor:"pointer",fontSize:12}}>{l}</button>)}
      </div>
      {subTab==="calendar"&&<div><CalGrid types={types} tasks={tasks} cur={calDate} setCur={setCalDate} onTask={openEdit} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>{selectedDate&&<DayPanel date={selectedDate} tasks={tasks} types={types} onTask={openEdit} onAdd={()=>openNew(selectedDate)} onClose={()=>setSelectedDate(null)}/>}</div>}
      {subTab==="focus"&&<FocusView types={types} tasks={tasks} onTask={openEdit}/>}
      {subTab==="list"&&<TaskList types={types} tasks={tasks} onTask={openEdit} onAdd={()=>openNew()} onBulk={bulkUpd}/>}
    </>
  );

  return(
    <div style={{padding:mobile?"0.75rem":"1.5rem",height:"100vh",background:"#f0f0f0",boxSizing:"border-box", overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <h2 style={{margin:0,fontSize:17}}>My Planner</h2>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#e0f7e9",color:"#1D9E75",border:"1px solid #b2dfdb"}}>● 실시간 연동</span>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {mainTab==="planner"&&<button onClick={()=>setModal({type:"settings"})} style={{fontSize:12,padding:"6px 12px",borderRadius:20,border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}>⚙ 유형 관리</button>}
          {mainTab==="planner"&&<button onClick={()=>openNew(selectedDate||undefined)} style={{fontSize:12,padding:"6px 14px",borderRadius:20,border:"none",background:"#1a1a1a",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 새 태스크</button>}
          {mainTab==="edu"&&<button onClick={()=>openEduNew(eduSelectedDate||undefined)} style={{fontSize:12,padding:"6px 14px",borderRadius:20,border:"none",background:"#1D9E75",color:"#fff",cursor:"pointer",fontWeight:600}}>+ 교육일정</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[["planner","📋 플래너"],["edu","🎓 교육일정"]].map(([v,l])=><button key={v} onClick={()=>setMainTab(v)} style={{padding:"8px 18px",borderRadius:10,border:`1.5px solid ${mainTab===v?"#1a1a1a":"#ddd"}`,background:mainTab===v?"#1a1a1a":"transparent",color:mainTab===v?"#fff":"#888",cursor:"pointer",fontWeight:mainTab===v?600:400,fontSize:13}}>{l}</button>)}
      </div>
      {mainTab==="planner"&&(mobile?mobilePlanner:pcPlanner)}
      {mainTab==="edu"&&<EduGrid eduItems={eduItems} selectedDate={eduSelectedDate} setSelectedDate={setEduSelectedDate} onAdd={openEduNew} onItem={item=>setModal({type:"edu-edit",item})}/>}
      
      {modal?.type==="settings"&&<Overlay onClose={()=>setModal(null)}><TypeSettings types={types} onSave={saveTypes} onClose={()=>setModal(null)}/></Overlay>}
      {(modal?.type==="new"||modal?.type==="edit")&&<Overlay onClose={()=>setModal(null)}><TaskForm types={types} initial={modal.type==="edit"?modal.task:modal.initial} onSave={saveTask} onClose={()=>setModal(null)} onDelete={modal.type==="edit"?()=>delTask(modal.task.id):null}/></Overlay>}
      {(modal?.type==="edu-new"||modal?.type==="edu-edit")&&<Overlay onClose={()=>setModal(null)}><EduForm eduItems={eduItems} initial={modal.type==="edu-edit"?modal.item:{target:"worker",type:"center",nth:1,startDate:modal.date||tod(),endDate:modal.date||tod(),startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"",instructor:""}],note:""}} onSave={saveEdu} onClose={()=>setModal(null)} onDelete={modal.type==="edu-edit"?()=>delEdu(modal.item.id):null}/></Overlay>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(20,20,20,0.9)",color:"#fff",padding:"8px 20px",borderRadius:24,fontSize:13,zIndex:2000,pointerEvents:"none",whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );
}

export default App;