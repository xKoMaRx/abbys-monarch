import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Code, 
  Database, 
  RefreshCw, 
  Layers, 
  FileCode2, 
  Trash2, 
  Copy, 
  Flame, 
  Swords, 
  Compass, 
  BookOpen, 
  AlertCircle, 
  Monitor, 
  Search, 
  ChevronRight, 
  Zap, 
  Heart, 
  Download, 
  Upload,
  Info
} from 'lucide-react';

interface HunterProfile {
  id: string;
  saveKey: string;
  name: string;
  level: number;
  avatar: string;
  talent: string;
  dayCount: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'gra' | 'kod' | 'zapisy' | 'analiza'>('gra');
  const [profiles, setProfiles] = useState<HunterProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [rawSaveJson, setRawSaveJson] = useState<string>('');
  const [activeSaveKey, setActiveSaveKey] = useState<string | null>(null);
  
  // File Code Inspector State
  const [selectedFile, setSelectedFile] = useState<string>('js/app.js');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Iframe Control
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreenGame, setIsFullscreenGame] = useState<boolean>(false);

  // Status and Message Alerts
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>({
    text: "Pulpit deweloperski Abyss Monarch został pomyślnie uruchomiony.",
    type: 'success'
  });

  const gameFilesList = [
    { path: 'index.html', desc: 'Szkielet ekranów, sekcji miast i logów bojowych', size: '48 KB' },
    { path: 'css/style.css', desc: 'Stylistyka gry, kolory otchłani, klimatyczna czcionka', size: '43 KB' },
    { path: 'js/app.js', desc: 'Główny cykl gry (Game Loop, autozapis, czas gry)', size: '6.4 KB' },
    { path: 'js/state.js', desc: 'Zarządzanie profilami i trwałym zapisem w przeglądarce', size: '17 KB' },
    { path: 'js/classes.js', desc: 'Statystyki łowców, przyrosty mocy i klasy postaci', size: '15 KB' },
    { path: 'js/skills.js', desc: 'Drzewka umiejętności łowców i mechanika fuzji', size: '12 KB' },
    { path: 'js/quests.js', desc: 'System misji głównych, pobocznych i nagród', size: '7.1 KB' },
    { path: 'js/city.js', desc: 'Obsługa lokacji miejskich, NPC, interakcji i spania', size: '13 KB' },
    { path: 'js/dungeons.js', desc: 'Symulator walki, tury przeciwników, logi oraz łupy', size: '25 KB' },
    { path: 'js/ui.js', desc: 'Renderowanie interfejsu, aktualizacja puszki HUD, ekrany walki', size: '88 KB' },
  ];

  // Helper function to display custom messages
  const showAlert = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(prev => prev?.text === text ? null : prev);
    }, 6000);
  };

  // Reload save files from local storage
  const syncSaves = () => {
    try {
      const listStr = localStorage.getItem('abyss_monarch_profile_list');
      if (listStr) {
        const parsedList = JSON.parse(listStr) as HunterProfile[];
        setProfiles(parsedList);
        
        // Find existing saved hunters to make active selection easier
        if (parsedList.length > 0) {
          if (!selectedProfileId || !parsedList.some(p => p.id === selectedProfileId)) {
            setSelectedProfileId(parsedList[0].id);
            loadSaveStateForJson(parsedList[0].saveKey);
          }
        } else {
          setSelectedProfileId(null);
          setRawSaveJson('');
          setActiveSaveKey(null);
        }
      } else {
        setProfiles([]);
        setSelectedProfileId(null);
        setRawSaveJson('');
        setActiveSaveKey(null);
      }
    } catch (e: any) {
      console.error("Błąd ładowania zapisów:", e);
      showAlert("Błąd podczas odczytu zapisów z pamięci lokalnej.", "error");
    }
  };

  // Fetch file from static resources to inspect inside the developer code tool
  const fetchFileSource = async (filePath: string) => {
    setLoadingFile(true);
    try {
      const response = await fetch(`/game/${filePath}`);
      if (response.ok) {
        const code = await response.text();
        setFileContent(code);
      } else {
        setFileContent(`[Błąd] Nie udało się odczytać kodu pliku: /game/${filePath} (Status: ${response.status})`);
      }
    } catch (err: any) {
      setFileContent(`[Błąd] Wyjątek połączenia: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  // Selected profile json loading
  const loadSaveStateForJson = (saveKey: string) => {
    setActiveSaveKey(saveKey);
    const saveStr = localStorage.getItem(saveKey);
    if (saveStr) {
      try {
        const parsed = JSON.parse(saveStr);
        setRawSaveJson(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setRawSaveJson(saveStr);
      }
    } else {
      setRawSaveJson('// Brak szczegółowych danych o stanie profilu.');
    }
  };

  // Save state editing inject
  const handleSaveJsonChange = () => {
    if (!activeSaveKey) {
      showAlert("Wybierz najpierw profil do zaktualizowania.", "error");
      return;
    }
    
    try {
      const parsed = JSON.parse(rawSaveJson);
      
      // Update local storage for active save state
      localStorage.setItem(activeSaveKey, JSON.stringify(parsed));
      
      // Check if we can also update the summary card in profile list
      const listStr = localStorage.getItem('abyss_monarch_profile_list');
      if (listStr) {
        const list = JSON.parse(listStr) as HunterProfile[];
        const index = list.findIndex(p => p.saveKey === activeSaveKey);
        if (index !== -1) {
          // Sync levels and names from save data if present
          if (parsed.player) {
            list[index].name = parsed.player.name || list[index].name;
            list[index].level = parsed.player.level || list[index].level;
          }
          if (parsed.world) {
            list[index].dayCount = parsed.world.dayCount || list[index].dayCount;
          }
          localStorage.setItem('abyss_monarch_profile_list', JSON.stringify(list));
        }
      }
      
      showAlert("Zapis gry został bezpośrednio zmodyfikowany w localStorage!", "success");
      syncSaves();
      reloadIframe();
    } catch (e: any) {
      showAlert(`Nieprawidłowy format JSON: ${e.message}`, "error");
    }
  };

  // Inject Booster Pack (unlocked start state)
  const injectDeveloperBoostPack = () => {
    try {
      const listStr = localStorage.getItem('abyss_monarch_profile_list') || '[]';
      const list = JSON.parse(listStr) as HunterProfile[];
      
      const boostId = `dev_boost_${Date.now()}`;
      const boostSaveKey = `abyss_monarch_save_${boostId}`;
      
      // Generate standard clean state with booster overrides
      const boosterState = {
        player: {
          name: "Sung Jin-Woo (BOOST)",
          gender: "male",
          avatar: "hunter_male_04", // Advanced Shadow Avatar
          talent: "shadow_monarch",
          level: 45,
          exp: 340,
          expNeeded: 5400,
          stats: {
            str: 120,
            dex: 95,
            vit: 110,
            int: 140,
            wis: 80,
            luk: 75
          },
          hp: 3500,
          mp: 1200,
          skills: [
            { id: "heavy_strike", level: 10, exp: 0, maxLevel: 10 },
            { id: "mana_shield", level: 10, exp: 0, maxLevel: 10 },
            { id: "poison_dart", level: 10, exp: 0, maxLevel: 10 },
            { id: "wind_slash", level: 10, exp: 0, maxLevel: 10 },
            { id: "fireball", level: 8, exp: 0, maxLevel: 10 }
          ],
          equippedSkills: ["heavy_strike", "mana_shield", "wind_slash"],
          equippedGear: {
            head: { name: "Hełm Władcy Cieni (S)", itemType: "head", rarity: "S", stats: { vit: 30 } },
            chest: { name: "Zbroja Czarnych Rycerzy (S)", itemType: "chest", rarity: "S", stats: { vit: 40, str: 10 } },
            pants: { name: "Nogawice Pustki (A)", itemType: "pants", rarity: "A", stats: { vit: 15 } },
            boots: { name: "Buty Szybkiego Kroku (S)", itemType: "boots", rarity: "S", stats: { dex: 25 } },
            weapon_l: { name: "Sztylet Kła Kasaki (S)", itemType: "weapon_l", rarity: "S", stats: { str: 45, dex: 15 } },
            weapon_r: null
          }
        },
        companions: {
          lilac: {
            id: 'lilac', name: 'Han Lilac', rank: 'A', baseClass: 'Assassin', currentClass: 'Assassin',
            level: 35, exp: 0, expNeeded: 2500, stats: { str: 45, dex: 68, vit: 32, int: 20, wis: 18, luk: 40 },
            skills: [{ id: 'quick_strike', level: 8, exp: 0, maxLevel: 10 }],
            equippedSkills: ['quick_strike'], equippedGear: {}, trust: 45, affection: 15, recruited: true
          },
          yu_na: {
            id: 'yu_na', name: 'Shin Yu-Na', rank: 'B', baseClass: 'Cleric', currentClass: 'Cleric',
            level: 32, exp: 0, expNeeded: 1800, stats: { str: 15, dex: 18, vit: 35, int: 50, wis: 65, luk: 25 },
            skills: [{ id: 'heal', level: 9, exp: 0, maxLevel: 10 }],
            equippedSkills: ['heal'], equippedGear: {}, trust: 50, affection: 20, recruited: true
          }
        },
        mercenaries: [
          { id: 'soldier_temp_1', name: 'Cień Żołnierza I', rank: 'B', role: 'Warrior', level: 25, price: 0, cost: 0, stats: { str: 40, dex: 30, vit: 45, int: 10 }, hired: true },
          { id: 'soldier_temp_2', name: 'Cień Żołnierza II', rank: 'B', role: 'Tank', level: 25, price: 0, cost: 0, stats: { str: 30, dex: 20, vit: 65, int: 10 }, hired: true }
        ],
        party: ['player', 'lilac', 'yu_na'],
        inventory: {
          gold: 250000,
          manaCrystals: 350,
          gifts: {
            lilac_flowers: 5,
            energy_drink: 10,
            macarons: 8,
            silver_ring: 2
          },
          gear: [
            { id: 'gear_drop_01', name: 'Sygnet Otchłani', itemType: 'ring_l1', rarity: 'S', stats: { wis: 15, int: 15 } },
            { id: 'gear_drop_02', name: 'Peleryna Wiatru', itemType: 'cape', rarity: 'A', stats: { dex: 12, luk: 8 } }
          ], 
          skillBooks: []
        },
        world: {
          currentTime: 12,
          dayCount: 14,
          unlockedGates: ['gate_e_01', 'gate_d_01', 'gate_c_01', 'gate_b_01'],
          currentGate: null,
          completedGates: ['gate_e_01'],
          activeQuest: {
            id: 'conquest_01',
            title: 'W pogoni za Cieniem',
            desc: 'Pokonaj bossa bramy rangi D zrekrutowaną i wyćwiczoną drużyną łowców.',
            type: 'conquest_d',
            progress: 1,
            target: 1
          }
        },
        prestige: {
          points: 15,
          totalEarned: 15,
          upgrades: {
            atk: 2,
            gold: 3,
            exp: 2,
            time: 1
          }
        }
      };

      // 1. Save profile state to localStorage
      localStorage.setItem(boostSaveKey, JSON.stringify(boosterState));
      
      // 2. Add to active profiles list
      const newProfile: HunterProfile = {
        id: boostId,
        saveKey: boostSaveKey,
        name: boosterState.player.name,
        level: boosterState.player.level,
        avatar: boosterState.player.avatar,
        talent: boosterState.player.talent,
        dayCount: boosterState.world.dayCount
      };
      
      list.push(newProfile);
      localStorage.setItem('abyss_monarch_profile_list', JSON.stringify(list));
      
      showAlert("Pomyślnie zaimplementowano Paczkę Deweloperską! Cienie zostały powołane.", "success");
      syncSaves();
      
      // Select the boosted profile
      setSelectedProfileId(boostId);
      loadSaveStateForJson(boostSaveKey);
      
      // Reload game iframe to update character list selection screen
      reloadIframe();
    } catch (e: any) {
      showAlert(`Wystąpił błąd podczas nadawania pakietu: ${e.message}`, "error");
    }
  };

  // Completely reset localStorage save entries for Abyss Monarch to start clean
  const resetAllSaveStates = () => {
    if (window.confirm("Czy na pewno chcesz skasować wszystkie testowe profile i zapisy lokalne tej gry z pamięci przeglądarki?")) {
      try {
        const listStr = localStorage.getItem('abyss_monarch_profile_list');
        if (listStr) {
          const list = JSON.parse(listStr) as HunterProfile[];
          list.forEach(p => {
            localStorage.removeItem(p.saveKey);
          });
        }
        localStorage.removeItem('abyss_monarch_profile_list');
        localStorage.removeItem('abyss_monarch_last_profile');
        
        showAlert("Wszystkie zapisy dla Abyss Monarch zostały całkowicie usunięte.", "info");
        syncSaves();
        reloadIframe();
      } catch (err: any) {
        showAlert(`Błąd czyszczenia pamięci: ${err.message}`, "error");
      }
    }
  };

  const reloadIframe = () => {
    setIframeKey(prev => prev + 1);
    showAlert("Ekran gry został przeładowany pomyślnie.", "success");
  };

  // Synchronize on load and when switching files
  useEffect(() => {
    syncSaves();
    // Fetch initial code file
    fetchFileSource(selectedFile);
  }, []);

  useEffect(() => {
    fetchFileSource(selectedFile);
  }, [selectedFile]);

  // Handle key listeners for iframe development integration if any
  const filteredCodeLines = () => {
    if (!fileContent) return [];
    const lines = fileContent.split('\n');
    if (!searchQuery) return lines;
    
    return lines; // In UI we will highlight match
  };

  const getSourceStats = () => {
    const linesCount = fileContent.split('\n').length;
    return {
      lines: linesCount,
      chars: fileContent.length
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Dynamic Alert Banner */}
      {statusMessage && (
        <div className={`text-center py-2 px-4 flex items-center justify-between text-xs transition duration-300 ${
          statusMessage.type === 'success' ? 'bg-emerald-950 border-b border-emerald-500/30 text-emerald-300' :
          statusMessage.type === 'error' ? 'bg-rose-950 border-b border-rose-500/30 text-rose-300' :
          'bg-slate-900 border-b border-blue-500/20 text-blue-300'
        }`} id="status-notification-banner">
          <div className="flex items-center gap-2 mx-auto">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Cyberpunk Top Control Panel Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4" id="applet-dev-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-950/20">
            <Flame className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-white uppercase font-mono">Abyss Monarch</h1>
              <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase">
                Solo Gamer Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">Pulpit deweloperski • Podgląd na żywo • Edytor Zapisów • Eksplorator Systemów</p>
          </div>
        </div>

        {/* Profiles HUD inside top Header */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Profile w systemie:</span>
            <span className="font-semibold text-indigo-300 font-mono">{profiles.length}</span>
          </div>

          <button 
            onClick={syncSaves}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white p-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5 text-xs font-medium"
            title="Odśwież zapisy z localStorage"
            id="refresh-meta-button"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Odśwież dane</span>
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-grid-container">
        
        {/* LEFT COLUMN: ACTIVE SCREEN / IFRAME CANVAS */}
        <section className={`${isFullscreenGame ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300`} id="game-frame-section">
          
          {/* Active Canvas Header Toolbar */}
          <div className="bg-slate-950/70 shrink-0 px-4 py-3 border-b border-slate-800 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">System Podglądu Gry (Iframe)</h2>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={reloadIframe}
                className="hover:bg-slate-800 p-1.5 rounded text-slate-400 hover:text-indigo-400 transition"
                title="Wymuś przeładowanie gry"
                id="iframe-reload"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsFullscreenGame(!isFullscreenGame)}
                className="bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 px-2 py-1 rounded text-xs transition flex items-center gap-1 font-mono border border-slate-700/50"
                id="toggle-fullscreen"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{isFullscreenGame ? "Minimalizuj" : "Tryb Pełny"}</span>
              </button>

              <a 
                href="/game/index.html" 
                target="_blank" 
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1 rounded transition flex items-center gap-1 shadow-md shadow-indigo-900/30"
                id="open-tab-link"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Nowa karta</span>
              </a>
            </div>
          </div>

          {/* Iframe content container */}
          <div className="flex-1 min-h-[580px] bg-slate-950 flex flex-col relative">
            <iframe 
              key={iframeKey}
              ref={iframeRef}
              src="/game/index.html"
              className="w-full flex-1 border-0 min-h-[580px] h-full"
              title="Abyss Monarch Game Inside Sandbox"
              allow="clipboard-read; clipboard-write; local-storage"
              id="abyss-monarch-game"
            />
          </div>

          {/* Controller Quick Info Footer */}
          <div className="bg-slate-950/40 px-4 py-2 text-[11px] text-slate-400 border-t border-slate-800/60 flex justify-between gap-2">
            <div>Gra korzysta z mechanizmu <code className="text-indigo-300 font-mono">window.localStorage</code> w domenie testowej.</div>
            <div>Wersja: 1.0.0 (Beta)</div>
          </div>
        </section>

        {/* RIGHT COLUMN: DEVELOPER TOOLS & CODE VIEWER */}
        {!isFullscreenGame && (
          <section className="lg:col-span-4 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl" id="dev-inspector-section">
            
            {/* Developer tabs select */}
            <div className="bg-slate-955 border-b border-slate-800 grid grid-cols-4 text-center text-xs font-mono">
              <button 
                onClick={() => setActiveTab('gra')}
                className={`py-3 transition border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'gra' ? 'border-amber-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                }`}
                id="tab-btn-gra"
              >
                <Play className="w-4 h-4 text-amber-500" />
                <span>Przegląd</span>
              </button>
              <button 
                onClick={() => setActiveTab('kod')}
                className={`py-3 transition border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'kod' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                }`}
                id="tab-btn-kod"
              >
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Kod źr.</span>
              </button>
              <button 
                onClick={() => setActiveTab('zapisy')}
                className={`py-3 transition border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'zapisy' ? 'border-emerald-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                }`}
                id="tab-btn-zapisy"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Zapisy</span>
              </button>
              <button 
                onClick={() => setActiveTab('analiza')}
                className={`py-3 transition border-b-2 flex flex-col items-center gap-1 ${
                  activeTab === 'analiza' ? 'border-sky-500 text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                }`}
                id="tab-btn-analiza"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Moduły</span>
              </button>
            </div>

            {/* Content box of Developer Panel */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[640px]" id="inspector-tab-content">
              
              {/* TAB 1: GENERAL INSTRUCTION & LOGS OVERVIEW */}
              {activeTab === 'gra' && (
                <div className="space-y-4 animate-fadeIn" id="overview-tab-content">
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5 mb-1.5 font-mono">
                      <Info className="w-4 h-4 shrink-0" />
                      Abyss Monarch Urban RPG
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Witaj w unikalnej grze idle z elementami strategii RPG, osadzonej we współczesnym, mrocznym świecie portali otchłani (Abyss Gates). System pozwala na rekrutację kompanów i najemników, fuzję potężnych skilli, zakupy w sklepach i wyprawy w bramy o zróżnicowanej randze.
                    </p>
                  </div>

                  {/* Active Profile Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Szybka Analiza Profili</h4>
                    {profiles.length === 0 ? (
                      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-center text-xs">
                        <AlertCircle className="w-8 h-8 mx-auto text-amber-500/50 mb-2" />
                        <p className="text-slate-400 mb-2">Brak utworzonych łowców w systemie lokalnym.</p>
                        <p className="text-[10px] text-slate-500 mb-3">Stwórz postać w kreatorze gry w oknie po lewej lub zaimplementuj paczkę deweloperską.</p>
                        <button 
                          onClick={injectDeveloperBoostPack}
                          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium py-1.5 px-3 rounded px-4 transition shadow"
                          id="empty-boost-btn"
                        >
                          Generuj Postać Dev (Boost)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {profiles.map(profile => (
                          <div 
                            key={profile.id}
                            onClick={() => {
                              setSelectedProfileId(profile.id);
                              loadSaveStateForJson(profile.saveKey);
                              setActiveTab('zapisy');
                            }}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                              selectedProfileId === profile.id 
                                ? 'bg-indigo-950/20 border-indigo-500/50 hover:bg-indigo-950/30' 
                                : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-slate-200 text-xs font-mono">{profile.name}</span>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                                Poziom {profile.level}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                              <div>Klasa/Talent: <strong className="text-slate-300 font-mono capitalize">{profile.talent.replace('_', ' ')}</strong></div>
                              <div>Czas (Dni): <strong className="text-slate-300 font-mono">{profile.dayCount}</strong></div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 pt-4 border-t border-slate-800/60 flex gap-2">
                          <button 
                            onClick={injectDeveloperBoostPack}
                            className="flex-1 bg-emerald-600/35 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/20 text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
                            id="booster-inject-card-btn"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Paczka Dev (LVL 45)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dev Tips */}
                  <div className="border border-slate-800 rounded-lg p-3 text-xs bg-slate-950/30 space-y-2 text-slate-300">
                    <h4 className="font-semibold text-slate-300 flex items-center gap-1 font-mono">
                      <Zap className="text-amber-400 w-3.5 h-3.5 fill-current" /> Wskazówki Deweloperskie:
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                      <li>Wykorzystaj <strong className="text-slate-200">Zapisy</strong>, aby dowolnie modyfikować kwoty złota, doświadczenie, odnowienia i ekwipunek postaci.</li>
                      <li>Kod gry jest w 100% transparentny — możesz podejrzeć jego funkcje w module <strong className="text-slate-200">Kod źr.</strong> i wyciągać formuły statystyk.</li>
                      <li>Gra posiada zaawansowany kreator, w którym parametry startowe wpływają na unikalne perki.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: CODE ENGINES INSPECTOR IN MONOSPACE VIEW */}
              {activeTab === 'kod' && (
                <div className="space-y-3 animate-fadeIn flex flex-col h-full" id="code-tab-content">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono block">Eksploruj moduł skryptów</label>
                    <select 
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 font-mono cursor-pointer"
                      id="source-code-file-select"
                    >
                      {gameFilesList.map(fileDef => (
                        <option key={fileDef.path} value={fileDef.path}>
                          {fileDef.path} ({fileDef.desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Code Search Filter */}
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Wyszukaj słowo w kodzie..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 font-mono"
                      id="code-search-input"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Code Block Container */}
                  <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 flex flex-col flex-1 h-[420px]">
                    
                    {/* Panel metadata actions */}
                    <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-400 font-mono shrink-0">
                      <span>Statystyki: {getSourceStats().lines} linii, {getSourceStats().chars} znaków</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(fileContent);
                          showAlert("Skopiowano zawartość pliku do schowka!", "success");
                        }}
                        className="hover:text-amber-400 flex items-center gap-1 font-semibold transition"
                        title="Copy to clipboard"
                        id="copy-code-button"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Kopiuj kod</span>
                      </button>
                    </div>

                    {/* Source contents scroll block */}
                    <div className="p-3 overflow-auto flex-1 font-mono text-xs select-text text-left leading-relaxed">
                      {loadingFile ? (
                        <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          <span className="text-[11px] font-mono">Pobieranie kodu w toku...</span>
                        </div>
                      ) : (
                        <pre className="text-indigo-200 whitespace-pre scrollbar-thin">
                          <code>
                            {filteredCodeLines().map((line, idx) => {
                              const lineNum = idx + 1;
                              const isMatch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
                              return (
                                <div 
                                  key={idx} 
                                  className={`flex ${isMatch ? 'bg-amber-950/20 text-amber-200 border-l px-1 border-amber-500' : ''}`}
                                >
                                  <span className="text-slate-600 inline-block w-8 text-right pr-2 select-none">{lineNum}</span>
                                  <span>{line}</span>
                                </div>
                              );
                            })}
                          </code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SAVE STATE PROFILE EDITING TOOLS */}
              {activeTab === 'zapisy' && (
                <div className="space-y-4 animate-fadeIn" id="savelist-tab-content">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono block">Wybierz Zapis Do Edycji</label>
                    {profiles.length === 0 ? (
                      <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-3 text-center text-xs text-slate-400">
                        Brak dostępnych profili w lokalnym storage przeglądarki. Kliknij "Generuj Postać Dev", aby rozpocząć grę natychmiast.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {profiles.map(p => (
                          <button
                            key={p.id}
                            onClick={() => loadSaveStateForJson(p.saveKey)}
                            className={`flex justify-between items-center p-2 rounded text-xs px-3 font-mono border text-left cursor-pointer transition ${
                              activeSaveKey === p.saveKey
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-semibold">{p.name} (LVL {p.level})</span>
                            <span className="text-[10px] text-slate-500 shrink-0">{p.id.substring(0, 13)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeSaveKey && (
                    <div className="space-y-2" id="json-editor-area">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono block">Modyfikator Stanu JSON</span>
                        
                        <div className="flex gap-2 text-[10px]">
                          <button 
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(rawSaveJson);
                                setRawSaveJson(JSON.stringify(parsed, null, 2));
                                showAlert("Sformatowano kod JSON pomyślnie.", "success");
                              } catch(e: any) {
                                showAlert(`Błąd formatowania: ${e.message}`, "error");
                              }
                            }}
                            className="text-indigo-400 hover:text-white font-mono"
                          >
                            [Formatuj]
                          </button>
                        </div>
                      </div>

                      <textarea 
                        value={rawSaveJson}
                        onChange={(e) => setRawSaveJson(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500/70 font-mono h-[300px] select-text border border-emerald-900/30"
                        placeholder="Wklej lub zredaguj tutaj master JSON gry..."
                        id="save-json-text-area"
                      />

                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveJsonChange}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold py-2 px-4 rounded transition uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 shadow"
                          id="save-json-submit"
                        >
                          <Database className="w-3.5 h-3.5 shrink-0" />
                          <span>Wdrażaj i Przeładuj</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Developer State actions */}
                  <div className="pt-4 border-t border-slate-800/60 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Narzędzia pamięci</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={injectDeveloperBoostPack}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1.5 font-mono text-[11px]"
                        id="generate-dev"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span>Paczka Dev</span>
                      </button>
                      
                      <button 
                        onClick={resetAllSaveStates}
                        className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1.5 font-mono text-[11px]"
                        id="clear-saves"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Wyczyść wszystko</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM DESIGN ANALYZER */}
              {activeTab === 'analiza' && (
                <div className="space-y-4 animate-fadeIn text-slate-300" id="analysis-tab-content">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Architektura Projektu</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Analiza systemów i modularnego podziału kodu w grze.</p>
                  </div>

                  <div className="space-y-2.5">
                    
                    {/* Core app loop breakdown */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono">
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/10">Engine</span>
                        <span>app.js & ui.js</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Koordynuje centralny cykl gry z interwałem 1 sekundy. Odpowiada za pasywną regenerację Punktów Życia i Many łowców na podstawie ich atrybutów oraz aktualizację wskaźników postępu HP, MP i doświadczenia (HUD). W tym miejscu odbywa się automatyczne zapisywanie gry co 30 sekund.
                      </p>
                    </div>

                    {/* Classes custom math formulas */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono">
                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/10">Math</span>
                        <span>classes.js</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Definiuje przyrosty statystyk pochodnych na podstawie parametrów głównych:
                        Fizyczny Atak bazuje na <strong className="text-slate-300 font-mono">STR</strong>, Magiczna Obrażenie oraz Max Mana na <strong className="text-slate-300 font-mono">INT / WIS</strong>, a uniki na paramatrze <strong className="text-slate-300 font-mono">DEX</strong>. Odpowiada za strukturę 22 slotów ekwipunku łowców.
                      </p>
                    </div>

                    {/* Dungeons & Combat Logic */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono">
                        <span className="bg-rose-500/10 text-rose-400 text-[10px] px-1.5 py-0.5 rounded border border-rose-500/10">Combat</span>
                        <span>dungeons.js</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Zapewnia logiczną symulację walki w trybie idle. Zbieranie drużyny, zarządzanie kolejnością ataków stron sojuszniczych i potworów w bramach oraz generowanie konsoli logów bojowych. Pilnuje przyrostów złota, kryształów many i losowych nagród rzadkości (D do S-Rank).
                      </p>
                    </div>

                    {/* Skills & Fusion recipe book */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/10">Fusion</span>
                        <span>skills.js & quests.js</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pojemnik na preperki i aktywności fuzji umiejętności. Połączenie dwóch całkowicie rozwiniętych skilli na maksymalny stopień (np. Kula Ognia i Pchnięcie Wiatru) pozwala odkryć i zintegrować potężne fuzje czarów takie jak <strong className="text-slate-200 font-mono">Ogniste Tornado</strong> o nadzwyczajnych parametrach.
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </section>
        )}

      </main>

      {/* Corporate Technical Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800/80 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2 shrink-0">
        <div>Wykryto poprawną strukturę repozytorium GitHub i wczytano do piaskownicy.</div>
        <div>Ukończono integrację platformową • Wersja 1.0.0 (PL)</div>
      </footer>
    </div>
  );
}
