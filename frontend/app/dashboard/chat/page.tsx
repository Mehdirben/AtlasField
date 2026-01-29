"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { sendChatMessage, getFields, Field, ChatMessage } from "@/lib/api";
import { Badge } from "@/components/ui";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialFieldId = searchParams.get("field");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(
    initialFieldId ? Number(initialFieldId) : null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadFields() {
    try {
      const data = await getFields();
      setFields(data);
    } catch (error) {
      console.error("Failed to load fields:", error);
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(
        userMessage.content,
        selectedFieldId || undefined
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, an error occurred. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const suggestedQuestions = [
    "What is the health status of my crops?",
    "When should I irrigate?",
    "How do I interpret the NDVI index?",
    "What is the yield prediction?",
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 md:-m-6 lg:-m-8">
      {/* Context Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="w-80 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-5 flex flex-col">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Context</h2>
                <p className="text-xs text-slate-500">Select a field for personalized advice</p>
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 -mr-1">
            <button
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left group ${
                selectedFieldId === null
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60"
              }`}
              onClick={() => setSelectedFieldId(null)}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🌍</span>
              <div>
                <span className="font-medium block">General Advice</span>
                <span className={`text-xs ${selectedFieldId === null ? 'text-emerald-100' : 'text-slate-500'}`}>
                  No specific field
                </span>
              </div>
            </button>

            {fields.length > 0 && (
              <div className="pt-3 pb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Your Fields
                </p>
              </div>
            )}

            {fields.map((field) => (
              <button
                key={field.id}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left group ${
                  selectedFieldId === field.id
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60"
                }`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🗺️</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{field.name}</span>
                  {field.crop_type && (
                    <span className={`text-xs ${selectedFieldId === field.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {field.crop_type}
                    </span>
                  )}
                </div>
                {field.latest_ndvi && (
                  <Badge
                    variant={
                      field.latest_ndvi >= 0.6
                        ? "success"
                        : field.latest_ndvi >= 0.4
                        ? "warning"
                        : "error"
                    }
                    className={selectedFieldId === field.id ? "bg-white/20 text-white border-white/30" : ""}
                  >
                    {field.latest_ndvi.toFixed(2)}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Selected Field Info */}
          {selectedField && (
            <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-cyan-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold text-slate-900">{selectedField.name}</h3>
              </div>
              {selectedField.crop_type && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span>🌾</span> {selectedField.crop_type}
                </p>
              )}
              {selectedField.area_hectares && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span>📐</span> {selectedField.area_hectares.toFixed(1)} ha
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-w-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">🤖</span> AI Assistant
              </h1>
              <p className="text-sm text-slate-500">
                Ask questions about your crops and get personalized advice
              </p>
            </div>
          </div>
          {selectedField && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-sm">🎯</span>
              <span className="text-sm font-medium text-emerald-700">{selectedField.name}</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                <span className="text-5xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                How can I help you today?
              </h2>
              <p className="text-slate-500 mb-8 max-w-md">
                I'm your agricultural assistant. Ask me questions about your crops, 
                irrigation, or get personalized farming advice.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(question)}
                    className="text-left p-4 bg-white/80 backdrop-blur border border-slate-200/60 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 text-sm group"
                  >
                    <span className="text-slate-700 group-hover:text-emerald-700">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-emerald-500/20"
                        : "bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl rounded-bl-md shadow-sm"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs font-semibold text-emerald-600">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-3 ${
                        message.role === "user" ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/80 backdrop-blur border border-slate-200/60 p-4 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-semibold text-emerald-600">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your question..."
                  className="w-full px-5 py-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
