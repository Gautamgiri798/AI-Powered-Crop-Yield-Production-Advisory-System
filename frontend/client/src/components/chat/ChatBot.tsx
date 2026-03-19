import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { askCropQuestion, clearConversationHistory } from '@/lib/gemini';
import { MessageCircle, X, Mic, Send, Bot, User, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatBot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    setTranscript,
    language,
    setLanguage,
  } = useVoiceRecording();

  // welcome message only when opening first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: t('chat_greeting'),
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (transcript && !isRecording) {
      setInputMessage(transcript);
      setTranscript('');
    }
  }, [transcript, isRecording, setTranscript]);

  // always scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isOpen]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await askCropQuestion(message, language);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorText = error?.message || "I'm having trouble connecting right now. Please try again later.";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(inputMessage);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    t('quick_crop_health'),
    t('quick_fertilizer'),
    t('quick_weather'),
  ];

  const handleClearHistory = async () => {
    try {
      await clearConversationHistory();
      setMessages([{
        id: '1',
        text: t('chat_greeting'),
        isUser: false,
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <>
      {/* Toggle Button (Fixed on Desktop & Mobile) */}
      <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none md:hidden' : 'opacity-100 scale-100'}`}>
        <div className="relative group">
            {/* Glow effect behind button */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <Button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 flex items-center justify-center border border-white/20"
            aria-label="Open Chat"
            >
            <MessageCircle className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-md" />
            </Button>
        </div>
      </div>

      {/* Chat Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end md:items-end justify-center md:right-6 md:bottom-24 md:left-auto md:w-auto md:h-auto pointer-events-none">
          {/* 
              Mobile: Full screen / Large Modal 
              Desktop: Popover Card 
          */}
          <Card className="pointer-events-auto w-full h-[100dvh] md:w-[420px] md:h-[650px] md:rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 border-0 md:border md:border-border/50 bg-card overflow-hidden">

            {/* Header */}
            <CardHeader className="flex-shrink-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white p-5 border-b border-white/10 shadow-lg relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30 shrink-0 rotate-3">
                    <Bot className="text-white h-7 w-7 drop-shadow-md -rotate-3" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl leading-none tracking-tight drop-shadow-md uppercase italic">{t('crop_assistant')}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                        </span>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-50 font-black drop-shadow-md">
                            {t('ai_powered')}
                        </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={handleClearHistory} title={t('clear_history')} className="text-white hover:bg-white/20 transition-colors rounded-xl h-9 w-9">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 transition-colors rounded-xl h-9 w-9">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto w-full p-4 space-y-5 bg-gradient-to-b from-muted/30 to-background relative custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 text-[14px] leading-relaxed ${message.isUser
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-lg shadow-emerald-500/20'
                      : 'bg-card border border-border/50 text-foreground rounded-bl-sm shadow-lg shadow-black/5'
                      }`}
                  >
                    {message.isUser ? (
                        <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 prose-p:leading-relaxed prose-pre:p-0 prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400">
                            <ReactMarkdown>
                                {message.text}
                            </ReactMarkdown>
                        </div>
                    )}
                    <div className={`text-[10px] font-medium mt-2 flex items-center gap-1 ${message.isUser ? 'text-emerald-100 justify-end' : 'text-muted-foreground justify-start'}`}>
                      {!message.isUser && <Bot className="w-3 h-3 opacity-50" />}
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.isUser && <span className="material-symbols-outlined text-[14px]">done_all</span>}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-card border border-border/50 text-foreground rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
                    <div className="flex space-x-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </CardContent>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-2xl border-t border-border/40 z-20 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              {/* Quick Questions Chips */}
              {messages.length < 5 && (
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar-hide mb-1 mask-linear-right no-scrollbar">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="flex-shrink-0 text-[10px] font-black uppercase tracking-wider bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl px-4 py-2.5 transition-all duration-300 shadow-sm whitespace-nowrap active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 items-end">
                <div className="relative group/lang overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                    <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-12 text-[11px] font-black uppercase tracking-widest bg-transparent text-foreground hover:bg-muted/50 pl-3 pr-2 min-w-[90px] w-max flex-shrink-0 outline-none transition-colors cursor-pointer appearance-none text-center relative z-10"
                    >
                    <option value="en-US" className="bg-background text-foreground">EN</option>
                    <option value="hi-IN" className="bg-background text-foreground">HI</option>
                    <option value="or-IN" className="bg-background text-foreground">OR</option>
                    <option value="bn-IN" className="bg-background text-foreground">BN</option>
                    <option value="pa-IN" className="bg-background text-foreground">PA</option>
                    <option value="te-IN" className="bg-background text-foreground">TE</option>
                    </select>
                </div>

                <div className="flex-1 relative group">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat_input')}
                    className="pr-12 h-12 rounded-2xl bg-muted/40 border-border/40 text-sm font-medium transition-all focus-visible:ring-emerald-500/30 border shadow-inner text-foreground placeholder:text-muted-foreground/50"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`absolute right-1.5 top-1.5 h-9 w-9 rounded-xl transition-all ${isRecording ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>

                <Button 
                    size="icon" 
                    onClick={handleSend} 
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-30 transition-all shrink-0 active:scale-95 group"
                >
                  <Send className="h-5 w-5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </div>

          </Card>
        </div>
      )}
    </>
  );
}
