import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Settings, Key, Loader2, Trash2 } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function AIChatbotWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [model] = useState<string>('gpt-4o-mini');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I\'m the AutoDrops AI assistant. Ask me anything about trends, products, or the platform.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleClear = () => {
    setMessages((prev) => [prev[0]]);
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    const newUserMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsSending(true);

    try {
      // Reduce history to last 6 turns (12 messages) plus the initial assistant greeting
      const base = messages.slice(-12);
      const payloadMessages = [...base, newUserMessage];

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          max_tokens: 180,
        }),
      });

      const data = await response.json();
      const aiText: string = data?.reply || 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error contacting the AI service. Please try again.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl flex items-center justify-center hover:from-purple-700 hover:to-blue-700 transition-transform active:scale-95"
          title="Open AI Chatbot"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[400px] bg-gray-900/95 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md chat-animate-in">
          <div className="px-4 py-3 border-b border-gray-700/60 flex items-center justify-between bg-gray-900">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Bot className="w-5 h-5 text-purple-400" /> AI Chatbot
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                title="Clear conversation"
                onClick={handleClear}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                title="Close"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-80 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    'inline-block max-w-[85%] px-3 py-2 rounded-xl text-sm ' +
                    (m.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 border border-gray-700/60 rounded-bl-sm')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-700/60 bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={'Type your message...'}
                className="flex-1 premium-input rounded-xl px-3 py-2"
                disabled={isSending}
              />
              <button
                onClick={sendMessage}
                disabled={isSending}
                className="h-10 w-10 rounded-xl premium-button flex items-center justify-center disabled:opacity-60"
                title="Send"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2 text-[10px] text-gray-500">
              <span>Assistant ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


