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
  "#1A3A6B","#0E4D34","#3D3B6A","#6B2E18","#5D3A0B","#6A293F","#07372B","#444440"
];

const tod = () => new Date().toISOString().split("T")[0];
const gid = () => Math.random().toString(36).substr(2, 9);
const rgba = (h, a) => {
  let r = 0, g = 0, b = 0;
  if (h.length === 7) {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${a})`;
};

const Overlay = ({ children, onClose }) => (
  <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
    <div style={{background:"#fff",width:"90%",maxWidth:450,borderRadius:12,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 10px 25px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const TaskForm = ({ types, initial, onSave, onClose, onDelete }) => {
  const [f, setF] = useState(initial || { title: "", type: "work", status: "before", priority: 1, startDate: tod(), endDate: tod(), dueTime: "", memo: "" });
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:"#333"}}>{initial?.id?"업무 수정":"새 업무 등록"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>업무명</label>
          <input autoFocus style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="무엇을 해야 하나요?"/>
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
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>종료일</label>
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>중요도</label>
            <div style={{display:"flex",background:"#f5f5f5",borderRadius:6,padding:2}}>
              {PL.map((l,i)=>(
                <button key={l} onClick={()=>setF({...f,priority:i})} style={{flex:1,padding:"6px 0",fontSize:12,border:"none",borderRadius:4,background:f.priority===i?"#fff":"transparent",boxShadow:f.priority===i?"0 2px 4px rgba(0,0,0,0.1)":"none",cursor:"pointer",color:f.priority===i?PC[i]:"#888",fontWeight:f.priority===i?700:400}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{width:100}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>시간</label>
            <input type="time" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.dueTime} onChange={e=>setF({...f,dueTime:e.target.value})}/>
          </div>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>메모</label>
          <textarea style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,height:80,boxSizing:"border-box",resize:"none"}} value={f.memo} onChange={e=>setF({...f,memo:e.target.value})} placeholder="상세 내용을 적어주세요."/>
        </div>
      </div>
      <div style={{marginTop:24,display:"flex",gap:10}}>
        {onDelete && <button onClick={onDelete} style={{padding:"12px 16px",background:"#fff",border:"1px solid #ff4d4f",color:"#ff4d4f",borderRadius:6,cursor:"pointer"}}>삭제</button>}
        <div style={{flex:1}}/>
        <button onClick={onClose} style={{padding:"12px 20px",background:"#f5f5f5",border:"none",borderRadius:6,cursor:"pointer",color:"#666"}}>취소</button>
        <button onClick={()=>onSave(f)} style={{padding:"12px 24px",background:"#378ADD",border:"none",borderRadius:6,cursor:"pointer",color:"#fff",fontWeight:700}}>저장하기</button>
      </div>
    </div>
  );
};

const EduForm = ({ eduItems, initial, onSave, onClose, onDelete }) => {
  const [f, setF] = useState(initial);
  const addL = () => setF({...f, lectures:[...f.lectures, {id:gid(), subject:"", instructor:""}]});
  const upL = (id, k, v) => setF({...f, lectures: f.lectures.map(l=>l.id===id?{...l,[k]:v}:l)});
  const delL = (id) => setF({...f, lectures: f.lectures.filter(l=>l.id!==id)});

  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:"#333"}}>{initial?.id?"교육 일정 수정":"새 교육 등록"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>교육대상</label>
            <select style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.target} onChange={e=>setF({...f,target:e.target.value})}>
              <option value="worker">종사자</option>
              <option value="manager">책임자</option>
              <option value="expert">전문인력</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>교육구분</label>
            <select style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6}} value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
              <option value="center">교육센터</option>
              <option value="field">현지실사</option>
            </select>
          </div>
          <div style={{width:60}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>기수</label>
            <input type="number" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.nth} onChange={e=>setF({...f,nth:e.target.value})}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>시작일</label>
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>종료일</label>
            <input type="date" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>시작시간</label>
            <input type="time" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.startTime} onChange={e=>setF({...f,startTime:e.target.value})}/>
          </div>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>종료시간</label>
            <input type="time" style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.endTime} onChange={e=>setF({...f,endTime:e.target.value})}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>지역</label>
            <input style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.region} onChange={e=>setF({...f,region:e.target.value})} placeholder="서울, 대전 등"/>
          </div>
          <div style={{flex:2}}>
            <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>상세장소</label>
            <input style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,boxSizing:"border-box"}} value={f.place} onChange={e=>setF({...f,place:e.target.value})} placeholder="본원 체험관, 대강당 등"/>
          </div>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{fontSize:12,color:"#666"}}>강의 구성</label>
            <button onClick={addL} style={{fontSize:11,background:"#378ADD",color:"#fff",border:"none",padding:"2px 8px",borderRadius:4,cursor:"pointer"}}>+ 과목 추가</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {f.lectures.map((l,idx)=>(
              <div key={l.id} style={{display:"flex",gap:6,alignItems:"center",background:"#f9f9f9",padding:8,borderRadius:6}}>
                <input style={{flex:2,fontSize:13,padding:6,border:"1px solid #ddd",borderRadius:4}} value={l.subject} onChange={e=>upL(l.id,"subject",e.target.value)} placeholder="과목명"/>
                <input style={{flex:1,fontSize:13,padding:6,border:"1px solid #ddd",borderRadius:4}} value={l.instructor} onChange={e=>upL(l.id,"instructor",e.target.value)} placeholder="강사명"/>
                {f.lectures.length>1 && <button onClick={()=>delL(l.id)} style={{border:"none",background:"transparent",color:"#999",cursor:"pointer"}}>×</button>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:4}}>특이사항</label>
          <textarea style={{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:6,height:60,boxSizing:"border-box",resize:"none"}} value={f.note} onChange={e=>setF({...f,note:e.target.value})} placeholder="참고사항을 입력하세요."/>
        </div>
      </div>
      <div style={{marginTop:24,display:"flex",gap:10}}>
        {onDelete && <button onClick={onDelete} style={{padding:"12px 16px",background:"#fff",border:"1px solid #ff4d4f",color:"#ff4d4f",borderRadius:6,cursor:"pointer"}}>삭제</button>}
        <div style={{flex:1}}/>
        <button onClick={onClose} style={{padding:"12px 20px",background:"#f5f5f5",border:"none",borderRadius:6,cursor:"pointer",color:"#666"}}>취소</button>
        <button onClick={()=>onSave(f)} style={{padding:"12px 24px",background:"#378ADD",border:"none",borderRadius:6,cursor:"pointer",color:"#fff",fontWeight:700}}>저장하기</button>
      </div>
    </div>
  );
};

const TypeSettings = ({ types, onSave, onClose }) => {
  const [list, setList] = useState(types);
  const up = (idx, k, v) => setList(list.map((t,i)=>i===idx?{...t,[k]:v}:t));
  const add = () => setList([...list, {key:gid(), label:"새 카테고리", color:"#888780"}]);
  const del = (idx) => setList(list.filter((_,i)=>i!==idx));
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>업무 카테고리 설정</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:300,overflowY:"auto",paddingRight:4}}>
        {list.map((t,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="color" value={t.color} onChange={e=>up(i,"color",e.target.value)} style={{width:30,height:30,border:"none",padding:0,background:"none",cursor:"pointer"}}/>
            <input style={{flex:1,padding:"8px",border:"1px solid #ddd",borderRadius:6}} value={t.label} onChange={e=>up(i,"label",e.target.value)}/>
            <button onClick={()=>del(i)} style={{background:"none",border:"none",color:"#ff4d4f",cursor:"pointer",padding:8}}>삭제</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{width:"100%",padding:"10px",marginTop:16,background:"#f5f5f5",border:"1px dashed #ccc",borderRadius:6,cursor:"pointer"}}>+ 카테고리 추가</button>
      <div style={{marginTop:24,display:"flex",justifyContent:"flex-end",gap:10}}>
        <button onClick={onClose} style={{padding:"10px 20px",background:"none",border:"none",color:"#666"}}>닫기</button>
        <button onClick={()=>onSave(list)} style={{padding:"10px 24px",background:"#378ADD",color:"#fff",border:"none",borderRadius:6,fontWeight:700}}>설정 저장</button>
      </div>
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
  const [mainTab, setMainTab] = useState("planner"); // "planner" or "edu"
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""), 2000); };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: t } = await supabase.from("tasks").select("*");
    if(t) setTasks(t);
    const { data: e } = await supabase.from("edu_items").select("*");
    if(e) setEduItems(e);
    const { data: s } = await supabase.from("settings").select("*").eq("key", "types").single();
    if(s) setTypes(s.value);
  };

  const saveTask = async (f) => {
    const isNew = !f.id;
    const task = isNew ? { ...f, id: gid(), user_id: (await supabase.auth.getUser()).data.user?.id } : f;
    const { error } = await supabase.from("tasks").upsert(task);
    if(!error) {
      setTasks(prev => isNew ? [...prev, task] : prev.map(t=>t.id===f.id?f:t));
      setModal(null);
      showToast(isNew ? "새 업무가 등록되었습니다." : "업무가 수정되었습니다.");
    }
  };

  const delTask = async (id) => {
    if(!confirm("삭제할까요?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if(!error) {
      setTasks(prev => prev.filter(t=>t.id!==id));
      setModal(null);
      showToast("삭제되었습니다.");
    }
  };

  const saveEdu = async (f) => {
    const isNew = !f.id;
    const item = isNew ? { ...f, id: gid() } : f;
    const { error } = await supabase.from("edu_items").upsert(item);
    if(!error) {
      setEduItems(prev => isNew ? [...prev, item] : prev.map(t=>t.id===f.id?item:t));
      setModal(null);
      showToast(isNew ? "새 교육 일정이 등록되었습니다." : "교육 일정이 수정되었습니다.");
    }
  };

  const delEdu = async (id) => {
    if(!confirm("삭제할까요?")) return;
    const { error } = await supabase.from("edu_items").delete().eq("id", id);
    if(!error) {
      setEduItems(prev => prev.filter(t=>t.id!==id));
      setModal(null);
      showToast("삭제되었습니다.");
    }
  };

  const saveTypes = async (newList) => {
    const { error } = await supabase.from("settings").upsert({key:"types", value:newList});
    if(!error) {
      setTypes(newList);
      setModal(null);
      showToast("카테고리 설정이 저장되었습니다.");
    }
  };

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
                const isTod = ds === tod();
                
                // 해당 주차의 업무 정렬
                const weekStart = new Date(w.find(x=>x));
                weekStart.setHours(0,0,0,0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate()+6);

                const weekTasks = tasks.filter(t => {
                  const ts = new Date(t.startDate);
                  const te = new Date(t.endDate);
                  return ts <= weekEnd && te >= weekStart;
                }).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

                // 렌더링용 배열 (중복 방지 및 위치 선정)
                const rows = [];
                weekTasks.forEach(t => {
                  const ts = new Date(t.startDate);
                  const te = new Date(t.endDate);
                  const sc = Math.max(0, Math.floor((ts - weekStart)/(24*60*60*1000)));
                  const ec = Math.min(6, Math.floor((te - weekStart)/(24*60*60*1000)));
                  
                  let r = 0;
                  while(rows[r] && rows[r].some(x => x.sc <= ec && x.ec >= sc)) r++;
                  if(!rows[r]) rows[r] = [];
                  rows[r].push({sc, ec, span: ec-sc+1, task: t, isStart: ts >= weekStart, isEnd: te <= weekEnd});
                });

                return (
                  <div key={di} onClick={()=>d && onSelect(ds)} style={{position:"relative",minHeight:80,background:isSel?"#f0f7ff":"#fff",borderRight:di===6?"none":"1px solid #f0f0f0",cursor:d?"pointer":"default"}}>
                    {d && (
                      <div style={{padding:6,fontSize:13,fontWeight:isTod?800:400,color:isTod?"#378ADD":di===0?"#ff4d4f":di===6?"#378ADD":"#333",display:"flex",justifyContent:"space-between"}}>
                        <span>{d.getDate()}</span>
                        {isSel && <button onClick={(e)=>{e.stopPropagation();onAdd(ds);}} style={{border:"none",background:"#378ADD",color:"#fff",width:18,height:18,borderRadius:4,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
                      </div>
                    )}
                    
                    {di === 0 && (
                      <div style={{position:"absolute",top:28,left:0,right:0,zIndex:10,pointerEvents:"none"}}>
                        {rows.slice(0, 3).map((row, ri) => (
                          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",height:20,marginBottom:2}}>
                            {row.map(a => {
                              const ti = types.find(t=>t.key===a.task.type) || types[0];
                              const si = SL.find(s=>s.key===a.task.status) || SL[0];
                              const sk = a.task.status === "done" || a.task.status === "cancel";
                              return (
                                <div key={a.task.id} style={{gridColumn: `${a.sc + 1} / span ${a.span}`, pointerEvents: "auto", padding:"0 2px"}}>
                                  <div onClick={(e)=>{e.stopPropagation();onTask(a.task);}} 
                                    style={{
                                      marginLeft: a.isStart?2:0, marginRight: a.isEnd?2:0,
                                      padding:"1px 4px",
                                      lineHeight:"16px",
                                      height: "18px",
                                      borderRadius:`${a.isStart?4:0}px ${a.isEnd?4:0}px ${a.isEnd?4:0}px ${a.isStart?4:0}px`,
                                      background: rgba(ti.color,0.15),
                                      color: "#444",
                                      borderTop: `1px solid ${si.border}`,
                                      borderBottom: `1px solid ${si.border}`,
                                      borderLeft: a.isStart ? `3px solid ${si.border}` : "none",
                                      borderRight: a.isEnd ? `1px solid ${si.border}` : "none",
                                      fontSize:10, 
                                      whiteSpace:"nowrap", 
                                      overflow:"hidden",      // 추가됨
                                      textOverflow:"ellipsis", // 추가됨
                                      cursor:"pointer", 
                                      textDecoration:sk?"line-through":"none", 
                                      opacity:sk?0.6:1, 
                                      textAlign:"left",
                                      display: "block"        // 추가됨
                                    }}>
                                    {a.task.dueTime ? `[${a.task.dueTime}] ` : ""}{a.task.title}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        {rows.length > 3 && <div style={{fontSize:9,color:"#999",paddingLeft:6}}>+ {rows.length-3}개 더보기</div>}
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

  const EduGrid = ({ eduItems, date, selectedDate, setSelectedDate, onAdd, onItem }) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) days.push(new Date(date.getFullYear(), date.getMonth(), i));
    
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const lbl = (t) => {
      const tg = t.target==="worker"?"종":"책";
      const ty = t.type==="center"?"(본)":"(현)";
      return `${tg}${t.nth}${ty} ${t.region} ${t.place}`;
    };

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
                const isSel = ds === selectedDate;
                const isTod = ds === tod();
                
                const weekStart = new Date(w.find(x=>x));
                weekStart.setHours(0,0,0,0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate()+6);

                const weekEdus = eduItems.filter(t => {
                  const ts = new Date(t.startDate);
                  const te = new Date(t.endDate);
                  return ts <= weekEnd && te >= weekStart;
                }).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

                const rows = [];
                weekEdus.forEach(t => {
                  const ts = new Date(t.startDate);
                  const te = new Date(t.endDate);
                  const sc = Math.max(0, Math.floor((ts - weekStart)/(24*60*60*1000)));
                  const ec = Math.min(6, Math.floor((te - weekStart)/(24*60*60*1000)));
                  let r = 0;
                  while(rows[r] && rows[r].some(x => x.sc <= ec && x.ec >= sc)) r++;
                  if(!rows[r]) rows[r] = [];
                  rows[r].push({sc, ec, span: ec-sc+1, task: t, isStart: ts >= weekStart, isEnd: te <= weekEnd});
                });

                return (
                  <div key={di} onClick={()=>d && setSelectedDate(ds)} style={{position:"relative",minHeight:80,background:isSel?"#f0f7ff":"#fff",borderRight:di===6?"none":"1px solid #f0f0f0",cursor:d?"pointer":"default"}}>
                    {d && (
                      <div style={{padding:6,fontSize:13,fontWeight:isTod?800:400,color:isTod?"#378ADD":di===0?"#ff4d4f":di===6?"#378ADD":"#333",display:"flex",justifyContent:"space-between"}}>
                        <span>{d.getDate()}</span>
                        {isSel && <button onClick={(e)=>{e.stopPropagation();onAdd(ds);}} style={{border:"none",background:"#7F77DD",color:"#fff",width:18,height:18,borderRadius:4,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
                      </div>
                    )}
                    {di === 0 && (
                      <div style={{position:"absolute",top:28,left:0,right:0,zIndex:10,pointerEvents:"none"}}>
                        {rows.slice(0, 4).map((row, ri) => (
                          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",height:20,marginBottom:2}}>
                            {row.map(a => {
                              const color = a.task.type === "center" ? "#7F77DD" : "#0F6E56";
                              return (
                                <div key={a.task.id} style={{gridColumn: `${a.sc + 1} / span ${a.span}`, pointerEvents: "auto", padding:"0 2px"}}>
                                  <div onClick={(e)=>{e.stopPropagation();onItem(a.task);}}
                                    style={{
                                      marginLeft: a.isStart?2:0, marginRight: a.isEnd?2:0,
                                      padding:"1px 4px",
                                      lineHeight:"16px",
                                      height: "18px",
                                      borderRadius:`${a.isStart?4:0}px ${a.isEnd?4:0}px ${a.isEnd?4:0}px ${a.isStart?4:0}px`,
                                      background: rgba(color,0.15),
                                      color: color,
                                      borderTop: `1px solid ${color}`,
                                      borderBottom: `1px solid ${color}`,
                                      borderLeft: a.isStart ? `3px solid ${color}` : "none",
                                      borderRight: a.isEnd ? `1px solid ${color}` : "none",
                                      fontSize:10, 
                                      whiteSpace:"nowrap", 
                                      overflow:"hidden",      // 추가됨
                                      textOverflow:"ellipsis", // 추가됨
                                      cursor:"pointer", 
                                      textAlign:"left",
                                      display: "block"        // 추가됨
                                    }}>
                                    {a.task.startTime ? `[${a.task.startTime}] ` : ""}{lbl(a.task)}
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

  const openNew = (date) => setModal({type:"new", initial:{title:"", type:"work", status:"before", priority:1, startDate:date||tod(), endDate:date||tod(), dueTime:"", memo:""}});
  const openEduNew = (date) => setModal({type:"edu-new", date});
  const onTask = (task) => setModal({type:"edit", task});

  const pcPlanner = (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}}>
        <CalGrid tasks={tasks} date={viewDate} selected={selectedDate} onSelect={setSelectedDate} onAdd={openNew} onTask={onTask}/>
      </div>
      <div style={{width:320,background:"#f9f9fb",display:"flex",flexDirection:"column"}}>
        <div style={{padding:20,borderBottom:"1px solid #eee",background:"#fff"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#333"}}>{selectedDate.split("-")[2]}일의 상세 일정</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
          {tasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"#bbb",fontSize:14}}>일정이 없습니다.</div>
          ) : (
            tasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).map(t => {
              const ti = types.find(x=>x.key===t.type) || types[0];
              const si = SL.find(x=>x.key===t.status) || SL[0];
              return (
                <div key={t.id} onClick={()=>onTask(t)} style={{background:"#fff",padding:14,borderRadius:10,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",cursor:"pointer",borderLeft:`4px solid ${ti.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:11,color:ti.color,fontWeight:700}}>{ti.label}</span>
                    <span style={{fontSize:11,color:si.border,fontWeight:700}}>{si.label}</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:"#333"}}>{t.title}</div>
                  {t.dueTime && <div style={{fontSize:12,color:"#666"}}>⏰ {t.dueTime}</div>}
                  {t.memo && <div style={{fontSize:12,color:"#999",marginTop:6,whiteSpace:"pre-wrap"}}>{t.memo}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const mobilePlanner = (
    <div style={{flex:1,display:"flex",flexDirection:"column"}}>
      <CalGrid tasks={tasks} date={viewDate} selected={selectedDate} onSelect={setSelectedDate} onAdd={openNew} onTask={onTask}/>
      <div style={{flex:1,background:"#f9f9fb",padding:16,overflowY:"auto"}}>
        <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>{selectedDate} 일정</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).map(t => (
            <div key={t.id} onClick={()=>onTask(t)} style={{background:"#fff",padding:12,borderRadius:8,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
              <div style={{fontSize:13,fontWeight:700}}>{t.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",flexDirection:"column",background:"#f0f2f5",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}}>
      <div style={{background:"#fff",padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 4px rgba(0,0,0,0.05)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{fontSize:18,fontWeight:900,color:"#378ADD",letterSpacing:"-0.5px"}}>KAHAS SMART WORK</div>
          <div style={{display:"flex",background:"#f0f2f5",padding:4,borderRadius:8}}>
            <button onClick={()=>setMainTab("planner")} style={{padding:"6px 16px",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",background:mainTab==="planner"?"#fff":"transparent",color:mainTab==="planner"?"#378ADD":"#888",boxShadow:mainTab==="planner"?"0 2px 4px rgba(0,0,0,0.1)":"none"}}>업무 플래너</button>
            <button onClick={()=>setMainTab("edu")} style={{padding:"6px 16px",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",background:mainTab==="edu"?"#fff":"transparent",color:mainTab==="edu"?"#7F77DD":"#888",boxShadow:mainTab==="edu"?"0 2px 4px rgba(0,0,0,0.1)":"none"}}>교육 일정</button>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f5f5f5",padding:"4px 12px",borderRadius:20}}>
            <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} style={{border:"none",background:"none",cursor:"pointer",padding:4}}>◀</button>
            <span style={{fontSize:15,fontWeight:800,minWidth:80,textAlign:"center"}}>{viewDate.getFullYear()}년 {viewDate.getMonth()+1}월</span>
            <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} style={{border:"none",background:"none",cursor:"pointer",padding:4}}>▶</button>
          </div>
          <button onClick={()=>setModal({type:"settings"})} style={{padding:"8px 12px",borderRadius:6,border:"1px solid #ddd",background:"#fff",cursor:"pointer",fontSize:13}}>⚙ 설정</button>
          <button onClick={()=>openNew()} style={{padding:"8px 16px",borderRadius:6,border:"none",background:"#378ADD",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>+ 업무 등록</button>
        </div>
      </div>

      {mainTab==="planner"&&(mobile?mobilePlanner:pcPlanner)}
      {mainTab==="edu"&&<EduGrid eduItems={eduItems} date={viewDate} selectedDate={eduSelectedDate} setSelectedDate={setEduSelectedDate} onAdd={openEduNew} onItem={item=>setModal({type:"edu-edit",item})}/>}
      
      {modal?.type==="settings"&&<Overlay onClose={()=>setModal(null)}><TypeSettings types={types} onSave={saveTypes} onClose={()=>setModal(null)}/></Overlay>}
      {(modal?.type==="new"||modal?.type==="edit")&&<Overlay onClose={()=>setModal(null)}><TaskForm types={types} initial={modal.type==="edit"?modal.task:modal.initial} onSave={saveTask} onClose={()=>setModal(null)} onDelete={modal.type==="edit"?()=>delTask(modal.task.id):null}/></Overlay>}
      {(modal?.type==="edu-new"||modal?.type==="edu-edit")&&<Overlay onClose={()=>setModal(null)}><EduForm eduItems={eduItems} initial={modal.type==="edu-edit"?modal.item:{target:"worker",type:"center",nth:1,startDate:modal.date||tod(),endDate:modal.date||tod(),startTime:"09:00",endTime:"17:00",region:"",place:"",lectures:[{id:gid(),subject:"",instructor:""}],note:""}} onSave={saveEdu} onClose={()=>setModal(null)} onDelete={modal.type==="edu-edit"?()=>delEdu(modal.item.id):null}/></Overlay>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#333",color:"#fff",padding:"10px 24px",borderRadius:30,fontSize:14,boxShadow:"0 4px 12px rgba(0,0,0,0.2)",zIndex:2000}}>{toast}</div>}
    </div>
  );
}