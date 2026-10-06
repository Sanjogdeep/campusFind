import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../../types';
import { caseService } from '../../services/caseService';
import { API_BASE } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Send, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';

interface CaseChatProps {
  caseId: number;
  currentUser: User;
  onDisputeTrigger?: () => void;
}

export const CaseChat: React.FC<CaseChatProps> = ({
  caseId,
  currentUser,
  onDisputeTrigger,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { error } = useToast();

  const loadMessages = async () => {
    try {
      const data = await caseService.getMessages(caseId);
      setMessages(data);
    } catch (err: any) {
      // Chat may not be unlocked yet if finder hasn't confirmed
    }
  };

  useEffect(() => {
    loadMessages();

    // WebSocket connection for real-time chat
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendHost = API_BASE.startsWith('http') ? new URL(API_BASE).host : window.location.host;
    const wsUrl = `${protocol}//${backendHost}/ws/cases/${caseId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CHAT_MESSAGE') {
          const newMsg = payload.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, [caseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await caseService.sendMessage(caseId, inputValue.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInputValue('');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-sky-600" />
            Temporary Case Chat
          </h4>
          <span className="text-[11px] text-slate-500">
            Real-time safe messaging • Personal phone & email hidden
          </span>
        </div>

        {onDisputeTrigger && (
          <button
            onClick={onDisputeTrigger}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Report Issue
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
            <Lock className="w-8 h-8 mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Temporary Case Conversation</p>
            <p className="max-w-xs mt-1">
              Use this chat to coordinate meeting details at the designated campus location.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                  {msg.sender_name}
                </span>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Agree on meeting time and campus location..."
          className="flex-1 px-4 py-2.5 bg-slate-100 border border-transparent focus:border-sky-500 focus:bg-white rounded-xl text-xs outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-sky-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
