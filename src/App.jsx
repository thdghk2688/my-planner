import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// 초기 설정값
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

// 공통 모달 오버레이
const Overlay = ({ children, onClose }) => (
  <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
    <div style={{background:"#fff",width:"95%",maxWidth:500,borderRadius:12,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 10px 25px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// [기존기능] 업무 등록/수정 폼
const TaskForm = ({ types, initial, onSave, onClose, onDelete }) => {
  const [f, setF] = useState(initial || { title: "", type: "work", status: "before", priority: 1, startDate: tod(), endDate: tod(), dueTime: "", memo: "" });
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{initial?.id?"업무 수정":"새 업무 등록"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <input autoFocus style={{width:"100%",padding:"12px",border:"1px solid #ddd",borderRadius:8,boxSizing:"border-box",fontSize:15}} value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="업무 제목을 입력하세요"/>
        <div style={{display:"flex",gap:10}}>
          <select style={{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:8}} value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
            {types.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select style={{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:8}} value={f.status} onChange={e=>setF({...f,status:e.target.value})}>
            {SL.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:10}}>
          <input type="date" style={{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:8}} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
          <input type="date" style={{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:8}} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
        </div>
        <textarea style={{width:"100%",padding:"12px",border:"1px solid #ddd",borderRadius:8,height:100,resize:"none"}} value={f.memo} onChange={e=>setF({...f,memo:e.target.value})} placeholder="상세 메모"/>
      </div>
      <div style={{marginTop:24,display:"flex",justifyContent:"space-between"}}>
        {onDelete ? <button onClick={onDelete} style={{color:"#ff4d4f",background:"none",border:"none",cursor:"pointer"}}>삭제</button> : <div/>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{padding:"10px 20px",borderRadius:8,border:"none",background:"#eee"}}>취소</button>
          <button onClick={()=>onSave(f)} style={{padding:"10px 20px",borderRadius:8,border:"none",background:"#378ADD",color:"#fff",fontWeight:700}}>저장</button>
        </div>
      </div>
    </div>
  );
};

// [설정기능] 카테고리 및 환경 설정
const SettingsModal = ({ types, onSave, onClose }) => {
  const [list, setList] = useState(types);
  const up = (idx, k, v) => setList(list.map((t,i)=>i===idx?{...t,[k]:v}:t));
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>시스템 설정</div>
      <div style={{marginBottom:15,fontSize:14,fontWeight:600}}>업무 카테고리 관리</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {list.map((t,i)=>(
          <div key={i} style={{display:"flex",gap:8}}>
            <input type="color" value={t.color} onChange={e=>up(i,"color",e.target.value)} style={{width:30,height:34,border:"none",padding:0,background:"none"}}/>
            <input style={{flex:1,padding:"8px",border:"1px solid #ddd",borderRadius:6}} value={t.label} onChange={e=>up(i,"label",e.target.value)}/>
          </div>
        ))}
      </div>
      <button onClick={()=>onSave(list)} style={{width:"100%",padding:"12px",background:"#378ADD",color:"#fff",border:"none",borderRadius:8,fontWeight:700}}>설정 저장하기</button>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [eduItems, setEduItems] = useState([]);
  const [types, setTypes] = useState(TYPES0);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(tod());
  const [filterType, setFilterType] = useState("all");
  const [mainTab, setMainTab] = useState("planner");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

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
    if(!error) {
      setTasks(prev => isNew ? [...prev, task] : prev.map(t=>t.id===f.id?f:t));
      setModal(null);
      setToast("완료되었습니다.");
      setTimeout(()=>setToast(""), 2000);
    }
  };

  const delTask = async (id) => {
    if(!confirm("삭제하시겠습니까?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t=>t.id!==id));
    setModal(null);
  };

  const filteredTasks = tasks.filter(t => filterType === "all" || t.type === filterType);

  // 캘린더 그리드 컴포넌트 (내부 정의)
  const renderCalendar = () => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const days = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return (
      <div style={{flex:1, display:"flex", flexDirection:"column", background:"#fff"}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)", borderBottom:"1px solid #eee", background:"#fcfcfc"}}>
          {["일","월","화","수","목","금","토"].map((d,i)=>(
            <div key={d} style={{padding:"10px 0", textAlign:"center", fontSize:12, fontWeight:700, color:i===0?"#ff4d4f":i===6?"#378ADD":"#666"}}>{d}</div>
          ))}
        </div>
        <div style={{flex:1, display:"grid", gridTemplateRows:`repeat(${weeks.length}, 1fr)`}}>
          {weeks.map((w, wi) => (
            <div key={wi} style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)", borderBottom:"1px solid #f0f0f0"}}>
              {w.map((d, di) => {
                const ds = d ? d.toISOString().split("T")[0] : "";
                const isSel = ds === selectedDate;
                const isTod = ds === tod();
                
                // 해당 주의 업무 바 처리 로직 (칸 넘침 방지 적용)
                const weekStart = d ? new Date(d) : null;
                if(weekStart) weekStart.setDate(weekStart.getDate() - di);

                return (
                  <div key={di} onClick={()=>d && setSelectedDate(ds)} style={{position:"relative", minHeight:90, background:isSel?"#f0f7ff":"#fff", borderRight:di===6?"none":"1px solid #f0f0f0", cursor:d?"pointer":"default"}}>
                    {d && (
                      <div style={{padding:6, fontSize:13, fontWeight:isTod?800:400, color:isTod?"#378ADD":di===0?"#ff4d4f":di===6?"#378ADD":"#333"}}>
                        {d.getDate()}
                      </div>
                    )}
                    
                    {/* 일간 업무 요약 (내용 넘침 방지 핵심 코드) */}
                    <div style={{padding:"0 4px", display:"flex", flexDirection:"column", gap:2}}>
                      {filteredTasks.filter(t => t.startDate <= ds && t.endDate >= ds).slice(0, 3).map(t => {
                        const ti = types.find(x=>x.key===t.type) || types[0];
                        return (
                          <div key={t.id} onClick={(e)=>{e.stopPropagation(); setModal({type:"edit", task:t});}}
                            style={{
                              padding:"2px 4px", fontSize:10, borderRadius:3,
                              background: rgba(ti.color, 0.1), color: "#444", borderLeft:`3px solid ${ti.color}`,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", // 칸 넘침 방지
                              lineHeight: "14px", height: "16px"
                            }}>
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:"#f0f2f5", overflow:"hidden"}}>
      {/* 상단 통합 헤더 */}
      <div style={{background:"#fff", padding:"0 20px", height:65, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #ddd", zIndex:100}}>
        <div style={{display:"flex", alignItems:"center", gap:25}}>
          <div style={{fontSize:20, fontWeight:900, color:"#378ADD", letterSpacing:"-1px"}}>KAHAS Planner</div>
          
          {/* [기존기능] 탭 메뉴 */}
          <div style={{display:"flex", background:"#f0f2f5", padding:4, borderRadius:8}}>
            <button onClick={()=>setMainTab("planner")} style={{padding:"6px 16px", border:"none", borderRadius:6, fontSize:13, fontWeight:700, cursor:"pointer", background:mainTab==="planner"?"#fff":"transparent", color:mainTab==="planner"?"#378ADD":"#888"}}>업무 플래너</button>
            <button onClick={()=>setMainTab("edu")} style={{padding:"6px 16px", border:"none", borderRadius:6, fontSize:13, fontWeight:700, cursor:"pointer", background:mainTab==="edu"?"#fff":"transparent", color:mainTab==="edu"?"#378ADD":"#888"}}>교육 일정</button>
          </div>

          {/* [기존기능] 업무 구분 필터 */}
          {mainTab === "planner" && (
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"6px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:13, background:"#fff"}}>
              <option value="all">전체 업무 보기</option>
              {types.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          )}
        </div>

        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <div style={{display:"flex", alignItems:"center", gap:10, background:"#f8f9fa", padding:"5px 15px", borderRadius:20, border:"1px solid #eee"}}>
            <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} style={{border:"none", background:"none", cursor:"pointer"}}>◀</button>
            <span style={{fontSize:15, fontWeight:800, minWidth:90, textAlign:"center"}}>{viewDate.getFullYear()}년 {viewDate.getMonth()+1}월</span>
            <button onClick={()=>setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} style={{border:"none", background:"none", cursor:"pointer"}}>▶</button>
          </div>
          <button onClick={()=>setModal({type:"settings"})} style={{padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer"}}>⚙ 설정</button>
          <button onClick={()=>setModal({type:"new"})} style={{padding:"8px 18px", borderRadius:8, border:"none", background:"#378ADD", color:"#fff", fontWeight:700, cursor:"pointer"}}>+ 업무 등록</button>
        </div>
      </div>

      {/* 메인 컨텐츠: 달력(왼쪽) + 포커스 리스트(오른쪽) 구조 복구 */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        <div style={{flex:1, display:"flex", flexDirection:"column", borderRight:"1px solid #eee"}}>
          {renderCalendar()}
        </div>

        {/* [기존기능] 우측 포커스/상세 목록 뷰 */}
        <div style={{width:350, background:"#f9f9fb", display:"flex", flexDirection:"column"}}>
          <div style={{padding:20, borderBottom:"1px solid #eee", background:"#fff"}}>
            <div style={{fontSize:16, fontWeight:800, color:"#333"}}>{selectedDate} 상세 목록</div>
          </div>
          <div style={{flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12}}>
            {filteredTasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).length === 0 ? (
              <div style={{textAlign:"center", padding:"50px 0", color:"#bbb", fontSize:14}}>선택한 날짜에 업무가 없습니다.</div>
            ) : (
              filteredTasks.filter(t => t.startDate <= selectedDate && t.endDate >= selectedDate).map(t => {
                const ti = types.find(x=>x.key===t.type) || types[0];
                return (
                  <div key={t.id} onClick={()=>setModal({type:"edit", task:t})} style={{background:"#fff", padding:15, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", cursor:"pointer", borderLeft:`5px solid ${ti.color}`}}>
                    <div style={{fontSize:11, color:ti.color, fontWeight:700, marginBottom:5}}>{ti.label}</div>
                    <div style={{fontSize:15, fontWeight:700, marginBottom:5, color:"#333"}}>{t.title}</div>
                    {t.memo && <div style={{fontSize:12, color:"#777", whiteSpace:"pre-wrap"}}>{t.memo}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 모달 레이어 */}
      {modal?.type === "settings" && <Overlay onClose={()=>setModal(null)}><SettingsModal types={types} onSave={(list)=>{supabase.from("settings").upsert({key:"types", value:list}); setTypes(list); setModal(null);}} onClose={()=>setModal(null)}/></Overlay>}
      {(modal?.type === "new" || modal?.type === "edit") && <Overlay onClose={()=>setModal(null)}><TaskForm types={types} initial={modal.task} onSave={saveTask} onClose={()=>setModal(null)} onDelete={modal.type==="edit"?()=>delTask(modal.task.id):null}/></Overlay>}
      
      {toast && <div style={{position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#333", color:"#fff", padding:"10px 25px", borderRadius:30, fontSize:14, zIndex:2000}}>{toast}</div>}
    </div>
  );
}