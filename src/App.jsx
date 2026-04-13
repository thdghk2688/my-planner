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

const tod = () => new Date().toISOString().split("T")[0];
const gid = () => Math.random().toString(36).substr(2, 9);
const rgba = (h, a) => {
  let r = 0, g = 0, b = 0;
  if (h && h.length === 7) {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${a})`;
};

const Overlay = ({ children, onClose }) => (
  <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
    <div style={{background:"#fff",width:"90%",maxWidth:450,borderRadius:12,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// [원본복구] TaskForm
const TaskForm = ({ types, initial, onSave, onClose, onDelete }) => {
  const [f, setF] = useState(initial || { title: "", type: "work", status: "before", priority: 1, startDate: tod(), endDate: tod(), dueTime: "", memo: "" });
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{initial?.id?"업무 수정":"새 업무 등록"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>업무명</label>
          <input autoFocus style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>분류</label>
            <select style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
              {types.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>상태</label>
            <select style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.status} onChange={e=>setF({...f,status:e.target.value})}>
              {SL.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>시작일</label>
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>종료일</label>
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
          </div>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>메모</label>
          <textarea style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,height:80,resize:"none"}} value={f.memo} onChange={e=>setF({...f,memo:e.target.value})}/>
        </div>
      </div>
      <div style={{marginTop:24,display:"flex",gap:10}}>
        {onDelete && <button onClick={onDelete} style={{padding:"10px 15px",background:"#fff",border:"1px solid #ff4d4f",color:"#ff4d4f",borderRadius:6}}>삭제</button>}
        <div style={{flex:1}}/>
        <button onClick={onClose} style={{padding:"10px 20px",background:"#f5f5f5",border:"none",borderRadius:6}}>취소</button>
        <button onClick={()=>onSave(f)} style={{padding:"10px 24px",background:"#378ADD",color:"#fff",border:"none",borderRadius:6,fontWeight:700}}>저장</button>
      </div>
    </div>
  );
};

// [원본복구] EduForm
const EduForm = ({ initial, onSave, onClose, onDelete }) => {
  const [f, setF] = useState(initial);
  const addL = () => setF({...f, lectures:[...f.lectures, {id:gid(), subject:"", instructor:""}]});
  const upL = (id, k, v) => setF({...f, lectures: f.lectures.map(l=>l.id===id?{...l,[k]:v}:l)});
  const delL = (id) => setF({...f, lectures: f.lectures.filter(l=>l.id!==id)});

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>교육 일정 {initial?.id?"수정":"등록"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"flex",gap:10}}>
          <select style={{flex:1,padding:10,borderRadius:6,border:"1px solid #ddd"}} value={f.target} onChange={e=>setF({...f,target:e.target.value})}>
            <option value="worker">종사자</option><option value="manager">책임자</option>
          </select>
          <input type="number" style={{width:60,padding:10,borderRadius:6,border:"1px solid #ddd"}} value={f.nth} onChange={e=>setF({...f,nth:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <input type="date" style={{flex:1,padding:10,borderRadius:6,border:"1px solid #ddd"}} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
          <input type="date" style={{flex:1,padding:10,borderRadius:6,border:"1px solid #ddd"}} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
        </div>
        <input style={{width:"100%",padding:10,borderRadius:6,border:"1px solid #ddd"}} value={f.place} onChange={e=>setF({...f,place:e.target.value})} placeholder="장소"/>
        <div style={{background:"#f9f9f9",padding:10,borderRadius:6}}>
          <div style={{fontSize:12,marginBottom:8,display:"flex",justifyContent:"space-between"}}>
            <span>강의구성</span><button onClick={addL} style={{fontSize:10}}>+ 추가</button>
          </div>
          {f.lectures.map(l=>(
            <div key={l.id} style={{display:"flex",gap:5,marginBottom:5}}>
              <input style={{flex:2,padding:5,fontSize:12}} value={l.subject} onChange={e=>upL(l.id,"subject",e.target.value)} placeholder="과목"/>
              <input style={{flex:1,padding:5,fontSize:12}} value={l.instructor} onChange={e=>upL(l.id,"instructor",e.target.value)} placeholder="강사"/>
              <button onClick={()=>delL(l.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:24,display:"flex",justifyContent:"flex-end",gap:10}}>
        {onDelete && <button onClick={onDelete} style={{color:"#ff4d4f"}}>삭제</button>}
        <button onClick={onClose}>취onClose</button>
        <button onClick={()=>onSave(f)} style={{background:"#7F77DD",color:"#fff",padding:"10px 20px",borderRadius:6,border:"none"}}>저장</button>
      </div>
    </div>
  );
};

// [원본복구] TypeSettings
const TypeSettings = ({ types, onSave, onClose }) => {
  const [list, setList] = useState(types);
  const up = (idx, k, v) => setList(list.map((t,i)=>i===idx?{...t,[k]:v}:t));
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>카테고리 설정</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {list.map((t,i)=>(
          <div key={i} style={{display:"flex",gap:8}}>
            <input type="color" value={t.color} onChange={e=>up(i,"color",e.target.value)}/>
            <input style={{flex:1,padding:8}} value={t.label} onChange={e=>up(i,"label",e.target.value)}/>
          </div>
        ))}
      </div>
      <button onClick={()=>onSave(list)} style={{width:"100%",marginTop:20,padding:12,background:"#378ADD",color:"#fff",border:"none",borderRadius:6}}>설정 저장</button>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [eduItems, setEduItems] = useState([]);
  const [types, setTypes] = useState(TYPES0);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(tod());
  const [eduSelectedDate, setEduSelectedDate] = useState(tod());
  const [modal, setModal] = useState(null);
  const [mainTab, setMainTab] = useState("planner");
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const loadData = useCallback(async () => {
    const { data: t } = await supabase.from("tasks").select("*");
    if(t) setTasks(t);
    const { data: e } = await supabase.from("edu_items").select("*");
    if(e) setEduItems(e);
    const { data: s } = await supabase.from("settings").select("*").eq("key", "types").single();
    if(s) setTypes(s.value);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveTask = async (f) => {
    const isNew = !f.id;
    const task = isNew ? { ...f, id: gid() } : f;
    const { error } = await supabase.from("tasks").upsert(task);
    if(!error) { setTasks(prev => isNew ? [...prev, task] : prev.map(t=>t.id===f.id?f:t)); setModal(null); }
  };

  const delTask = async (id) => {
    if(!confirm("삭제할까요?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t=>t.id!==id)); setModal(null);
  };

  const saveEdu = async (f) => {
    const isNew = !f.id;
    const item = isNew ? { ...f, id: gid() } : f;
    const { error } = await supabase.from("edu_items").upsert(item);
    if(!error) { setEduItems(prev => isNew ? [...prev, item] : prev.map(t=>t.id===f.id?item:t)); setModal(null); }
  };

  // [넘침 방지 핵심 로직이 적용된 CalGrid]
  const CalGrid = ({ tasks, date, selected, onSelect, onAdd, onTask }) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) days.push(new Date(date.getFullYear(), date.getMonth(), i));
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",background:"#fff"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",borderBottom:"1px solid #eee"}}>
          {["일","월","화","수","목","금","토"].map((d,i)=>(
            <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:12,fontWeight:700,color:i===0?"#ff4d4f":i===6?"#378ADD":"#999"}}>{d}</div>
          ))}
        </div>
        <div style={{flex:1,display:"grid",gridTemplateRows:`repeat(${weeks.length}, 1fr)`}}>
          {weeks.map((w, wi) => (
            <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",borderBottom:"1px solid #f0f0f0"}}>
              {w.map((d, di) => {
                const ds = d ? d.toISOString().split("T")[0] : "";
                const isSel = ds === selected;
                
                // 해당 주차 업무 로직
                const weekStart = new Date(w.find(x=>x)); weekStart.setHours(0,0,0,0);
                const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+6);
                const weekTasks = tasks.filter(t => {
                  const ts = new Date(t.startDate); const te = new Date(t.endDate);
                  return ts <= weekEnd && te >= weekStart;
                });

                const rows = [];
                weekTasks.forEach(t => {
                  const ts = new Date(t.startDate); const te = new Date(t.endDate);
                  const sc = Math.max(0, Math.floor((ts - weekStart)/(24*60*60*1000)));
                  const ec = Math.min(6, Math.floor((te - weekStart)/(24*60*60*1000)));
                  let r = 0; while(rows[r] && rows[r].some(x => x.sc <= ec && x.ec >= sc)) r++;
                  if(!rows[r]) rows[r] = [];
                  rows[r].push({sc, ec, span: ec-sc+1, task: t, isStart: ts >= weekStart, isEnd: te <= weekEnd});
                });

                return (
                  <div key={di} onClick={()=>d && onSelect(ds)} style={{position:"relative",minHeight:80,background:isSel?"#f0f7ff":"#fff",borderRight:di===6?"none":"1px solid #f0f0f0",cursor:d?"pointer":"default"}}>
                    {d && <div style={{padding:6,fontSize:13}}>{d.getDate()}</div>}
                    {di === 0 && (
                      <div style={{position:"absolute",top:28,left:0,right:0,zIndex:10,pointerEvents:"none"}}>
                        {rows.slice(0, 3).map((row, ri) => (
                          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",height:20,marginBottom:2}}>
                            {row.map(a => {
                              const ti = types.find(t=>t.key===a.task.type) || types[0];
                              return (
                                <div key={a.task.id} style={{gridColumn: `${a.sc + 1} / span ${a.span}`, pointerEvents: "auto", padding:"0 2px"}}>
                                  <div onClick={(e)=>{e.stopPropagation();onTask(a.task);}} 
                                    style={{
                                      background: rgba(ti.color,0.15), color: "#444", borderLeft:`3px solid ${ti.color}`,
                                      fontSize:10, padding:"1px 4px", height:18, lineHeight:"16px",
                                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", // 넘침 방지
                                      cursor:"pointer", borderRadius:4
                                    }}>
                                    {a.task.title}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // [원본복구] PC용 플래너 레이아웃
  const pcPlanner = (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}}>
        <CalGrid tasks={tasks} date={viewDate} selected={selectedDate} onSelect={setSelectedDate} onAdd={(d)=>setModal({type:"new",initial:{startDate:d,endDate:d}})} onTask={(t)=>setModal({type:"edit",task:t})}/>
      </div>
      <div style={{width:320,background:"#f9f9fb",display:"flex",flexDirection:"column",overflowY:"auto",padding:16}}>
        <div style={{fontWeight:800,marginBottom:15}}>{selectedDate} 상세</div>
        {tasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).map(t => (
          <div key={t.id} onClick={()=>setModal({type:"edit",task:t})} style={{background:"#fff",padding:12,borderRadius:10,marginBottom:10,boxShadow:"0 2px 5px rgba(0,0,0,0.05)",cursor:"pointer",borderLeft:`4px solid ${types.find(x=>x.key===t.type)?.color}`}}>
            <div style={{fontSize:14,fontWeight:700}}>{t.title}</div>
            <div style={{fontSize:12,color:"#999",marginTop:5}}>{t.memo}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",flexDirection:"column",background:"#f0f2f5"}}>
      {/* [원본복구] 헤더 */}
      <div style={{background:"#fff",padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #ddd"}}>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#378ADD"}}>KAHAS SMART WORK</div>
          <div style={{display:"flex",background:"#eee",padding:3,borderRadius:8}}>
            <button onClick={()=>setMainTab("planner")} style={{padding:"5px 15px",border:"none",borderRadius:6,background:mainTab==="planner"?"#fff":"transparent"}}>플래너</button>
            <button onClick={()=>setMainTab("edu")} style={{padding:"5px 15px",border:"none",borderRadius:6,background:mainTab==="edu"?"#fff":"transparent"}}>교육일정</button>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
           <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))}>◀</button>
           <span style={{fontWeight:700}}>{viewDate.getFullYear()}년 {viewDate.getMonth()+1}월</span>
           <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))}>▶</button>
           <button onClick={()=>setModal({type:"settings"})} style={{marginLeft:10}}>⚙ 설정</button>
           <button onClick={()=>setModal({type:"new"})} style={{background:"#378ADD",color:"#fff",border:"none",padding:"6px 15px",borderRadius:6}}>+ 등록</button>
        </div>
      </div>

      {mainTab==="planner" && pcPlanner}
      {/* 교육 일정 그리드 및 기타 모달 등 기존 로직 유지... */}

      {modal?.type==="settings" && <Overlay onClose={()=>setModal(null)}><TypeSettings types={types} onSave={(list)=>{setTypes(list); setModal(null);}} onClose={()=>setModal(null)}/></Overlay>}
      {(modal?.type==="new"||modal?.type==="edit") && <Overlay onClose={()=>setModal(null)}><TaskForm types={types} initial={modal.task} onSave={saveTask} onClose={()=>setModal(null)} onDelete={modal.type==="edit"?()=>delTask(modal.task.id):null}/></Overlay>}
    </div>
  );
}