
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { chatWithAeroBot } from '../services/ai';
import { ChatMessage } from '../types';

const AeroBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am AeroBot. Ask me about air quality, weather, or health tips.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await chatWithAeroBot(messages, input);
    
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-24 pt-4 px-2">
       <div className="flex-1 overflow-y-auto space-y-4 px-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] p-4 rounded-2xl ${
                 msg.role === 'user' 
                   ? 'bg-cyan-600 text-white rounded-tr-none' 
                   : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
               }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-50">
                     {msg.role === 'model' ? <Bot size={12}/> : <UserIcon size={12}/>}
                     <span className="text-[10px] uppercase">{msg.role === 'model' ? 'AeroBot' : 'You'}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
               </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={endRef} />
       </div>

       <div className="p-2 mt-2">
          <div className="relative">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask about pollution..."
               className="w-full bg-slate-800 border border-slate-700 rounded-full py-4 pl-6 pr-14 text-white focus:outline-none focus:border-cyan-500 shadow-lg"
             />
             <button 
               onClick={handleSend}
               disabled={loading || !input.trim()}
               className="absolute right-2 top-2 p-2 bg-cyan-500 rounded-full text-slate-900 hover:bg-cyan-400 disabled:opacity-50 transition-all"
             >
               <Send size={20} />
             </button>
          </div>
       </div>
    </div>
  );
};

export default AeroBot;
