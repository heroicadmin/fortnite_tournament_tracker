import { useState, useCallback, useMemo, useRef } from "react";

const DEFAULT_SCORING = {
  solo: { placement: {1:25,2:20,3:16,4:14,5:12,6:10,7:9,8:8,9:7,10:6,11:5,12:5,13:5,14:4,15:4,16:4,17:3,18:3,19:3,20:3,21:2,22:2,23:2,24:2,25:2}, killPoints: 1 },
  duo: { placement: {1:25,2:20,3:16,4:14,5:12,6:10,7:9,8:8,9:7,10:6,11:5,12:5,13:4,14:4,15:3,16:3,17:2,18:2,19:2,20:2,21:1,22:1,23:1,24:1,25:1}, killPoints: 1 },
  trio: { placement: {1:30,2:24,3:20,4:16,5:14,6:12,7:10,8:8,9:7,10:6,11:5,12:5,13:4,14:4,15:3,16:3,17:2,18:2,19:1,20:1}, killPoints: 1 },
  quad: { placement: {1:30,2:24,3:20,4:16,5:14,6:12,7:10,8:8,9:7,10:6,11:5,12:5,13:4,14:4,15:3,16:3,17:2,18:2,19:1,20:1}, killPoints: 1 },
};

const TEST_NAMES = [
  "ShadowStrike","NeonViper","FrostByte","BlazeMaster","AquaPhoenix","ThunderWolf","CryptoNinja","PixelDemon",
  "StormBreaker","DarkMatter","LunarEclipse","CosmicDust","IronClad","SteelNerve","GhostRecon","CyberPunk",
  "TurboCharged","MegaVolt","ZeroGravity","NovaStar","VoidWalker","FlameKnight","IceQueen","SolarFlare",
  "NightHawk","BoltAction","RazorEdge","ChronoShift","WarpDrive","QuantumLeap","OmegaForce","AlphaStrike",
  "DeltaSquad","BravoPrime","EchoBase","FoxtrotDance","GolfSwing","HotelLima","JulietRomeo","KiloWatt",
  "LimaBean","MikeNovember","OscarPapa","PapaOscar","QuebecCity","RomeoAlpha","SierraMist","TangoDown",
  "UniformCode","VictorBravo","WhiskeyTango","XrayVision","YankeeFlip","ZuluWarrior","RocketFuel","LaserBeam",
  "PlasmaShot","GravityWell","MeteorShower","AsteroidBelt","CometTail","NebulaDrift","StarDust","MoonWalk"
];

function generateTestData(mode) {
  const teamSize = mode === "solo" ? 1 : mode === "duo" ? 2 : mode === "trio" ? 3 : 4;
  const numTeams = Math.floor(32 / teamSize);
  const shuffled = [...TEST_NAMES].sort(() => Math.random() - 0.5);
  const games = [];
  const names = [];
  for (let g = 0; g < 4; g++) {
    const rows = [];
    const gameShuffled = [...shuffled].sort(() => Math.random() - 0.5);
    for (let t = 0; t < numTeams; t++) {
      const placement = t + 1;
      const baseKills = Math.max(0, Math.floor(Math.random() * (12 - t * 0.3)));
      for (let p = 0; p < teamSize; p++) {
        const idx = t * teamSize + p;
        if (idx >= gameShuffled.length) break;
        rows.push({ name: gameShuffled[idx], placement, kills: Math.max(0, baseKills + Math.floor(Math.random() * 4 - 2)) });
      }
    }
    games.push(rows);
    names.push("Test Game " + (g + 1));
  }
  return { games, names };
}

function parseCSV(text) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lines = cleaned.split("\n").filter(l => l.trim());
  const rows = [];
  for (const line of lines) {
    const lc = line.lastIndexOf(",");
    const slc = line.lastIndexOf(",", lc - 1);
    if (slc === -1) continue;
    const name = line.substring(0, slc).trim();
    const placement = parseInt(line.substring(slc + 1, lc).trim(), 10);
    const kills = parseInt(line.substring(lc + 1).trim(), 10);
    if (name && !isNaN(placement) && !isNaN(kills)) rows.push({ name, placement, kills });
  }
  return rows;
}

function detectMode(rows) {
  const pc = {};
  for (const r of rows) pc[r.placement] = (pc[r.placement] || 0) + 1;
  const counts = Object.values(pc);
  if (!counts.length) return "solo";
  const m = counts.reduce((a, b) => (counts.filter(v => v === a).length >= counts.filter(v => v === b).length ? a : b));
  return m === 1 ? "solo" : m === 2 ? "duo" : m === 3 ? "trio" : m >= 4 ? "quad" : "solo";
}

function calculateScores(rows, scoring) {
  return rows.map(r => {
    const pp = scoring.placement[r.placement] || 0;
    const kp = r.kills * scoring.killPoints;
    return { ...r, placementPts: pp, killPts: kp, totalPts: pp + kp };
  });
}

function groupTeams(scored, mode) {
  if (mode === "solo") return scored.map(s => ({ players:[s.name], placement:s.placement, kills:s.kills, placementPts:s.placementPts, killPts:s.killPts, totalPts:s.totalPts }));
  const groups = {};
  for (const s of scored) { if (!groups[s.placement]) groups[s.placement] = []; groups[s.placement].push(s); }
  return Object.entries(groups).map(([p, members]) => {
    const tk = members.reduce((a, m) => a + m.kills, 0);
    const pp = members[0].placementPts;
    const kpc = tk * (DEFAULT_SCORING[mode]?.killPoints || 1);
    return { players: members.map(m => m.name), placement: parseInt(p), kills: tk, placementPts: pp, killPts: kpc, totalPts: pp + kpc };
  });
}

function aggregateGames(all) {
  const pm = {};
  for (const game of all) for (const t of game) {
    const k = t.players.sort().join(" & ");
    if (!pm[k]) pm[k] = { players: t.players, totalPts: 0, totalKills: 0, bestPlacement: 999, gamesPlayed: 0, placements: [] };
    pm[k].totalPts += t.totalPts; pm[k].totalKills += t.kills; pm[k].gamesPlayed += 1; pm[k].placements.push(t.placement);
    if (t.placement < pm[k].bestPlacement) pm[k].bestPlacement = t.placement;
  }
  return Object.values(pm).sort((a, b) => b.totalPts - a.totalPts || a.bestPlacement - b.bestPlacement);
}

function buildTrophyMap(processedGames, gameNames) {
  const map = {};
  processedGames.forEach((game, gi) => {
    for (const t of game) if (t.placement <= 3) {
      const k = t.players.sort().join(" & ");
      if (!map[k]) map[k] = [];
      map[k].push({ gi, gameName: gameNames[gi] || "Game " + (gi + 1), placement: t.placement });
    }
  });
  return map;
}

const TrophyBadges = ({ trophies }) => {
  if (!trophies?.length) return null;
  const grouped = {};
  for (const t of trophies) grouped[t.placement] = (grouped[t.placement] || 0) + 1;
  const ic = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };
  return <span style={{ marginLeft: 8, display: "inline-flex", gap: 4, verticalAlign: "middle" }}>
    {Object.entries(grouped).sort((a,b) => a[0]-b[0]).map(([p, count]) =>
      <span key={p} title={count + "x #" + p + " placement"} style={{ fontSize: 14, cursor: "default", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))", fontFamily: SF }}>
        {ic[p]}{count > 1 ? <span style={{ fontSize: 10, fontWeight: 800, verticalAlign: "super", color: "#c8cdd8" }}>x{count}</span> : null}
      </span>
    )}
  </span>;
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return <div style={{ width:36,height:36,background:"linear-gradient(135deg,#FFD700,#FFA500)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#1a0800",boxShadow:"0 0 16px rgba(255,215,0,0.5)",border:"2px solid #FFD700" }}>{"\u{1F451}"}</div>;
  if (rank === 2) return <div style={{ width:36,height:36,background:"linear-gradient(135deg,#C0C0C0,#8a8a8a)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#1a1a2e",boxShadow:"0 0 12px rgba(192,192,192,0.4)",border:"2px solid #C0C0C0" }}>2</div>;
  if (rank === 3) return <div style={{ width:36,height:36,background:"linear-gradient(135deg,#CD7F32,#8B4513)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff",boxShadow:"0 0 12px rgba(205,127,50,0.4)",border:"2px solid #CD7F32" }}>3</div>;
  return <div style={{ width:36,height:36,background:"rgba(255,255,255,0.05)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#8892a4",border:"1px solid rgba(255,255,255,0.08)" }}>{rank}</div>;
};

const PodiumCard = ({ team, placement }) => {
  const c = {
    1: { bg:"linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,165,0,0.06))",border:"rgba(255,215,0,0.35)",glow:"0 0 24px rgba(255,215,0,0.15)",icon:"\u{1F3C6}",label:"#FFD700" },
    2: { bg:"linear-gradient(135deg,rgba(192,192,192,0.10),rgba(138,138,138,0.05))",border:"rgba(192,192,192,0.3)",glow:"0 0 16px rgba(192,192,192,0.1)",icon:"\u{1F948}",label:"#C0C0C0" },
    3: { bg:"linear-gradient(135deg,rgba(205,127,50,0.10),rgba(139,69,19,0.05))",border:"rgba(205,127,50,0.3)",glow:"0 0 16px rgba(205,127,50,0.1)",icon:"\u{1F949}",label:"#CD7F32" },
  }[placement] || { bg:"rgba(0,0,0,0.1)",border:"rgba(255,255,255,0.1)",glow:"none",icon:"",label:"#888" };
  const pl = { 1:"1ST PLACE", 2:"2ND PLACE", 3:"3RD PLACE" };
  return <div style={{ background:c.bg,border:"1px solid "+c.border,borderRadius:14,padding:"18px 20px",boxShadow:c.glow,transition:"transform 0.2s",display:"flex",alignItems:"center",gap:16,minWidth:0 }}
    onMouseOver={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform="translateY(0)"}>
    <div style={{ fontSize:36,lineHeight:1,flexShrink:0 }}>{c.icon}</div>
    <div style={{ minWidth:0,flex:1 }}>
      <div style={{ fontSize:10,fontWeight:700,color:c.label,letterSpacing:2,textTransform:"uppercase",fontFamily:SF,marginBottom:4 }}>{pl[placement]}</div>
      <div style={{ fontWeight:800,fontSize:16,color:"#e8eaf0",fontFamily:SF,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{team.players.join(" & ")}</div>
      <div style={{ fontSize:12,color:"#5a6478",marginTop:4,fontFamily:SF,display:"flex",gap:12,flexWrap:"wrap" }}>
        <span>{team.kills} elims</span>
        <span style={{ color:"#00b4ff",fontWeight:700 }}>{team.totalPts} pts</span>
      </div>
    </div>
  </div>;
};

const SF = "'Segoe UI',sans-serif";

export default function FortniteLeaderboard() {
  const [games, setGames] = useState([]);
  const [gameNames, setGameNames] = useState([]);
  const [overrideMode, setOverrideMode] = useState(null);
  const [detectedMode, setDetectedMode] = useState("solo");
  const [showScoring, setShowScoring] = useState(false);
  const [scoring, setScoring] = useState(JSON.parse(JSON.stringify(DEFAULT_SCORING)));
  const [activeGame, setActiveGame] = useState("all");
  const [animateIn, setAnimateIn] = useState(false);
  const [showAdmin, setShowAdmin] = useState(true);
  const fileRef = useRef(null);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const arr = new Uint8Array(ev.target.result);
        let text;
        if (arr[0]===0xFF&&arr[1]===0xFE) text=new TextDecoder("utf-16le").decode(arr);
        else if (arr[0]===0xFE&&arr[1]===0xFF) text=new TextDecoder("utf-16be").decode(arr);
        else text=new TextDecoder("utf-8").decode(arr);
        resolve({ name: file.name, data: parseCSV(text) });
      };
      reader.readAsArrayBuffer(file);
    }))).then(results => {
      setGames(p => [...p, ...results.map(r => r.data)]);
      setGameNames(p => [...p, ...results.map(r => r.name.replace(/\.csv$/i,""))]);
      if (results.length) setDetectedMode(detectMode(results[0].data));
      setAnimateIn(false); setTimeout(() => setAnimateIn(true), 50);
    });
    e.target.value = "";
  }, []);

  const loadTestData = useCallback(() => {
    const mode = overrideMode || "duo";
    const { games: tg, names: tn } = generateTestData(mode);
    setGames(tg);
    setGameNames(tn);
    setDetectedMode(mode);
    setActiveGame("all");
    setAnimateIn(false);
    setTimeout(() => setAnimateIn(true), 50);
  }, [overrideMode]);

  const currentMode = overrideMode || detectedMode;
  const currentScoring = scoring[currentMode];
  const processedGames = useMemo(() => games.map(g => groupTeams(calculateScores(g, currentScoring), currentMode)), [games, currentMode, currentScoring]);
  const trophyMap = useMemo(() => buildTrophyMap(processedGames, gameNames), [processedGames, gameNames]);

  const leaderboardData = useMemo(() => {
    if (activeGame === "all") return aggregateGames(processedGames);
    if (activeGame === "highlights") return [];
    const idx = parseInt(activeGame);
    if (processedGames[idx]) return [...processedGames[idx]].sort((a,b) => b.totalPts-a.totalPts||a.placement-b.placement).map(t => ({...t,totalKills:t.kills,bestPlacement:t.placement,gamesPlayed:1,placements:[t.placement]}));
    return [];
  }, [processedGames, activeGame]);

  const highlightsData = useMemo(() => processedGames.map((game,gi) => ({
    gameName: gameNames[gi]||"Game "+(gi+1), gameIndex:gi,
    podium: [...game].sort((a,b)=>a.placement-b.placement).filter(t=>t.placement<=3)
  })), [processedGames, gameNames]);

  const clearAll = () => { setGames([]); setGameNames([]); setActiveGame("all"); };
  const updatePP = (mode,p,v) => setScoring(prev => { const n=JSON.parse(JSON.stringify(prev)); n[mode].placement[p]=parseInt(v)||0; return n; });
  const updateKP = (mode,v) => setScoring(prev => { const n=JSON.parse(JSON.stringify(prev)); n[mode].killPoints=parseFloat(v)||0; return n; });

  const modes = ["solo","duo","trio","quad"];
  const tb = (active, hl) => ({
    padding:"8px 18px",borderRadius:6,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:SF,textTransform:"uppercase",letterSpacing:1,transition:"all 0.2s",
    background:hl?(active?"linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,165,0,0.08))":"rgba(255,255,255,0.03)"):(active?"rgba(0,180,255,0.12)":"rgba(255,255,255,0.03)"),
    border:"1px solid "+(active?(hl?"rgba(255,215,0,0.35)":"rgba(0,180,255,0.3)"):"rgba(255,255,255,0.06)"),
    color:active?(hl?"#FFD700":"#00b4ff"):"#5a6478",
  });

  return (
    <div style={{ minHeight:"100vh",background:"#0a0e1a",fontFamily:"'Burbank Big Condensed','Impact','Oswald',sans-serif",color:"#e8eaf0",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }}>
        <div style={{ position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,120,255,0.08) 0%,transparent 70%)",filter:"blur(80px)" }} />
        <div style={{ position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"50%",borderRadius:"50%",background:"radial-gradient(circle,rgba(147,51,234,0.06) 0%,transparent 70%)",filter:"blur(80px)" }} />
        <div style={{ position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.01) 2px,rgba(255,255,255,0.01) 4px)" }} />
      </div>

      <div style={{ position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"32px 20px" }}>
        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <div style={{ display:"inline-block",padding:"6px 20px",background:"rgba(0,180,255,0.1)",border:"1px solid rgba(0,180,255,0.2)",borderRadius:100,fontSize:12,fontWeight:600,letterSpacing:3,textTransform:"uppercase",color:"#00b4ff",marginBottom:16,fontFamily:SF }}>TOURNAMENT TRACKER</div>
          <h1 style={{ fontSize:"clamp(42px,8vw,72px)",fontWeight:900,margin:0,lineHeight:0.95,letterSpacing:"-1px",textTransform:"uppercase",background:"linear-gradient(180deg,#FFF 20%,#7eb8ff 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 4px 20px rgba(0,120,255,0.3))" }}>LEADERBOARD</h1>
          <div style={{ width:120,height:3,background:"linear-gradient(90deg,transparent,#00b4ff,transparent)",margin:"16px auto 0" }} />
        </div>

        {/* Admin Controls - collapsible */}
        {showAdmin && <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:20,marginBottom:28 }}>
          <div style={{ display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"center" }}>
            <input ref={fileRef} type="file" accept=".csv" multiple onChange={handleFileUpload} style={{ display:"none" }} />
            <button onClick={() => fileRef.current?.click()} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 22px",background:"linear-gradient(135deg,#0078ff,#0054b4)",border:"1px solid rgba(0,120,255,0.4)",borderRadius:8,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:SF,transition:"all 0.2s",boxShadow:"0 4px 16px rgba(0,120,255,0.3)" }}
              onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 24px rgba(0,120,255,0.4)";}}
              onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,120,255,0.3)";}}>
              <span style={{ fontSize:18 }}>{"\u{1F4C2}"}</span> Upload CSV
            </button>
            <button onClick={loadTestData} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 22px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:8,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:SF,transition:"all 0.2s",boxShadow:"0 4px 16px rgba(34,197,94,0.3)" }}
              onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 24px rgba(34,197,94,0.4)";}}
              onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 16px rgba(34,197,94,0.3)";}}>
              <span style={{ fontSize:18 }}>{"\u{1F9EA}"}</span> Load Test Data
            </button>
            {games.length > 0 && <button onClick={clearAll} style={{ padding:"10px 18px",background:"rgba(255,60,60,0.1)",border:"1px solid rgba(255,60,60,0.3)",borderRadius:8,color:"#ff6b6b",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:SF,transition:"all 0.2s" }}
              onMouseOver={e=>e.currentTarget.style.background="rgba(255,60,60,0.2)"} onMouseOut={e=>e.currentTarget.style.background="rgba(255,60,60,0.1)"}>{"\u2715"} Clear All</button>}
            <button onClick={() => setShowScoring(!showScoring)} style={{ padding:"10px 18px",background:showScoring?"rgba(147,51,234,0.15)":"rgba(255,255,255,0.05)",border:"1px solid "+(showScoring?"rgba(147,51,234,0.4)":"rgba(255,255,255,0.1)"),borderRadius:8,color:showScoring?"#c084fc":"#8892a4",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:SF }}>{"\u2699\uFE0F"} Scoring</button>
          </div>

          {/* Scoring Panel */}
          {showScoring && <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(147,51,234,0.2)",borderRadius:12,padding:20,marginTop:16 }}>
            <h3 style={{ margin:"0 0 16px",fontSize:16,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:"#c084fc",fontFamily:SF }}>{"\u2699\uFE0F"} Scoring — {currentMode.toUpperCase()}</h3>
            <div style={{ display:"flex",flexWrap:"wrap",gap:16,alignItems:"flex-start" }}>
              <div style={{ flex:1,minWidth:250 }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#8892a4",marginBottom:10,fontFamily:SF,textTransform:"uppercase",letterSpacing:1 }}>Kill Points</div>
                <input type="number" value={scoring[currentMode].killPoints} onChange={e=>updateKP(currentMode,e.target.value)} style={{ width:80,padding:"8px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#fff",fontSize:16,fontWeight:700,fontFamily:SF }} />
                <span style={{ marginLeft:8,color:"#5a6478",fontSize:13,fontFamily:SF }}>pts per elim</span>
              </div>
              <div style={{ flex:2,minWidth:300 }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#8892a4",marginBottom:10,fontFamily:SF,textTransform:"uppercase",letterSpacing:1 }}>Placement Points</div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6 }}>
                  {Object.entries(scoring[currentMode].placement).map(([p,pts]) => <div key={p} style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ color:"#5a6478",fontSize:12,fontFamily:SF,minWidth:20 }}>#{p}</span>
                    <input type="number" value={pts} onChange={e=>updatePP(currentMode,parseInt(p),e.target.value)} style={{ width:50,padding:"4px 8px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"#fff",fontSize:13,fontWeight:600,fontFamily:SF }} />
                  </div>)}
                </div>
              </div>
            </div>
          </div>}
        </div>}

        {/* Mode Switch */}
        <div style={{ display:"flex",justifyContent:"center",gap:4,marginBottom:24,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.06)",width:"fit-content",margin:"0 auto 24px" }}>
          {modes.map(mode => <button key={mode} onClick={()=>setOverrideMode(mode)} style={{ padding:"10px 24px",background:currentMode===mode?"linear-gradient(135deg,#0078ff,#0054b4)":"transparent",border:"none",borderRadius:8,color:currentMode===mode?"#fff":"#5a6478",fontWeight:800,fontSize:14,cursor:"pointer",textTransform:"uppercase",letterSpacing:1.5,fontFamily:SF,transition:"all 0.2s",boxShadow:currentMode===mode?"0 4px 16px rgba(0,120,255,0.3)":"none" }}>{mode}</button>)}
          <button onClick={()=>setOverrideMode(null)} style={{ padding:"10px 16px",background:!overrideMode?"rgba(0,180,255,0.15)":"transparent",border:"none",borderRadius:8,color:!overrideMode?"#00b4ff":"#5a6478",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:SF }}>AUTO</button>
        </div>

        {/* Tabs */}
        {games.length > 0 && <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6,marginBottom:24 }}>
          <button onClick={()=>setActiveGame("all")} style={tb(activeGame==="all",false)}>{"\u{1F4CA}"} All Games</button>
          <button onClick={()=>setActiveGame("highlights")} style={tb(activeGame==="highlights",true)}>{"\u{1F3C6}"} Highlights</button>
          {gameNames.map((n,i) => <button key={i} onClick={()=>setActiveGame(String(i))} style={tb(activeGame===String(i),false)}>{n}</button>)}
        </div>}

        {/* Empty State */}
        {games.length === 0 && <div style={{ textAlign:"center",padding:"80px 20px",background:"rgba(255,255,255,0.02)",border:"2px dashed rgba(255,255,255,0.08)",borderRadius:20,marginTop:20 }}>
          <div style={{ fontSize:64,marginBottom:20,filter:"grayscale(0.3)" }}>{"\u{1F3C6}"}</div>
          <h2 style={{ fontSize:28,fontWeight:900,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:2,color:"#3a4258" }}>No Games Loaded</h2>
          <p style={{ color:"#3a4258",fontSize:15,maxWidth:480,margin:"0 auto 24px",lineHeight:1.7,fontFamily:SF }}>Upload CSV files with format: <code style={{ background:"rgba(0,180,255,0.1)",padding:"2px 8px",borderRadius:4,color:"#00b4ff",fontSize:13 }}>PlayerName,Placement,Kills</code></p>
          <p style={{ color:"#2a3248",fontSize:13,fontFamily:SF }}>Duo mode is auto-detected when two players share the same placement.</p>
        </div>}

        {/* HIGHLIGHTS */}
        {activeGame==="highlights" && games.length>0 && <div>
          <div style={{ textAlign:"center",marginBottom:32 }}>
            <div style={{ fontSize:48,marginBottom:8 }}>{"\u{1F3C6}"}</div>
            <h2 style={{ fontSize:28,fontWeight:900,margin:0,textTransform:"uppercase",letterSpacing:3,background:"linear-gradient(135deg,#FFD700,#FFA500)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:SF }}>Tournament Highlights</h2>
            <p style={{ color:"#5a6478",fontSize:13,marginTop:8,fontFamily:SF }}>Top 3 placements across all games</p>
          </div>
          {highlightsData.map((game,gi) => <div key={gi} style={{ marginBottom:36,animation:animateIn?"fadeUp 0.4s ease "+(gi*0.1)+"s both":"none" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:"linear-gradient(135deg,#00b4ff,#0078ff)",boxShadow:"0 0 8px rgba(0,180,255,0.4)" }} />
              <h3 style={{ margin:0,fontSize:16,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:"#c8cdd8",fontFamily:SF }}>{game.gameName}</h3>
              <div style={{ marginLeft:"auto",padding:"4px 12px",background:"rgba(255,255,255,0.03)",borderRadius:100,fontSize:11,color:"#5a6478",fontFamily:SF,fontWeight:600 }}>Game {gi+1} of {games.length}</div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:game.podium.length>=3?"repeat(3,1fr)":"repeat("+game.podium.length+",1fr)",gap:12 }}>
              {game.podium.sort((a,b)=>a.placement-b.placement).map((t,ti) => <PodiumCard key={ti} team={t} placement={t.placement} />)}
            </div>
          </div>)}
          {Object.keys(trophyMap).length>0 && <div style={{ marginTop:40,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,215,0,0.12)",borderRadius:16,padding:24 }}>
            <h3 style={{ margin:"0 0 20px",fontSize:16,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:"#FFD700",fontFamily:SF,display:"flex",alignItems:"center",gap:10 }}><span>{"\u{1F3C5}"}</span> Trophy Tally</h3>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
              {Object.entries(trophyMap).sort((a,b) => {
                const s=arr=>arr.reduce((x,t)=>x+(t.placement===1?100:t.placement===2?10:1),0);
                return s(b[1])-s(a[1]);
              }).map(([name,trophies]) => {
                const g=trophies.filter(t=>t.placement===1).length, si=trophies.filter(t=>t.placement===2).length, br=trophies.filter(t=>t.placement===3).length;
                return <div key={name} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:"#c8cdd8",flex:1,fontFamily:SF,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</div>
                  <div style={{ display:"flex",gap:8,flexShrink:0,fontFamily:SF,fontSize:13 }}>
                    {g>0 && <span>{"\u{1F947}"}{g>1?"\u00D7"+g:""}</span>}
                    {si>0 && <span>{"\u{1F948}"}{si>1?"\u00D7"+si:""}</span>}
                    {br>0 && <span>{"\u{1F949}"}{br>1?"\u00D7"+br:""}</span>}
                  </div>
                </div>;
              })}
            </div>
          </div>}
        </div>}

        {/* LEADERBOARD TABLE */}
        {activeGame!=="highlights" && leaderboardData.length>0 && <div>
          <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:20,justifyContent:"center" }}>
            {[{l:"Mode",v:currentMode.toUpperCase(),i:"\u{1F3AE}"},{l:"Games",v:games.length,i:"\u{1F5D3}"},{l:"Entries",v:leaderboardData.length,i:"\u{1F464}"}].map((s,i) =>
              <div key={i} style={{ padding:"10px 20px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,display:"flex",alignItems:"center",gap:10,fontFamily:SF }}>
                <span style={{ fontSize:18 }}>{s.i}</span>
                <div><div style={{ fontSize:10,fontWeight:600,color:"#5a6478",textTransform:"uppercase",letterSpacing:1 }}>{s.l}</div><div style={{ fontSize:18,fontWeight:800,color:"#e8eaf0" }}>{s.v}</div></div>
              </div>
            )}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"56px 1fr 80px 90px 90px 100px",padding:"10px 16px",fontWeight:700,fontSize:10,color:"#5a6478",textTransform:"uppercase",letterSpacing:1.5,fontFamily:SF,borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:4 }}>
            <span>Rank</span><span>Player{currentMode!=="solo"?"s":""}</span><span style={{textAlign:"center"}}>Elims</span><span style={{textAlign:"center"}}>Place Pts</span><span style={{textAlign:"center"}}>Elim Pts</span><span style={{textAlign:"right"}}>Total</span>
          </div>
          {leaderboardData.map((entry,i) => {
            const rank=i+1, isTop3=rank<=3;
            const bg=rank===1?"rgba(255,215,0,0.06)":rank===2?"rgba(192,192,192,0.04)":rank===3?"rgba(205,127,50,0.04)":"transparent";
            const bl=rank===1?"3px solid #FFD700":rank===2?"3px solid #C0C0C0":rank===3?"3px solid #CD7F32":"3px solid transparent";
            const tk=entry.players.sort().join(" & ");
            const tr=trophyMap[tk]||[];
            return <div key={i} style={{ display:"grid",gridTemplateColumns:"56px 1fr 80px 90px 90px 100px",alignItems:"center",padding:"12px 16px",background:bg,borderLeft:bl,borderBottom:"1px solid rgba(255,255,255,0.03)",borderRadius:isTop3?8:0,marginBottom:isTop3?4:0,transition:"background 0.2s",animation:animateIn?"slideIn 0.3s ease "+(i*0.02)+"s both":"none",fontFamily:SF }}
              onMouseOver={e=>{if(!isTop3)e.currentTarget.style.background="rgba(255,255,255,0.03)";}} onMouseOut={e=>{if(!isTop3)e.currentTarget.style.background=bg;}}>
              <RankBadge rank={rank} />
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:isTop3?"#fff":"#c8cdd8",display:"flex",alignItems:"center",flexWrap:"wrap" }}>
                  <span>{entry.players.join(" & ")}</span>
                  <TrophyBadges trophies={tr} />
                </div>
                {activeGame==="all"&&entry.gamesPlayed>1&&<div style={{ fontSize:11,color:"#5a6478",marginTop:2 }}>{entry.gamesPlayed} games {"\u00B7"} Best #{entry.bestPlacement}</div>}
              </div>
              <div style={{ textAlign:"center",fontWeight:700,fontSize:15,color:"#ff6b6b" }}>{entry.totalKills??entry.kills}</div>
              <div style={{ textAlign:"center",fontWeight:600,fontSize:14,color:"#8892a4" }}>
                {activeGame==="all"?processedGames.reduce((s,g)=>{const m=g.find(t=>t.players.sort().join(" & ")===tk);return s+(m?m.placementPts:0);},0):entry.placementPts}
              </div>
              <div style={{ textAlign:"center",fontWeight:600,fontSize:14,color:"#8892a4" }}>
                {activeGame==="all"?processedGames.reduce((s,g)=>{const m=g.find(t=>t.players.sort().join(" & ")===tk);return s+(m?m.killPts:0);},0):entry.killPts}
              </div>
              <div style={{ textAlign:"right",fontWeight:900,fontSize:20,background:isTop3?"linear-gradient(90deg,#00b4ff,#c084fc)":"none",WebkitBackgroundClip:isTop3?"text":"unset",WebkitTextFillColor:isTop3?"transparent":"#e8eaf0" }}>{entry.totalPts}</div>
            </div>;
          })}
        </div>}

        {/* Footer with admin toggle */}
        <div style={{ textAlign:"center",marginTop:48,padding:"20px 0",borderTop:"1px solid rgba(255,255,255,0.04)",fontFamily:SF }}>
          <button onClick={()=>setShowAdmin(!showAdmin)} style={{
            padding:"8px 20px",background:showAdmin?"rgba(255,255,255,0.05)":"rgba(0,180,255,0.08)",
            border:"1px solid "+(showAdmin?"rgba(255,255,255,0.08)":"rgba(0,180,255,0.2)"),borderRadius:8,
            color:showAdmin?"#5a6478":"#00b4ff",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:SF,
            transition:"all 0.2s",marginBottom:12,letterSpacing:1,textTransform:"uppercase"
          }}>
            {showAdmin ? "\u{1F6AB} Hide Admin Controls" : "\u{1F527} Show Admin Controls"}
          </button>
          <p style={{ color:"#2a3248",fontSize:12,margin:0 }}>Scoring based on FNCS format {"\u00B7"} Upload multiple CSVs for multi-game tournaments</p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input[type="number"] { outline:none; }
        input[type="number"]:focus { border-color:rgba(0,180,255,0.4) !important; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
      `}</style>
    </div>
  );
}
