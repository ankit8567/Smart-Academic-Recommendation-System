import React, { useState, useRef, useEffect } from 'react';
import {
  StudentProfile,
  Subject,
} from '../types/academic';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface OpheliaChatbotProps {
  profile: StudentProfile;
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ophelia';
  text: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'What should I prioritize this week for my career goal?',
  'Why was my DBMS score flagged as a weak area?',
  'How do I bridge the gap to become an AI/ML Engineer?',
  'Which prerequisite should I complete first?',
];

export const OpheliaChatbot: React.FC<OpheliaChatbotProps> = ({
  profile,
  subjects,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'ophelia',
      text: `Hello ${profile.name || 'there'}! I'm **Ophelia**, your Gemini-powered Academic Advisor.\n\nI have full visibility into your **${profile.program}** coursework, your **${profile.cgpa.toFixed(2)} CGPA**, and your target **${profile.careerGoal}** goal.\n\nHow can I help you optimize your study roadmap or course choices today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setApiError(null);

    // Prepare context for Ophelia
    const weakSubjects = profile.completedSubjects
      .filter((c) => c.marks < 70)
      .map((c) => {
        const s = subjects.find((sub) => sub.id === c.subjectId);
        return s ? `${s.code} (${c.marks}%)` : '';
      })
      .filter(Boolean);

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: m.text,
      }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          context: {
            studentName: profile.name,
            program: profile.program,
            branch: profile.branch,
            semester: profile.semester,
            cgpa: profile.cgpa,
            careerGoal: profile.careerGoal,
            learningStyle: profile.learningStyle,
            weakAreas: weakSubjects,
            topRecommendations: subjects
              .filter((s) => (s.careerRelevance[profile.careerGoal] || 0) >= 80)
              .map((s) => `${s.code} (${s.name})`),
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to get response from Ophelia`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `ophelia-${Date.now()}`,
        sender: 'ophelia',
        text: data.reply || "I'm sorry, I couldn't generate advice right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setApiError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ophelia',
        text: `Fresh session started! Ask me anything about your academic plan, syllabus difficulty, or preparing for ${profile.careerGoal}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setApiError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
        isExpanded
          ? 'inset-4 md:inset-10 rounded-2xl'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl'
      }`}
    >
      {/* Ophelia Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ophelia
              </span>
              <span className="text-[10px] font-mono font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personalized Academic & Career Advisor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            aria-label="Reset conversation"
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors hidden sm:block"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Ophelia"
            aria-label="Close Ophelia"
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div
                  className={`text-[10px] mt-1 font-mono tabular-nums ${
                    isUser ? 'text-sky-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs flex items-center gap-1.5">
              <span>Ophelia is formulating personalized academic advice...</span>
            </div>
          </div>
        )}

        {apiError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Advisor Service Alert</div>
              <div>{apiError}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Ophelia about ${profile.careerGoal}, prerequisites, study hours...`}
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center"
          title="Send message to Ophelia"
          aria-label="Send message to Ophelia"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
