
import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { GlassCard, Badge } from './Shared';
import { QuizQuestion, LeaderboardEntry } from '../types';

const MOCK_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: "Which pollutant is primarily emitted by cars?", options: ["Ozone", "Nitrogen Dioxide", "Sulfur Dioxide", "Lead"], correctAnswer: 1, explanation: "NO2 is a key traffic pollutant." },
  { id: 2, question: "What does AQI stand for?", options: ["Air Quantity Index", "Air Quality Indicator", "Air Quality Index", "Atmospheric Quality Index"], correctAnswer: 2, explanation: "Air Quality Index measures air pollution." },
  { id: 3, question: "PM2.5 particles are smaller than:", options: ["A grain of sand", "A human hair", "Red blood cell", "All of the above"], correctAnswer: 3, explanation: "PM2.5 is extremely microscopic." },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Sarah J.', score: 980, rank: 1, country: 'US', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Mike Chen', score: 850, rank: 2, country: 'SG', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'You', score: 720, rank: 3, country: 'IN', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Emma W.', score: 690, rank: 4, country: 'UK', avatar: 'https://i.pravatar.cc/150?u=4' },
];

const Quiz: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUIZ' | 'LEADERBOARD'>('QUIZ');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    if (index === MOCK_QUESTIONS[currentQ].correctAnswer) {
       setScore(s => s + 10);
    }
    
    setTimeout(() => {
       if (currentQ < MOCK_QUESTIONS.length - 1) {
          setCurrentQ(currentQ + 1);
          setSelectedOption(null);
       } else {
          setShowResult(true);
       }
    }, 1500);
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 h-full flex flex-col">
       <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('QUIZ')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'QUIZ' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400'}`}
          >
            Weekly Quiz
          </button>
          <button 
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'LEADERBOARD' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400'}`}
          >
            Leaderboard
          </button>
       </div>

       {activeTab === 'QUIZ' ? (
         showResult ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white mb-2">Quiz Complete!</h2>
              <p className="text-slate-400 mb-6">You scored {score} points</p>
              <button onClick={() => {setShowResult(false); setCurrentQ(0); setScore(0); setSelectedOption(null);}} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Try Again</button>
           </div>
         ) : (
           <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                 <span className="text-slate-400 text-sm">Question {currentQ + 1}/{MOCK_QUESTIONS.length}</span>
                 <Badge type="neutral"><Clock size={12} className="inline mr-1"/> 05:00</Badge>
              </div>

              <div className="mb-8">
                 <h2 className="text-xl font-bold text-white leading-relaxed">{MOCK_QUESTIONS[currentQ].question}</h2>
              </div>

              <div className="space-y-3">
                 {MOCK_QUESTIONS[currentQ].options.map((opt, idx) => (
                   <button
                     key={idx}
                     onClick={() => handleAnswer(idx)}
                     disabled={selectedOption !== null}
                     className={`w-full p-4 rounded-xl text-left border transition-all ${
                        selectedOption === idx 
                          ? idx === MOCK_QUESTIONS[currentQ].correctAnswer 
                             ? 'bg-green-500/20 border-green-500 text-green-300' 
                             : 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                     }`}
                   >
                     <div className="flex justify-between items-center">
                        <span>{opt}</span>
                        {selectedOption === idx && (
                           idx === MOCK_QUESTIONS[currentQ].correctAnswer ? <CheckCircle size={18}/> : <XCircle size={18}/>
                        )}
                     </div>
                   </button>
                 ))}
              </div>
           </div>
         )
       ) : (
         <div className="flex-1 overflow-y-auto space-y-3">
            {MOCK_LEADERBOARD.map((user) => (
               <GlassCard key={user.id} className="!p-4 flex items-center gap-4">
                  <span className={`font-black text-lg w-6 ${user.rank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>#{user.rank}</span>
                  <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-600" alt={user.name} />
                  <div className="flex-1">
                     <h4 className="font-bold text-white text-sm">{user.name}</h4>
                     <p className="text-[10px] text-slate-400">{user.country}</p>
                  </div>
                  <div className="text-right">
                     <span className="block font-bold text-cyan-400">{user.score}</span>
                     <span className="text-[9px] text-slate-500 uppercase">Points</span>
                  </div>
               </GlassCard>
            ))}
         </div>
       )}
    </div>
  );
};

export default Quiz;
