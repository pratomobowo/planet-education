/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { celestials } from './data';
import { Planet, ChatMessage, QuizQuestion } from './types';
import Planet3DView from './components/Planet3DView';
import {
  Sparkles,
  BookOpen,
  Scale,
  MessageSquare,
  HelpCircle,
  Trophy,
  Compass,
  ArrowRight,
  Globe,
  Loader2,
  Send,
  RefreshCw,
  Info,
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Planet manakah yang memiliki hari terpanjang (rotasi terlambat), bahkan lebih lama dari waktu satu tahunnya (revolusi)?",
    options: ["Merkurius", "Venus", "Mars", "Pluto"],
    answerIndex: 1,
    explanation: "Venus berotasi sangat lambat pada porosnya (memerlukan 243 hari Bumi), sedangkan waktu revolusinya menggelilingi Matahari hanya 225 hari Bumi. Hal ini membuat satu harinya lebih lama dari satu tahunnya!"
  },
  {
    question: "Gunung berapi terbesar di seluruh Tata Surya bernama Olympus Mons terletak di planet mana?",
    options: ["Bumi", "Yupiter", "Mars", "Venus"],
    answerIndex: 2,
    explanation: "Olympus Mons terletak di planet Mars. Gunung berapi perisai raksasa ini memiliki tinggi sekitar 21.9 km (hampir 3 kali tinggi Gunung Everest) dan diameter selebar negara Prancis!"
  },
  {
    question: "Mengapa Uranus tampak unik bersinar dengan warna biru kehijauan yang khas?",
    options: ["Karena atmosfernya kaya akan gas metana", "Karena ada tumbuhan purba kosmik", "Karena pantulan langsung dari lautan air", "Karena atmosfernya kaya zat besi karat"],
    answerIndex: 0,
    explanation: "Uranus memiliki atmosfer yang didominasi hidrogen dan helium, dengan sejumlah kecil metana. Gas metana ini menyerap gelombang cahaya merah dari Matahari dan memantulkan kembali spektrum cahaya berwarna biru kehijauan."
  },
  {
    question: "Saturnus terkenal memiliki massa jenis (density) yang sangat rendah. Analogi ekstrem apa yang menggambarkan fakta ini?",
    options: ["Ukurannya bisa menyusut dalam sedetik", "Bisa terapung di atas permukaan kolam air raksasa", "Mudah hancur jika mendekati asteroid", "Memiliki tarikan gravitasi paling kuat"],
    answerIndex: 1,
    explanation: "Massa jenis Saturnus hanya sekitar 0.687 g/cm³, lebih kecil dari air (1.0 g/cm³). Jadi, jika ada samudra atau wadah air yang cukup besar untuk menampungnya, planet Saturnus yang megah ini akan benar-benar mengapung!"
  },
  {
    question: "Di planet manakah para ilmuwan memperkirakan terjadi badai hujan bongkahan kristal intan (diamond) di perut mantelnya?",
    options: ["Merkurius", "Bumi", "Yupiter", "Neptunus & Uranus"],
    answerIndex: 3,
    explanation: "Di bawah tekanan atmosfer ekstrem di Neptunus dan Uranus, atom karbon dari gas metana diperas dan terkristalisasi menjadi intan cair/padat yang menghujani mantel dalam planet raksasa es tersebut."
  },
  {
    question: "Matahari sebagai bintang pusat menyumbang berapa persen dari seluruh massa total yang ada di Sistem Tata Surya kita?",
    options: ["50.5%", "75.2%", "99.86%", "90.0%"],
    answerIndex: 2,
    explanation: "Matahari menyusun sekitar 99.86% dari massa keseluruhan materi di sistem tata surya kita. Sisa 0.14% sebagian besar dimiliki oleh Yupiter, disusul planet-planet lainnya."
  }
];

export default function App() {
  // Navigation tabs and selection states
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [currentTab, setCurrentTab] = useState<'profile' | 'structure' | 'comparison' | 'chat' | 'quiz'>('profile');
  
  // Realism vs Aesthetic scale setting
  const [scaleMode, setScaleMode] = useState<'aesthetic' | 'realistic'>('aesthetic');

  // AI space guide states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo Penjelajah Kosmik! Saya Astro-Guide 🌌. Saya siap menjawab pertanyaan apapun mengenai sistem tata surya, orbit planet, badai luar angkasa, hingga rahasia fusi nuklir Matahari kita. Pilih salah satu planet atau ketik langsung pertanyaan Anda!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Quiz States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Smooth scroll chat down
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Set default selection to Sun or Earth on start
  useEffect(() => {
    const earth = celestials.find(p => p.id === 'earth');
    if (earth) {
      setSelectedPlanet(earth);
    }
  }, []);

  // Handler to auto-scroll or change tab for specific planet details
  const selectPlanetHandler = (planet: Planet | null) => {
    setSelectedPlanet(planet);
    // If selecting a planet, make sure we go to physical metrics if in quiz so they can search data
    if (!planet) {
      // Clear or default to Earth or Sun
      const sun = celestials.find(p => p.id === 'sun');
      if (sun) setSelectedPlanet(sun);
    }
  };

  // Chat message sending
  const handleSendMessage = async (customText?: string) => {
    const queryText = (customText || chatInput).trim();
    if (!queryText) return;

    if (!customText) {
      setChatInput('');
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const chatContext = chatMessages.slice(-8); // pass context history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: chatContext,
          planetName: selectedPlanet?.id
        })
      });

      if (!response.ok) {
        throw new Error('Sinyal terganggu');
      }

      const data = await response.json();
      
      const aiReply: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiReply]);
    } catch (err) {
      // Offline fallback: Simulate a smart helper answer
      setTimeout(() => {
        let answer = 'Maaf, teleskop pemancar AI kami di bumi mengalami kegagalan sinyal satelit. ';
        const lowerQuery = queryText.toLowerCase();

        if (lowerQuery.includes('cincin') || lowerQuery.includes('saturn')) {
          answer += 'Mengenai Saturnus, cincin indahnya terbagi atas miliaran pertikel serpihan es purba murni berbalut silikat debu halus, membentang sejauh ribuan kilometer tetapi sangat tipis, hanya sekitar 10 - 20 meter tebal vertikalnya!';
        } else if (lowerQuery.includes('merah') || lowerQuery.includes('mars')) {
          answer += 'Mars tampak sangat merah menyala karena permukaannya dilapisi bubuk besi trioksida halus (biasa disebut karat besi hematit). Atmosfernya yang tipis tidak cukup hangat, menjadikannya planet gurun beku bersuhu rata-rata -62°C!';
        } else if (lowerQuery.includes('terbesar') || lowerQuery.includes('yupiter') || lowerQuery.includes('jupiter')) {
          answer += 'Yupiter adalah penguasa raksasa gas dengan massa 2.5 kali total seluruh planet digabungkan! Badas elips "Great Red Spot"-nya adalah badai siklon raksasa yang ukurannya bahkan muat untuk menelan 1.3 kali planet Bumi utuh!';
        } else if (lowerQuery.includes('fusi') || lowerQuery.includes('matahari') || lowerQuery.includes('bintang')) {
          answer += 'Matahari melakukan proses Fusi Nuklir hidrogen di pusat intinya dengan suhu ekstrem mencapai 15 Juta derajat Celcius, menghasilkan energi elektromagnetik murni yang menopang seluruh siklus hidup fotosintesis tanaman di Bumi.';
        } else if (lowerQuery.includes('kuis') || lowerQuery.includes('quiz')) {
          answer += 'Apakah Anda menantang pengetahuan Anda? Silakan buka tab Kuis Astronomi di panel kanan untuk menguji dan memenangkan trofi pengetahuan kosmik Anda!';
        } else {
          answer += `Materi "${queryText}" sangat menarik! Alam semesta terus memuai dengan kecepatan luar biasa. Untuk bahasan mendalam, silakan periksa parameter orbit atau pilih planet ${selectedPlanet?.nameIndo || 'Bumi'} di sidebar navigasi kami.`;
        }

        const fallbackReply: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: 'ai',
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, fallbackReply]);
      }, 900);
    } finally {
      setIsTyping(false);
    }
  };

  // Suggestion chips handler
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // Quiz evaluation
  const handleSelectAnswer = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedAnswerIdx(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIdx === null || hasSubmitted) return;
    setHasSubmitted(true);
    
    const isCorrect = selectedAnswerIdx === QUIZ_QUESTIONS[currentQuestionIdx].answerIndex;
    if (isCorrect) {
      setScore(prev => prev + 10);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswerIdx(null);
    setHasSubmitted(false);

    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setHasSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
  };

  return (
    <div id="cosmos-app-container" className="w-full min-h-screen bg-[#020208] text-white flex flex-col relative overflow-x-hidden font-sans">
      
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-900/25 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-[35%] right-[25%] w-[380px] h-[380px] bg-cyan-900/15 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Grid Pattern Overlay on background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)', 
             backgroundSize: '40px 40px' 
           }}
      ></div>

      {/* Top Header Navigation */}
      <nav className="h-16 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center">
            <Globe className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-md sm:text-lg font-bold tracking-tight uppercase leading-none">
              Cosmos <span className="text-indigo-400 font-extrabold">3D Simulator</span>
            </span>
            <span className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Edukasi Planetarium</span>
          </div>
        </div>
        
        <div className="hidden md:flex gap-6 text-xs font-semibold tracking-wide uppercase">
          <button 
            onClick={() => selectPlanetHandler(null)} 
            className={`transition-colors py-1 ${!selectedPlanet ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sistem Tata Surya
          </button>
          <button 
            onClick={() => selectPlanetHandler(celestials.find(p => p.id === 'earth') || null)} 
            className={`transition-colors py-1 ${selectedPlanet?.id === 'earth' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Stasiun Bumi
          </button>
          <button 
            onClick={() => selectPlanetHandler(celestials.find(p => p.id === 'mars') || null)} 
            className={`transition-colors py-1 ${selectedPlanet?.id === 'mars' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Kolonisasi Mars
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1 bg-white/10 rounded-full text-[10px] font-mono border border-white/10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">LIVE OBSERVATORY</span>
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <main id="main-workspace-grid" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 relative z-10 w-full max-w-[1700px] mx-auto">
        
        {/* LEFT COLUMN: Planetary Lineup List (lg:col-span-3) */}
        <section id="sidebar-planet-list" className="lg:col-span-3 flex flex-col gap-4">
          <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-full shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-3 border-b border-white/15 pb-2.5">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-indigo-300 font-extrabold flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Navigasi Selestial</span>
              </h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                {celestials.length} Anggota
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400/90 leading-relaxed mb-4">
              Pilih objek kosmik untuk mengonfigurasi kemera 3D dan memperdalam materi geologinya.
            </p>

            {/* Draggable-like Interactive Planet List Cards */}
            <div className="flex-grow space-y-2 max-h-[460px] lg:max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {celestials.map((body) => {
                const isSelected = selectedPlanet?.id === body.id;
                
                // Customize background dynamic style for listing cards
                let gradientBg = 'from-slate-700 to-slate-900';
                if (body.id === 'sun') gradientBg = 'from-amber-500 to-orange-600';
                else if (body.id === 'mercury') gradientBg = 'from-gray-400 to-slate-600';
                else if (body.id === 'venus') gradientBg = 'from-amber-600 to-yellow-800';
                else if (body.id === 'earth') gradientBg = 'from-cyan-500 to-blue-700';
                else if (body.id === 'mars') gradientBg = 'from-red-500 to-stone-800';
                else if (body.id === 'jupiter') gradientBg = 'from-amber-500 via-orange-500 to-amber-700';
                else if (body.id === 'saturn') gradientBg = 'from-yellow-400 via-yellow-600 to-yellow-800';
                else if (body.id === 'uranus') gradientBg = 'from-cyan-300 to-teal-600';
                else if (body.id === 'neptune') gradientBg = 'from-blue-500 to-indigo-900';
                else if (body.id === 'pluto') gradientBg = 'from-slate-400 to-stone-600';

                return (
                  <div
                    key={body.id}
                    onClick={() => selectPlanetHandler(body)}
                    className={`group p-2.5 rounded-xl cursor-pointer transition-all border duration-200 flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-900/10 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    {/* Planet Sphere icon representing size scale relative */}
                    <div className="relative flex-shrink-0 w-11 h-11 bg-slate-950/40 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientBg} shadow-inner group-hover:scale-110 transition-transform duration-300 relative`}>
                        {/* Saturn's miniature physical ring mock inside card icon */}
                        {body.id === 'saturn' && (
                          <div className="absolute top-[45%] left-[-6px] right-[-6px] h-1.5 bg-yellow-300/40 rounded-full border border-yellow-200/20 rotate-12" />
                        )}
                        {/* Sun's glow in miniature */}
                        {body.id === 'sun' && (
                          <div className="absolute inset-0 rounded-full bg-yellow-300 blur-[3px] opacity-70 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Meta data parameters */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-indigo-300' : 'text-slate-100'}`}>
                          {body.nameIndo}
                        </p>
                        <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300 capitalize">
                          {body.type === 'star' ? 'Bintang' : body.type === 'dwarf' ? 'Kerdil' : 'Planet'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        Jarak: {body.realDistance}
                      </p>
                    </div>

                    {/* Active pulse dot indicators */}
                    {isSelected && (
                      <div className="absolute right-3 top-[41%] w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#818cf8]" />
                    )}

                    {/* Decorative hover arrow indicator */}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all ml-auto" />
                  </div>
                );
              })}
            </div>

            {/* Scale Simulator widget */}
            <div className="mt-4 p-3 bg-indigo-900/10 rounded-xl border border-indigo-500/10">
              <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  GAYA GRAVITASI
                </span>
                <span className="text-slate-300 font-bold">{selectedPlanet?.gravity || 'Bumi'}</span>
              </div>
              <p className="text-[10px] text-slate-400/90 leading-tight italic">
                {selectedPlanet
                  ? `Menggerakkan objek di ${selectedPlanet.nameIndo} akan terasa seberat dengan percepatan gravitasi asli sekira ${selectedPlanet.gravity}.`
                  : 'Pilih planet untuk mengetes hukum fisika gravitasi dan tarikannya.'}
              </p>
            </div>
          </div>
        </section>

        {/* MIDDLE COLUMN: Drillable 3D Solar System View (lg:col-span-6) */}
        <section id="center-sim-display" className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 flex flex-col">
            <Planet3DView
              selectedPlanet={selectedPlanet}
              onSelectPlanet={setSelectedPlanet}
              scaleMode={scaleMode}
              setScaleMode={setScaleMode}
            />
          </div>

          {/* Quick Stats Banner card inside glass */}
          <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Tahukah Kamu? (Kosmis Fakta)</p>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-semibold max-w-[500px]">
                  {selectedPlanet?.funFact || "Matahari menyumbang 99.86% dari seluruh massa di sistem tata surya kita."}
                </p>
              </div>
            </div>
            
            {/* Quick interactive fact badge */}
            <div className="flex-shrink-0 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Satelit Alami: {selectedPlanet?.moons ?? 0}</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Tab Deck (Analytics, Interior, Compare, AI bot, Quiz) (lg:col-span-3) */}
        <section id="right-control-deck" className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            
            {/* Navigation Tabs of Control panel */}
            <div className="grid grid-cols-5 border-b border-white/10 bg-slate-950/40 p-1">
              {[
                { id: 'profile', icon: BookOpen, label: 'Info' },
                { id: 'structure', icon: Layers, label: 'Geo' },
                { id: 'comparison', icon: Scale, label: 'Skala' },
                { id: 'chat', icon: MessageSquare, label: 'Tanya' },
                { id: 'quiz', icon: HelpCircle, label: 'Kuis' }
              ].map((tab) => {
                const isCurrent = currentTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`py-2 px-1 flex flex-col items-center gap-1.5 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/30 text-white shadow font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={tab.label}
                  >
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className="text-[9px] tracking-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[500px] lg:max-h-[660px] scrollbar-thin">
              
              {/* TAB 1: PROFILE / PHYSICAL PARAMETERS */}
              {currentTab === 'profile' && selectedPlanet && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-xl font-bold tracking-tight text-white mb-0.5">
                        {selectedPlanet.nameIndo}
                      </h4>
                      <span className="text-[10px] font-mono font-semibold opacity-60">
                        {selectedPlanet.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {selectedPlanet.deskripsi}
                    </p>
                  </div>

                  <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-400">
                    Telemetri Parameter Fisik
                  </h5>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Jarak Terjauh', val: selectedPlanet.realDistance },
                      { label: 'Radius Planet', val: selectedPlanet.realRadius },
                      { label: 'Suhu Rata-rata', val: selectedPlanet.realTemp },
                      { label: 'Gaya Gravitasi', val: selectedPlanet.gravity },
                      { label: 'Waktu Rotasi (Hari)', val: selectedPlanet.rotation },
                      { label: 'Waktu Revolusi (Tahun)', val: selectedPlanet.revolution },
                      { label: 'Proporsi Massa', val: selectedPlanet.mass }
                    ].map((stat, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2 rounded-lg text-xs hover:bg-white/[0.05] transition-colors">
                        <span className="opacity-65 text-[11px]">{stat.label}</span>
                        <span className="font-mono font-bold text-slate-200 text-right text-[11px]">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Moons panel showing moon index */}
                  <div className="pt-3">
                    <h5 className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-400 mb-2">
                      Satelit Alam Utama ({selectedPlanet.moons})
                    </h5>
                    {selectedPlanet.moonsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPlanet.moonsList.map((moon, index) => (
                          <span
                            key={index}
                            className="bg-indigo-950/60 border border-indigo-800/40 text-[10px] text-indigo-300 font-semibold px-2.5 py-1 rounded-full hover:bg-indigo-900/40 transition-colors"
                          >
                            🌙 {moon}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Objek ini tidak memiliki satelit alami.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GEOLOGY & STRUCTURE */}
              {currentTab === 'structure' && selectedPlanet && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5 uppercase">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Struktur Geofisika</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Penampang batuan dan susunan selimut dari {selectedPlanet.nameIndo}.
                    </p>
                  </div>

                  {/* Structure blocks showing dynamic geological data */}
                  <div className="space-y-3">
                    {[
                      { icon: '🔴', label: 'Inti Planet', text: selectedPlanet.structure.core },
                      { icon: '🟠', label: 'Mantel Batuan', text: selectedPlanet.structure.mantle },
                      { icon: '🟡', label: 'Kerak Luar', text: selectedPlanet.structure.crust },
                      { icon: '🔵', label: 'Atmosfer Kosmik', text: selectedPlanet.structure.atmosphere }
                    ].map((section, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm">{section.icon}</span>
                          <span className="text-xs font-bold text-indigo-300">{section.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: COSMIC SCALE COMPARISON */}
              {currentTab === 'comparison' && selectedPlanet && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5 uppercase">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span>Visual Perbandingan Ukuran</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Perbandingan relatif skala ukuran {selectedPlanet.nameIndo} berdampingan dengan Bumi.
                    </p>
                  </div>

                  {/* Render Visual spheres representing chosen body side by side with planet Earth */}
                  <div className="py-6 flex flex-col items-center justify-center rounded-xl bg-slate-950/80 border border-white/5 relative overflow-hidden">
                    
                    {/* Radial grid inside scale box */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="flex items-center justify-center gap-10 relative z-10 w-full px-4">
                      {/* Left: Chosen planet sphere with proportional visual diameter layout */}
                      <div className="flex flex-col items-center gap-3 w-1/2">
                        <p className="text-[10px] font-semibold text-indigo-300 uppercase truncate max-w-full">
                          {selectedPlanet.nameIndo}
                        </p>
                        
                        <div className="h-28 flex items-center justify-center w-full">
                          <div 
                            className="rounded-full shadow-lg relative flex items-center justify-center"
                            style={{
                              width: selectedPlanet.id === 'sun' ? '100px' : selectedPlanet.id === 'jupiter' ? '85px' : selectedPlanet.id === 'saturn' ? '75px' : selectedPlanet.id === 'earth' ? '40px' : selectedPlanet.id === 'venus' ? '38px' : selectedPlanet.id === 'mars' ? '25px' : selectedPlanet.id === 'mercury' ? '18px' : '15px',
                              height: selectedPlanet.id === 'sun' ? '100px' : selectedPlanet.id === 'jupiter' ? '85px' : selectedPlanet.id === 'saturn' ? '75px' : selectedPlanet.id === 'earth' ? '40px' : selectedPlanet.id === 'venus' ? '38px' : selectedPlanet.id === 'mars' ? '25px' : selectedPlanet.id === 'mercury' ? '18px' : '15px',
                              backgroundColor: selectedPlanet.color,
                              boxShadow: `0 0 25px ${selectedPlanet.glowColor}`,
                              border: `2px solid ${selectedPlanet.borderColor}`
                            }}
                          >
                            <span className="text-[9px] text-black font-extrabold select-none opacity-40">Objek</span>
                            {/* Proportional visual ring representation */}
                            {selectedPlanet.id === 'saturn' && (
                              <div className="absolute top-[48%] left-[-22px] right-[-22px] h-3 bg-yellow-400/40 rounded-full rotate-12 border border-yellow-200/20" />
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] font-mono text-slate-400">
                          {selectedPlanet.realRadius}
                        </p>
                      </div>

                      {/* Right: Globe of Earth strictly constant */}
                      <div className="flex flex-col items-center gap-3 w-1/2 border-l border-white/10 pl-6">
                        <p className="text-[10px] font-semibold text-blue-300 uppercase">
                          Bumi (Konstan)
                        </p>

                        <div className="h-28 flex items-center justify-center w-full">
                          <div 
                            className="rounded-full shadow-lg flex items-center justify-center bg-[#3b82f6] border border-[#1d4ed8]"
                            style={{
                              width: '40px',
                              height: '40px',
                              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                            }}
                          >
                            <span className="text-[10px] text-white font-extrabold opacity-60">1x</span>
                          </div>
                        </div>

                        <p className="text-[10px] font-mono text-slate-400">
                          6,371 km
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 px-3 w-full text-center border-t border-white/5 pt-3">
                      <p className="text-[11px] text-slate-400/95 leading-normal">
                        {selectedPlanet.id === 'sun' 
                          ? 'Matahari sangat raksasa! Sekitar 1.3 juta planet Bumi bisa masuk muat di dalam ruang volumenya.' 
                          : selectedPlanet.id === 'earth' 
                          ? 'Bumi diatur sebagai satuan standar pembanding satu kuantitas skala.'
                          : `Massa ${selectedPlanet.nameIndo} setara dengan sekitar ${selectedPlanet.mass} dari total massa Bumi.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AI ASTRO-GUIDE CHAT BOT */}
              {currentTab === 'chat' && (
                <div className="flex flex-col h-full space-y-3">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5 uppercase">
                      <MessageSquare className="w-4 h-4 text-indigo-400 animate-bounce" />
                      <span>Virtual Astronomer AI</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tanyakan apa saja ke Astro-Guide seputar rahasia fisika mekanika tata surya.
                    </p>
                  </div>

                  {/* Message logging window */}
                  <div className="h-[210px] lg:h-[300px] rounded-xl bg-slate-950/70 border border-white/5 p-3 overflow-y-auto space-y-3 flex flex-col scrollbar-thin">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <span className="text-[9px] text-slate-500 font-mono mb-0.5 px-1">{msg.sender === 'user' ? 'Anda' : 'Astro-Guide'} ({msg.timestamp})</span>
                        <div
                          className={`p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow'
                              : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-none backdrop-blur-md'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="self-start flex items-center gap-2 text-[10px] text-slate-400 p-1 bg-white/5 rounded-lg border border-white/5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Menganalisis teleskop kosmis...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Fast trigger suggestion chips */}
                  <div className="py-1">
                    <p className="text-[9px] font-semibold text-indigo-400 tracking-wide uppercase mb-1.5">Topik Diskusi Cepat:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-0.5 scrollbar-none">
                      {[
                        `Bahas Gunung Mars?`,
                        `Apa itu Hujan Intan?`,
                        `Suhu fusi Matahari?`,
                        `Bandingkan Bumi & Jupiter`,
                        `Mengapa Venus sangat panas?`
                      ].map((chipText, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickQuestion(chipText)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-[9.5px] rounded-md px-2 py-0.5 text-slate-300 transition-colors truncate"
                          disabled={isTyping}
                        >
                          🔍 {chipText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input form */}
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="Tanya rotasi, fusi, komet..."
                      className="flex-1 bg-slate-900/90 border border-white/10 text-xs rounded-xl px-3 outline-none focus:border-indigo-400 transition-colors text-white"
                      disabled={isTyping}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      disabled={isTyping}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: ASTRONOMY KNOWLEDGE QUIZ */}
              {currentTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5 uppercase">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>Kuis Pengetahuan</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Uji pemahaman Anda tentang ruang kosmik.</p>
                    </div>
                    
                    {/* Scores system */}
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-slate-500">CORRECT SCORE</p>
                      <p className="text-xs font-bold font-mono text-yellow-400">{score} Poin</p>
                    </div>
                  </div>

                  {/* Quiz body conditional view */}
                  {!quizCompleted ? (
                    <div className="space-y-4">
                      {/* Question Tracker meter */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 bg-white/[0.02] p-2 border border-white/5 rounded-lg">
                        <span>Soal {currentQuestionIdx + 1} dari {QUIZ_QUESTIONS.length}</span>
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-300" 
                            style={{ width: `${((currentQuestionIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Actual rich question card */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 shadow">
                        <p className="text-xs font-bold leading-relaxed text-slate-100 italic">
                          "{QUIZ_QUESTIONS[currentQuestionIdx].question}"
                        </p>
                      </div>

                      {/* Multiple choice loops */}
                      <div className="space-y-2">
                        {QUIZ_QUESTIONS[currentQuestionIdx].options.map((opt, optionIdx) => {
                          const isSelected = selectedAnswerIdx === optionIdx;
                          let optStyle = 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300';
                          
                          if (hasSubmitted) {
                            const isCorrectAnswer = optionIdx === QUIZ_QUESTIONS[currentQuestionIdx].answerIndex;
                            if (isCorrectAnswer) {
                              optStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
                            } else if (isSelected) {
                              optStyle = 'bg-rose-500/20 border-rose-400 text-rose-300';
                            } else {
                              optStyle = 'bg-white/5 border-white/5 opacity-40 text-slate-400';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-indigo-600/35 border-indigo-400 text-indigo-300 font-bold';
                          }

                          return (
                            <button
                              key={optionIdx}
                              onClick={() => handleSelectAnswer(optionIdx)}
                              className={`w-full py-2.5 px-3 text-left rounded-xl text-[11px] border transition-all flex items-center justify-between ${optStyle}`}
                              disabled={hasSubmitted}
                            >
                              <span>{opt}</span>
                              {hasSubmitted && optionIdx === QUIZ_QUESTIONS[currentQuestionIdx].answerIndex && (
                                <span className="text-[10px] font-bold text-emerald-400">BENAR ✓</span>
                              )}
                              {hasSubmitted && isSelected && optionIdx !== QUIZ_QUESTIONS[currentQuestionIdx].answerIndex && (
                                <span className="text-[10px] font-bold text-rose-400">SALAH ✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation or validation button */}
                      {!hasSubmitted ? (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={selectedAnswerIdx === null}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white shadow shadow-indigo-900/65 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Evaluasi Jawaban
                        </button>
                      ) : (
                        <div className="space-y-3.5 pt-1.5">
                          {/* Rich academic explanation explanation box */}
                          <div className="p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
                            <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              <span>Catatan Pengetahuan</span>
                            </h5>
                            <p className="text-[10.5px] leading-relaxed text-slate-300 italic">
                              {QUIZ_QUESTIONS[currentQuestionIdx].explanation}
                            </p>
                          </div>

                          <button
                            onClick={handleNextQuestion}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white shadow shadow-indigo-900/65 flex items-center justify-center gap-1.5"
                          >
                            <span>
                              {currentQuestionIdx === QUIZ_QUESTIONS.length - 1 ? 'Selesaikan Kuis' : 'Soal Berikutnya'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Quiz Result State view
                    <div className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h4 className="text-md font-bold text-white uppercase tracking-wider">Misi Kuis Selesai!</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Anda berhasil menjelajahi semua pertanyaan kuis dan membebaskan teka-teki ilmiah.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 max-w-[200px] mx-auto text-center">
                        <p className="text-[10px] text-slate-400 uppercase">AKUMULASI SKOR KOSMOS</p>
                        <p className="text-3xl font-mono text-yellow-400 font-extrabold mt-1">{score} <span className="text-xs font-semibold text-slate-300">/ 60</span></p>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-normal italic px-2">
                        {score >= 50 
                          ? 'Gelar Kehormatan: "Asisten Astronom Senior"! Anda benar-benar menguasai peta tatanan planet.' 
                          : score >= 30 
                          ? 'Gelar Kehormatan: "Taruna Penerbang Kehormatan"! Teruslah mendalami materi fisik planet dan saksikan modelnya.'
                          : 'Gelar Kehormatan: "Kadet Pengamat Amatir". Ayo pelajari lagi parameter geologi planet di sidebar kemudian ulangi!'
                        }
                      </p>

                      <button
                        onClick={handleRestartQuiz}
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 hover:text-white transition-all text-xs font-bold text-slate-300 border border-white/15 flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        <span>Mulai Ulang Kuis</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>

      </main>

      {/* Bottom Telemetry Ops Console Bar */}
      <footer className="h-12 bg-white/5 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center px-6 justify-between gap-2 text-slate-400 z-20">
        <div className="flex gap-4 sm:gap-6 mt-1 sm:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-ping"></div>
            <span className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-400">3D ENGINE: ONLINE</span>
          </div>
          <div className="text-[9.5px] uppercase font-semibold tracking-widest text-slate-500 hidden sm:block">
            STABILIZER FPS: <span className="text-slate-300">60.0 hz</span>
          </div>
        </div>
        
        <div className="text-[9.5px] font-mono tracking-widest text-slate-400 text-center sm:text-right pb-1.5 sm:pb-0">
          DIREKTORI GALAKTIS SEKTOR {selectedPlanet?.id ? selectedPlanet.id.toUpperCase() : 'MAIN'}: <span className="text-indigo-300">
            {selectedPlanet ? `${selectedPlanet.radius * 7}.43 / ${selectedPlanet.distance * 2}.110 / 0.15` : '244.32 / -0.21 / 1.5'}
          </span>
        </div>
      </footer>
    </div>
  );
}

