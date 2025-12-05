import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, Clock, RotateCcw, Play, HelpCircle, Brain, AlertTriangle } from 'lucide-react';
import { GlassCard } from './Shared';
import { QuizQuestion } from '../types';
import { useTheme } from '../providers/ThemeProvider';
import { saveQuizScore, auth } from '../services/firebase';

// ----------------------------------------------------------------------
// EXPANDED QUESTION POOL (20 Questions)
// ----------------------------------------------------------------------
const QUESTION_POOL: QuizQuestion[] = [
  { id: 1, question: "Which pollutant is primarily emitted by cars?", options: ["Ozone", "Nitrogen Dioxide", "Sulfur Dioxide", "Lead"], correctAnswer: 1, explanation: "NO2 is a key traffic pollutant emitted by internal combustion engines." },
  { id: 2, question: "What does AQI stand for?", options: ["Air Quantity Index", "Air Quality Indicator", "Air Quality Index", "Atmospheric Quality Index"], correctAnswer: 2, explanation: "The Air Quality Index is used to communicate how polluted the air currently is." },
  { id: 3, question: "PM2.5 particles are smaller than:", options: ["A grain of sand", "A human hair", "Red blood cell", "All of the above"], correctAnswer: 3, explanation: "PM2.5 particles are roughly 3% the diameter of a human hair." },
  { id: 4, question: "Which gas protects us from UV rays?", options: ["Carbon Dioxide", "Ozone", "Methane", "Nitrogen"], correctAnswer: 1, explanation: "Stratospheric Ozone absorbs harmful ultraviolet radiation from the sun." },
  { id: 5, question: "What is a main source of indoor pollution?", options: ["Cooking fumes", "Plants", "Open windows", "LED lights"], correctAnswer: 0, explanation: "Cooking, smoking, and candles are major sources of indoor particulate matter." },
  { id: 6, question: "Which of these is a greenhouse gas?", options: ["Oxygen", "Nitrogen", "Methane", "Argon"], correctAnswer: 2, explanation: "Methane (CH4) is a potent greenhouse gas that traps heat in the atmosphere." },
  { id: 7, question: "High AQI levels are most dangerous for:", options: ["Children", "Elderly", "People with asthma", "All of the above"], correctAnswer: 3, explanation: "Vulnerable groups with developing or compromised respiratory systems are at highest risk." },
  { id: 8, question: "Where is 'Good' ozone found?", options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], correctAnswer: 1, explanation: "Stratospheric ozone protects us; ground-level (Tropospheric) ozone is a harmful pollutant." },
  { id: 9, question: "Acid rain is primarily caused by:", options: ["CO2", "SO2 and NOx", "Methane", "CFCs"], correctAnswer: 1, explanation: "Sulfur dioxide and Nitrogen oxides react with water molecules in the air to form acid." },
  { id: 10, question: "What is the 'silent killer' gas?", options: ["Carbon Monoxide", "Carbon Dioxide", "Oxygen", "Nitrogen"], correctAnswer: 0, explanation: "Carbon Monoxide is odorless, colorless, and can be deadly in high concentrations." },
  { id: 11, question: "Lichens are good bio-indicators of:", options: ["Water pollution", "Soil pollution", "Air pollution", "Noise pollution"], correctAnswer: 2, explanation: "Lichens are very sensitive to sulfur dioxide and won't grow in polluted air." },
  { id: 12, question: "Which mask is recommended for PM2.5?", options: ["Cloth mask", "Surgical mask", "N95/N99", "Scarf"], correctAnswer: 2, explanation: "N95 respirators filter out at least 95% of airborne particles." },
  { id: 13, question: "Ground-level ozone is formed by:", options: ["Volcanoes", "Sunlight + NOx + VOCs", "Lightning", "Ocean spray"], correctAnswer: 1, explanation: "It is a secondary pollutant formed by chemical reactions in sunlight." },
  { id: 14, question: "The primary component of Earth's atmosphere is:", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correctAnswer: 2, explanation: "Nitrogen makes up about 78% of Earth's atmosphere." },
  { id: 15, question: "What does 'PM' stand for?", options: ["Pollution Matter", "Particulate Matter", "Pure Matter", "Particle Mass"], correctAnswer: 1, explanation: "Particulate Matter refers to microscopic solid or liquid matter suspended in the atmosphere." },
  { id: 16, question: "Which is a natural source of air pollution?", options: ["Cars", "Factories", "Volcanic Eruptions", "Power Plants"], correctAnswer: 2, explanation: "Volcanoes release ash, SO2, and CO2 naturally into the atmosphere." },
  { id: 17, question: "Smog is a combination of:", options: ["Smoke and Fog", "Snow and Fog", "Smoke and Gas", "Sand and Fog"], correctAnswer: 0, explanation: "The term is derived from Smoke + Fog, often exacerbated by vehicle emissions." },
  { id: 18, question: "AQI over 300 is considered:", options: ["Good", "Moderate", "Unhealthy", "Hazardous"], correctAnswer: 3, explanation: "Levels above 300 are hazardous and trigger health warnings of emergency conditions." },
  { id: 19, question: "Photosynthesis produces:", options: ["Carbon Dioxide", "Oxygen", "Methane", "Nitrogen"], correctAnswer: 1, explanation: "Plants absorb CO2 and release Oxygen as a byproduct." },
  { id: 20, question: "CFCs contribute to:", options: ["Ozone Depletion", "Acid Rain", "Smog", "Water Pollution"], correctAnswer: 0, explanation: "Chlorofluorocarbons break down ozone molecules in the stratosphere." },
];

const QUIZ_LENGTH = 20;
const TIMER_DURATION = 300; // 5 minutes

const Quiz: React.FC = () => {
  const [view, setView] = useState<'MENU' | 'ACTIVE' | 'RESULT'>('MENU');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION); 
  const [reason, setReason] = useState<'COMPLETE' | 'TIMEOUT'>('COMPLETE');
  
  const { isDark } = useTheme();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (view === 'ACTIVE' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endQuiz('TIMEOUT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const startNewQuiz = () => {
    const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, QUIZ_LENGTH));
    resetState();
    setView('ACTIVE');
  };

  const restartQuiz = () => {
    if (questions.length === 0) {
        startNewQuiz();
        return;
    }
    resetState();
    setView('ACTIVE');
  };

  const resetState = () => {
    setCurrentQ(0);
    setScore(0);
    setSelectedOption(null);
    setTimeLeft(TIMER_DURATION);
    setReason('COMPLETE');
  };

  const endQuiz = async (r: 'COMPLETE' | 'TIMEOUT') => {
    setReason(r);
    setView('RESULT');
    
    // Save to Firestore
    if (auth.currentUser) {
        // Calculate final score
        await saveQuizScore(auth.currentUser.uid, score, QUIZ_LENGTH * 10);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    
    // Update score immediately so it's ready if timer runs out
    let newScore = score;
    if (index === questions[currentQ].correctAnswer) {
       newScore += 10;
       setScore(newScore);
    }
    
    setTimeout(() => {
       if (currentQ < questions.length - 1) {
          setCurrentQ(currentQ + 1);
          setSelectedOption(null);
       } else {
          endQuiz('COMPLETE');
       }
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const highlightColor = isDark ? 'text-cyan-400' : 'text-cyan-600';

  if (view === 'MENU') {
    return (
        <div className="p-4 max-w-lg mx-auto h-full flex flex-col justify-center items-center pb-24">
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Brain size={48} className="text-cyan-500" />
            </div>
            <h1 className={`text-3xl font-black mb-2 ${textColor}`}>Eco Quiz</h1>
            <p className={`text-center mb-8 max-w-xs ${subTextColor}`}>Test your environmental knowledge. You have 5 minutes to complete {QUIZ_LENGTH} questions.</p>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={startNewQuiz}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                   <Play size={20} fill="currentColor" /> New Quiz
                </button>
                {questions.length > 0 && (
                    <button 
                      onClick={restartQuiz}
                      className={`w-full py-4 font-bold rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-2 ${isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                    >
                       <RotateCcw size={20} /> Restart Previous
                    </button>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 h-full flex flex-col font-sans">
       
       <div className={`flex items-center justify-between p-3 rounded-2xl mb-6 shadow-sm border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex gap-2">
            <button 
                onClick={restartQuiz} 
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}`}
            >
                <RotateCcw size={14} /> <span className="hidden sm:inline">Restart</span>
            </button>
            <button 
                onClick={startNewQuiz} 
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 bg-cyan-500 text-white hover:bg-cyan-400 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
            >
                <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">New</span>
            </button>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold border transition-colors ${
             timeLeft < 30 
               ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' 
               : isDark ? 'bg-slate-950 text-cyan-400 border-slate-800' : 'bg-slate-50 text-cyan-600 border-slate-200'
           }`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
          </div>
       </div>

       {view === 'RESULT' ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <div className="relative mb-8">
                {reason === 'TIMEOUT' ? (
                    <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <Clock size={48} className="text-orange-500" />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center animate-bounce">
                        <Trophy size={48} className="text-yellow-500" />
                    </div>
                )}
            </div>
            
            <h2 className={`text-4xl font-black mb-2 ${reason === 'TIMEOUT' ? 'text-red-500' : textColor}`}>
              {reason === 'TIMEOUT' ? "Time's Up!" : "Quiz Complete!"}
            </h2>
            <p className={`${subTextColor} mb-8 text-lg max-w-xs mx-auto`}>
              {reason === 'TIMEOUT' ? "You ran out of time." : `You answered ${score / 10} out of ${QUIZ_LENGTH} questions correctly.`}
            </p>
            
            <div className={`flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 mb-8 ${isDark ? 'bg-slate-800 border-cyan-500/30' : 'bg-white border-cyan-500/30 shadow-xl'}`}>
                <span className={`text-5xl font-black ${highlightColor}`}>{score}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Points</span>
            </div>
            
            <div className="flex gap-3 w-full max-w-xs">
                <button 
                  onClick={restartQuiz} 
                  className={`flex-1 py-4 rounded-xl font-bold border transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                >
                  Retry Same
                </button>
                <button 
                  onClick={startNewQuiz} 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  New Quiz
                </button>
            </div>
         </div>
       ) : (
         questions.length > 0 && (
           <div className="flex-1 animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-2">
                 <span className={`${subTextColor} text-xs font-bold uppercase tracking-wider`}>Question {currentQ + 1} / {questions.length}</span>
                 <div className="flex gap-1">
                    {questions.map((_, idx) => (
                        <div key={idx} className={`h-1.5 w-4 rounded-full transition-colors ${idx <= currentQ ? 'bg-cyan-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                    ))}
                 </div>
              </div>

              <GlassCard className="mb-6 min-h-[160px] flex items-center justify-center relative p-6">
                 <h2 className={`text-xl font-bold leading-relaxed text-center ${textColor}`}>{questions[currentQ].question}</h2>
                 <div className="absolute top-0 right-0 p-3 opacity-10">
                    <HelpCircle size={40} className={textColor} />
                 </div>
              </GlassCard>

              <div className="space-y-3">
                 {questions[currentQ].options.map((opt, idx) => {
                   const isSelected = selectedOption === idx;
                   const isCorrect = idx === questions[currentQ].correctAnswer;
                   const showCorrectness = selectedOption !== null;

                   let btnClass = isDark 
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm";
                   
                   if (showCorrectness) {
                       if (isCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-600 dark:text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                       else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-red-600 dark:text-red-400";
                       else btnClass = "opacity-50 grayscale";
                   }

                   return (
                     <button
                       key={idx}
                       onClick={() => handleAnswer(idx)}
                       disabled={selectedOption !== null}
                       className={`w-full p-4 rounded-xl text-left border transition-all transform active:scale-[0.99] flex justify-between items-center ${btnClass}`}
                     >
                        <span className="font-bold text-sm">{opt}</span>
                        {showCorrectness && (
                           isCorrect ? <CheckCircle size={20} className="text-green-500"/> : isSelected ? <XCircle size={20} className="text-red-500"/> : null
                        )}
                     </button>
                   );
                 })}
              </div>
              
              {selectedOption !== null && (
                  <div className={`mt-6 p-4 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2 border ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <div className="flex items-center gap-2 mb-1">
                          <Brain size={16} className="text-cyan-500" />
                          <span className="font-bold text-cyan-500">Did you know?</span>
                      </div>
                      {questions[currentQ].explanation}
                  </div>
              )}
           </div>
         )
       )}
    </div>
  );
};

export default Quiz;