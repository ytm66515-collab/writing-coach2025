import React, { useState, useRef, useEffect } from 'react';
import { AppPhase, ExamPrompt, EssayState, ParagraphReview, PARAGRAPH_GUIDES } from './types';
import { generateExamPrompt, reviewParagraph } from './services/geminiService';
import { Spinner } from './components/Spinner';
import { BookOpen, PenTool, Clock, CheckCircle, ChevronRight, RefreshCw, Sparkles, X, Download, ArrowLeft, Key, Eye, EyeOff, Lock, Users, BrainCircuit, History, MessageSquareQuote } from 'lucide-react';

export default function App() {
  // Initialize phase to ACCESS_CONTROL to lock the app by default
  const [phase, setPhase] = useState<AppPhase>(AppPhase.ACCESS_CONTROL);
  const [promptData, setPromptData] = useState<ExamPrompt | null>(null);
  const [essayState, setEssayState] = useState<EssayState>({
    paragraphs: [],
    reviews: [],
    currentParagraphIndex: 0
  });
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // User Provided API Key State
  const [userApiKey, setUserApiKey] = useState("");
  const [tempApiKeyInput, setTempApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Access Control State
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Scroll to top on phase change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, essayState.currentParagraphIndex]);

  const checkPasscode = () => {
    // 這裡設定您的通行碼，目前設為 EMMA2025
    if (passcode.trim().toUpperCase() === 'EMMA2025') {
      setPhase(AppPhase.WELCOME);
      setPasscodeError("");
    } else {
      setPasscodeError("通行碼錯誤，請確認後再試");
    }
  };

  const startSession = async () => {
    // Check if we have an env key or a user provided key
    // Compatible with both Vite (import.meta.env) and standard process.env if polyfilled
    const envKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
    const effectiveKey = userApiKey || envKey;

    if (!effectiveKey) {
      setPhase(AppPhase.API_KEY_ENTRY);
      return;
    }

    await generatePrompt(effectiveKey);
  };

  const handleApiKeySubmit = async () => {
    if (!tempApiKeyInput.trim()) return;
    setUserApiKey(tempApiKeyInput);
    await generatePrompt(tempApiKeyInput);
  };

  const generatePrompt = async (key: string) => {
    setPhase(AppPhase.GENERATING_PROMPT);
    setIsLoading(true);
    // Pass key to service
    const data = await generateExamPrompt(key);
    setPromptData(data);
    setIsLoading(false);
    setPhase(AppPhase.READING_PROMPT);
  };

  const startWriting = () => {
    setPhase(AppPhase.WRITING);
  };

  const submitParagraph = async () => {
    if (!currentInput.trim() || !promptData) return;
    const envKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
    const effectiveKey = userApiKey || envKey;

    setIsLoading(true);
    const review = await reviewParagraph(
      essayState.currentParagraphIndex,
      currentInput,
      promptData,
      effectiveKey // Pass key
    );
    
    setEssayState(prev => ({
      ...prev,
      paragraphs: [...prev.paragraphs, currentInput],
      reviews: [...prev.reviews, review]
    }));
    
    setIsLoading(false);
    setCurrentInput("");
    setPhase(AppPhase.REVIEWING_PARAGRAPH);
  };

  const nextParagraph = () => {
    if (essayState.currentParagraphIndex < 4) {
      setEssayState(prev => ({
        ...prev,
        currentParagraphIndex: prev.currentParagraphIndex + 1
      }));
      setPhase(AppPhase.WRITING);
    } else {
      setPhase(AppPhase.COMPLETED);
    }
  };

  const downloadRecord = () => {
    if (!promptData) return;
    
    // 構建逐段分析的內容
    const detailedReviews = essayState.reviews.map((review, idx) => {
      return `
【${PARAGRAPH_GUIDES[idx].title}】
------------------------------------------------
● 您的原始草稿：
${review.original}

● 教練評析：
${review.critique}

● AI 優化版本：
${review.refined}
`;
    }).join('\n================================================\n');

    const content = `
【國寫長文實戰教練 - 練習紀錄】

題目：${promptData.title}
日期：${new Date().toLocaleDateString()}
------------------------------------------------
【閱讀材料】
${promptData.material}

【寫作引導】
${promptData.question}
------------------------------------------------

${detailedReviews}

================================================

【寫作反思總結】
${summary}

------------------------------------------------
由 國寫長文實戰教練 生成
`.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `國寫練習_${promptData.title}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    setPhase(AppPhase.WELCOME);
    setPromptData(null);
    setEssayState({
      paragraphs: [],
      reviews: [],
      currentParagraphIndex: 0
    });
    setCurrentInput("");
    setSummary("");
    setShowPrompt(false);
    setShowHistory(false);
    // Note: We keep the userApiKey so they don't have to re-enter it for the next session
  };

  // --- Render Functions ---

  const renderAccessControl = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-stone-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-stone-900 p-4 rounded-full shadow-md">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="serif text-2xl font-bold text-stone-900 mb-2">請輸入通行碼</h2>
        <p className="text-stone-500 mb-6 text-sm">此平台為試用版本，請輸入授權碼以開始練習</p>

        <div className="space-y-4">
          <div>
            <input 
              type="text" 
              className="w-full px-4 py-3 text-center bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition-all tracking-widest font-mono text-lg uppercase placeholder-stone-300"
              placeholder="CODE"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkPasscode()}
            />
            {passcodeError && <p className="text-red-500 text-xs mt-2">{passcodeError}</p>}
          </div>

          <button 
            onClick={checkPasscode}
            className="w-full py-3 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors shadow-md flex items-center justify-center gap-2"
          >
             解鎖進入 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-stone-100">
          <div className="flex items-center justify-center gap-2 mb-4 text-indigo-700 font-bold">
            <Users className="w-5 h-5" />
            <span>加入社群，免費領取通行碼</span>
          </div>
          
          <p className="text-sm text-stone-600 mb-4 leading-relaxed font-medium">
            為確保使用成效，請加入 LINE 群組<br/>獲得通行資格與作文指導
          </p>
          
          <div className="bg-white border-2 border-dashed border-stone-300 rounded-xl p-2 w-48 h-48 mx-auto flex items-center justify-center overflow-hidden group relative">
            {/* 
              NOTE: 
              這張圖片 src="/qrcode.jpg" 代表它會去讀取您 public 資料夾下的 qrcode.jpg。
              請確保您有將您的 LINE QR Code 圖片改名為 qrcode.jpg 並放在 public 資料夾中。
            */}
            <img 
              src="/qrcode.jpg" 
              alt="Line Group QR Code" 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback if image is not found
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.classList.add('bg-stone-100');
                  parent.innerHTML = '<div class="text-center p-4"><p class="text-stone-400 text-xs mb-2">請放置 qrcode.jpg</p><p class="text-stone-300 text-[10px]">至 public 資料夾</p></div>';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromptModal = () => {
    if (!showPrompt || !promptData) return null;
    return (
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setShowPrompt(false)}>
        <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-stone-100 px-6 py-4 flex justify-between items-center border-b border-stone-200 shrink-0">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-stone-600" />
              題目資訊
            </h3>
            <button onClick={() => setShowPrompt(false)} className="text-stone-500 hover:text-stone-800 p-1 rounded-full hover:bg-stone-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6 font-serif">
             <div>
                <h2 className="text-xl font-bold text-stone-900 mb-3">{promptData.title}</h2>
                <div className="bg-stone-50 p-5 rounded-lg border border-stone-200 text-stone-700 leading-loose whitespace-pre-wrap text-justify">
                  {promptData.material}
                </div>
             </div>
             <div className="space-y-3">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-900 mb-1">【寫作引導】</p>
                  <p className="text-indigo-950 leading-relaxed">{promptData.question}</p>
                </div>
                <div className="text-sm text-stone-500 italic flex items-start gap-2 p-2">
                  <Sparkles className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                  <span>提示：{promptData.guidance}</span>
                </div>
             </div>
          </div>
          <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end shrink-0">
             <button onClick={() => setShowPrompt(false)} className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors">
               回到寫作
             </button>
          </div>
        </div>
      </div>
    )
  }

  const renderHistoryModal = () => {
    if (!showHistory) return null;
    return (
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setShowHistory(false)}>
        <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-stone-100 px-6 py-4 flex justify-between items-center border-b border-stone-200 shrink-0">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <History className="w-5 h-5 text-stone-600" />
              寫作歷程回顧
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-stone-500 hover:text-stone-800 p-1 rounded-full hover:bg-stone-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto space-y-8 bg-stone-50">
            {essayState.reviews.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <PenTool className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p>目前尚未完成任何段落，請開始寫作。</p>
              </div>
            ) : (
              essayState.reviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 font-bold text-stone-700 text-sm">
                    {PARAGRAPH_GUIDES[idx].title}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                    {/* Original */}
                    <div className="p-5">
                      <div className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-wider flex items-center gap-1">
                        <PenTool className="w-3 h-3" /> 您的原文
                      </div>
                      <p className="text-stone-800 font-serif text-sm leading-loose whitespace-pre-wrap text-justify">
                        {review.original}
                      </p>
                    </div>
                    
                    {/* Review & Refined */}
                    <div className="flex flex-col">
                      {/* Critique */}
                      <div className="p-5 bg-amber-50/50 border-b border-amber-100/50">
                        <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquareQuote className="w-3 h-3" /> 教練評析
                        </div>
                        <p className="text-amber-900/90 text-sm leading-relaxed whitespace-pre-wrap">
                          {review.critique}
                        </p>
                      </div>
                      
                      {/* Refined */}
                      <div className="p-5 bg-indigo-50/30 flex-grow">
                        <div className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI 優化版
                        </div>
                        <p className="text-indigo-900 font-serif text-sm leading-loose whitespace-pre-wrap text-justify">
                          {review.refined}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-stone-100 bg-white flex justify-end shrink-0">
             <button onClick={() => setShowHistory(false)} className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors">
               關閉
             </button>
          </div>
        </div>
      </div>
    )
  }

  const renderApiKeyEntry = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-stone-50">
      <div className="w-full bg-white p-8 rounded-2xl shadow-xl border border-stone-200 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-full">
            <Key className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-stone-900 mb-3">輸入 API Key</h2>
        <p className="text-stone-500 mb-6 text-sm leading-relaxed">
          為了讓您與朋友能順利使用，請輸入您自己的 Google Gemini API Key。
          <br/><span className="text-xs text-stone-400">(Key 僅暫存於瀏覽器，不會上傳伺服器)</span>
        </p>

        <div className="relative mb-6">
          <input 
            type={showApiKey ? "text" : "password"}
            className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm"
            placeholder="AIzaSy..."
            value={tempApiKeyInput}
            onChange={(e) => setTempApiKeyInput(e.target.value)}
            autoFocus
          />
          <button 
            className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <button 
          onClick={handleApiKeySubmit}
          disabled={!tempApiKeyInput}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          確認並開始
        </button>

        <div className="mt-6 text-xs text-stone-400">
          還沒有 Key 嗎？ 
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">
            點此免費申請 Google AI Studio Key
          </a>
        </div>
      </div>
      <button onClick={() => setPhase(AppPhase.WELCOME)} className="mt-6 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> 返回首頁
      </button>
    </div>
  );

  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
      <div className="mb-8 p-6 bg-white rounded-full shadow-sm border border-stone-100">
        <PenTool className="w-12 h-12 text-stone-600" />
      </div>
      <h1 className="serif text-4xl font-bold text-stone-900 mb-4 tracking-wide">國寫長文實戰教練</h1>
      <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-2xl mx-auto">
        結合 Gemini AI 技術，模擬學測情境。從題目擬定、結構引導到即時修飾，
        陪伴你完成一篇兼具理性與感性的佳作。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10 text-sm text-stone-500">
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <Clock className="w-6 h-6 mb-2 text-amber-600" />
          <span className="font-medium text-stone-800">時間模擬</span>
          <span>建議作答時間 50 分鐘</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <BookOpen className="w-6 h-6 mb-2 text-emerald-600" />
          <span className="font-medium text-stone-800">擬真題目</span>
          <span>近三年考題趨勢分析</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <Sparkles className="w-6 h-6 mb-2 text-indigo-600" />
          <span className="font-medium text-stone-800">五段引導</span>
          <span>AI 即時潤飾與講評</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm">
          <BrainCircuit className="w-6 h-6 mb-2 text-rose-600" />
          <span className="font-medium text-stone-800">認知教學策略</span>
          <span>引導反思，內化學習成效</span>
        </div>
      </div>

      <button 
        onClick={startSession}
        className="px-8 py-4 bg-stone-900 text-stone-50 rounded-lg text-lg hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
      >
        開始練習 <ChevronRight className="w-5 h-5" />
      </button>

      <div className="mt-16 pt-8 border-t border-stone-100 w-full">
        <p className="text-stone-400 text-sm">
          由 <a 
            href="https://www.facebook.com/profile.php?id=61581627963135" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-stone-600 hover:text-indigo-600 font-medium transition-colors border-b border-stone-300 hover:border-indigo-600 pb-0.5"
          >
            愛瑪的生活實驗室
          </a> 與 AI 共同開發
        </p>
      </div>
    </div>
  );

  const renderPrompt = () => {
    if (!promptData) return null;
    return (
      <div className="min-h-screen bg-stone-50 p-6 md:p-12">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-stone-100">
          <div className="bg-stone-900 text-stone-50 px-8 py-4 flex justify-between items-center">
            <h2 className="font-bold tracking-widest">學科能力測驗模擬考卷</h2>
            <span className="text-stone-400 text-sm">國語文寫作能力測驗</span>
          </div>
          
          <div className="p-8 md:p-12 space-y-8">
            {/* Time Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800 text-sm flex items-start gap-3">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">時間分配提醒</p>
                <p>國寫測驗時間共 90 分鐘。本題為第二大題（情意題），建議作答時間約為 <span className="font-bold underline">50 分鐘</span>。</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b border-stone-200 pb-2">題目：{promptData.title}</h3>
              
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 font-serif leading-loose text-stone-800 whitespace-pre-wrap">
                {promptData.material}
              </div>
              
              <div className="space-y-2">
                <p className="font-bold text-stone-900">【寫作引導】</p>
                <p className="text-stone-700 leading-relaxed">{promptData.question}</p>
                <p className="text-sm text-stone-500 italic mt-2">提示：{promptData.guidance}</p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                onClick={startWriting}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                開始分段寫作
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWriting = () => {
    const guide = PARAGRAPH_GUIDES[essayState.currentParagraphIndex];
    
    return (
      <div className="min-h-screen bg-stone-50 p-4 md:p-8 flex flex-col items-center">
        <header className="w-full max-w-4xl flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <span className="text-sm font-mono text-stone-500">段落 {essayState.currentParagraphIndex + 1} / 5</span>
             <button 
                onClick={() => setShowPrompt(true)}
                className="text-sm flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full transition-all"
             >
                <BookOpen className="w-4 h-4" />
                查看題目
             </button>
             {essayState.reviews.length > 0 && (
                <button 
                  onClick={() => setShowHistory(true)}
                  className="text-sm flex items-center gap-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-full transition-all"
                >
                  <History className="w-4 h-4" />
                  回顧前文
                </button>
             )}
          </div>
          <span className="text-sm font-bold text-stone-900 hidden sm:inline truncate max-w-[200px]">{promptData?.title}</span>
        </header>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guide Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
              <div className="text-indigo-600 font-bold mb-2 text-sm tracking-wider">本段任務</div>
              <h3 className="text-xl font-serif font-bold text-stone-800 mb-3">{guide.title}</h3>
              <p className="text-stone-600 text-sm mb-4 leading-relaxed">{guide.desc}</p>
              <div className="bg-indigo-50 p-3 rounded-lg text-indigo-800 text-xs leading-relaxed">
                <strong>目標：</strong>{guide.goal}
              </div>
            </div>
            
            <div className="hidden md:block bg-stone-100 p-4 rounded-xl text-xs text-stone-500 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-bold text-stone-600">已完成段落</p>
                {essayState.reviews.length > 0 && (
                    <button onClick={() => setShowHistory(true)} className="text-indigo-600 hover:underline text-[10px]">
                        展開詳情
                    </button>
                )}
              </div>
              {essayState.reviews.map((review, idx) => (
                <div key={idx} 
                     className="pl-2 border-l-2 border-stone-300 cursor-pointer hover:bg-stone-200 p-1 rounded transition-colors"
                     onClick={() => setShowHistory(true)}
                >
                   <div className="font-bold text-stone-700 mb-0.5">第 {idx + 1} 段</div>
                   <div className="truncate">{review.refined.substring(0, 15)}...</div>
                </div>
              ))}
              {essayState.reviews.length === 0 && <p className="italic">尚無內容</p>}
            </div>
          </div>

          {/* Writing Area */}
          <div className="md:col-span-2 flex flex-col">
            <div className="bg-white p-1 rounded-xl shadow-lg border border-stone-200 flex-grow flex flex-col min-h-[400px]">
              <textarea
                className="w-full h-full p-6 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-stone-800 text-lg leading-loose font-serif placeholder-stone-300"
                placeholder="請在此輸入草稿...教練將會為你進行段落檢視。"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                disabled={isLoading}
              />
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-right text-stone-400 text-xs">
                 目前字數: {currentInput.length}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {isLoading ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-stone-200 rounded-lg text-stone-500 cursor-wait">
                  <Spinner />
                  <span>AI 教練正在分析...</span>
                </div>
              ) : (
                <button 
                  onClick={submitParagraph}
                  disabled={currentInput.length < 10}
                  className="px-8 py-3 bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                >
                  提交段落 <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    const review = essayState.reviews[essayState.currentParagraphIndex];
    
    return (
      <div className="min-h-screen bg-stone-50 p-4 md:p-8">
         <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3 text-stone-500">
                 <span className="bg-stone-200 text-xs px-2 py-1 rounded text-stone-600 font-mono">Step {essayState.currentParagraphIndex + 1}</span>
                 <span className="font-bold text-stone-800">段落檢視與修飾</span>
               </div>
               <div className="flex gap-2">
                  <button 
                      onClick={() => setShowPrompt(true)}
                      className="text-sm flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full transition-all"
                  >
                      <BookOpen className="w-4 h-4" />
                      查看題目
                  </button>
                  <button 
                    onClick={() => setShowHistory(true)}
                    className="text-sm flex items-center gap-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-full transition-all"
                  >
                    <History className="w-4 h-4" />
                    回顧前文
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Original & Critique */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                   <h3 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wider">您的草稿 ({review.wordCount}字)</h3>
                   <p className="text-stone-800 font-serif leading-loose whitespace-pre-wrap text-justify">
                     {review.original}
                   </p>
                </div>

                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                   <h3 className="flex items-center gap-2 text-amber-800 font-bold mb-3 text-sm">
                     <Sparkles className="w-4 h-4" /> 教練評析
                   </h3>
                   <p className="text-amber-900/80 text-sm leading-relaxed whitespace-pre-wrap">
                     {review.critique}
                   </p>
                </div>
              </div>

              {/* Right: Refined Version */}
              <div className="flex flex-col h-full space-y-6">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex-grow relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-bl-xl">
                     建議潤飾版
                   </div>
                   <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-wider">AI 優化與升級</h3>
                   <p className="text-indigo-950 font-serif text-lg leading-loose whitespace-pre-wrap text-justify">
                     {review.refined}
                   </p>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={nextParagraph}
                    className="w-full md:w-auto px-8 py-4 bg-stone-900 text-white rounded-lg hover:bg-stone-800 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    {essayState.currentParagraphIndex < 4 ? (
                      <>前往下一段 ({PARAGRAPH_GUIDES[essayState.currentParagraphIndex + 1].title.split('：')[0]}) <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>完成寫作，查看全文 <CheckCircle className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
         </div>
      </div>
    );
  };

  const renderCompleted = () => {
    return (
      <div className="min-h-screen bg-stone-100 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 mb-8">
            <h2 className="serif text-3xl font-bold text-stone-900">寫作練習完成</h2>
            <p className="text-stone-500">以下為您的原文與經 AI 教練潤飾後的完整版本</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="text-center font-bold text-stone-400 mb-6 border-b border-stone-100 pb-2">您的原始創作</h3>
              <article className="font-serif leading-loose text-stone-600 space-y-4 text-justify">
                 {essayState.paragraphs.map((p, i) => (
                   <p key={i}>{p}</p>
                 ))}
              </article>
            </div>

            {/* Refined */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 ring-4 ring-indigo-50/50">
              <h3 className="text-center font-bold text-indigo-600 mb-6 border-b border-indigo-50 pb-2">優化建議範文</h3>
              <h1 className="text-center font-serif text-2xl font-bold text-stone-900 mb-6">{promptData?.title}</h1>
              <article className="font-serif leading-loose text-stone-800 space-y-4 text-justify">
                 {essayState.reviews.map((r, i) => (
                   <p key={i}>{r.refined}</p>
                 ))}
              </article>
            </div>
          </div>

          {/* Reflection Section */}
          <div className="bg-stone-900 text-stone-50 rounded-2xl p-8 mt-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              寫作反思
            </h3>
            <p className="text-stone-300 mb-4 text-sm">請用 100 字以內總結本次的寫作收穫（例如：學會了如何運用轉折、發現自己對於意象描寫的不足等）。</p>
            
            {!summary ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-grow bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-stone-500"
                  placeholder="輸入您的總結..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSummary(e.currentTarget.value);
                  }}
                />
                <button 
                  className="bg-stone-700 hover:bg-stone-600 px-4 py-2 rounded-lg transition-colors"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    setSummary(input.value);
                  }}
                >
                  儲存
                </button>
              </div>
            ) : (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-stone-800 p-4 rounded-lg text-emerald-400 border border-emerald-900/50 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{summary}</span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 border-t border-stone-800 pt-6">
                    <button 
                       onClick={downloadRecord}
                       className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      下載本次練習紀錄
                    </button>
                    
                    <button 
                       onClick={resetApp}
                       className="w-full md:w-auto px-6 py-3 bg-stone-700 text-stone-200 rounded-lg hover:bg-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      結束並開始新練習
                    </button>
                  </div>
                  <p className="text-center text-stone-500 text-xs mt-2">請務必先下載紀錄後再離開</p>
               </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <>
      {renderPromptModal()}
      {renderHistoryModal()}
      {phase === AppPhase.ACCESS_CONTROL && renderAccessControl()}
      {phase === AppPhase.GENERATING_PROMPT && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-500">
          <Spinner />
          <p className="mt-4 animate-pulse">正在分析歷屆考題，生成模擬試卷...</p>
        </div>
      )}
      {phase === AppPhase.WELCOME && renderWelcome()}
      {phase === AppPhase.API_KEY_ENTRY && renderApiKeyEntry()}
      {phase === AppPhase.READING_PROMPT && renderPrompt()}
      {phase === AppPhase.WRITING && renderWriting()}
      {phase === AppPhase.REVIEWING_PARAGRAPH && renderReview()}
      {phase === AppPhase.COMPLETED && renderCompleted()}
    </>
  );
}