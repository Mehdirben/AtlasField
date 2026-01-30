"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { sendChatMessage, getSites, getChatHistory, Site, ChatMessage, ChatHistory } from "@/lib/api";
import { Badge } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get("site") || searchParams.get("field");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(
    initialSiteId ? Number(initialSiteId) : null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSites();
    loadChatHistory();
  }, []);

  // Load chat history when site changes
  useEffect(() => {
    loadChatHistory();
  }, [selectedSiteId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Prevent background scrolling on mobile when chat is open
    const isMobile = window.innerWidth < 1024; // Match lg breakpoint
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, []);

  async function loadSites() {
    try {
      const data = await getSites();
      setSites(data);
    } catch (error) {
      console.error("Failed to load sites:", error);
    }
  }

  async function loadChatHistory() {
    try {
      const histories = await getChatHistory(selectedSiteId ?? undefined);
      setChatHistories(histories);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }

  const selectChatHistory = (history: ChatHistory) => {
    setActiveHistoryId(history.id);
    setMessages(history.messages);
    setSelectedSiteId(history.field_id);
    setIsMobileSidebarOpen(false);
  };

  const startNewChat = () => {
    setActiveHistoryId(null);
    setMessages([]);
    setIsMobileSidebarOpen(false);
  };

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
        selectedSiteId || undefined
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
      // Refresh chat history to update the list
      loadChatHistory();
    }
  };

  const selectedSite = sites.find((s: Site) => s.id === selectedSiteId);

  const suggestedQuestions = selectedSite?.site_type === "FOREST" ? [
    "What is the fire risk level for my forest?",
    "How healthy is my forest?",
    "What type of forest do I have?",
    "Are there signs of deforestation?",
  ] : [
    "What is the health status of my crops?",
    "When should I irrigate?",
    "How do I interpret the NDVI index?",
    "What is the yield prediction?",
  ];

  const SidebarContent = () => (
    <div className="w-80 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-4 lg:p-5 flex flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white text-lg">🎯</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Context</h2>
            <p className="text-xs text-slate-500">Select a site for personalized advice</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Site Selection */}
      <div className="flex-1 flex flex-col min-h-0 mb-6 group/sites">
        <button
          className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left mb-3 group ${selectedSiteId === null
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            : "bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60"
            }`}
          onClick={() => { setSelectedSiteId(null); startNewChat(); }}
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🌍</span>
          <div>
            <span className="font-medium block">General Advice</span>
            <span className={`text-xs ${selectedSiteId === null ? 'text-emerald-100' : 'text-slate-500'}`}>
              No specific site
            </span>
          </div>
        </button>

        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Monitored Sites
          </p>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {sites.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          {sites.map((site: Site) => (
            <button
              key={site.id}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left group ${selectedSiteId === site.id
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60"
                }`}
              onClick={() => { setSelectedSiteId(site.id); startNewChat(); }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{site.site_type === "FOREST" ? "🌲" : "🌾"}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{site.name}</span>
                {site.site_type === "FOREST" ? (
                  site.forest_type && (
                    <span className={`text-xs ${selectedSiteId === site.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {site.forest_type}
                    </span>
                  )
                ) : (
                  site.crop_type && (
                    <span className={`text-xs ${selectedSiteId === site.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {site.crop_type}
                    </span>
                  )
                )}
              </div>
              {site.health_score !== undefined && site.health_score !== null && (
                <Badge
                  variant={
                    site.health_score >= 60
                      ? "success"
                      : site.health_score >= 40
                        ? "warning"
                        : "error"
                  }
                  className={selectedSiteId === site.id ? "bg-white/20 text-white border-white/30" : ""}
                >
                  {Math.round(site.health_score)}%
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History Section */}
      <div className="border-t border-slate-200/60 pt-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-semibold text-slate-900 text-sm">Recent Activity</h3>
          </div>
          <button
            onClick={startNewChat}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200/50"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
          {chatHistories.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No conversations yet
            </p>
          ) : (
            chatHistories.map((history) => {
              const firstMessage = history.messages[0]?.content || "New conversation";
              const preview = firstMessage.length > 40 ? firstMessage.substring(0, 40) + "..." : firstMessage;
              const siteName = sites.find((s: Site) => s.id === history.field_id)?.name || "General";

              return (
                <button
                  key={history.id}
                  onClick={() => selectChatHistory(history)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${activeHistoryId === history.id
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                >
                  <p className={`text-sm font-medium truncate ${activeHistoryId === history.id ? "text-emerald-700" : "text-slate-700"
                    }`}>
                    {preview}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {new Date(history.updated_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-200/60 rounded text-slate-500">
                      {siteName}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] -m-3 sm:-m-4 md:-m-6 lg:-m-8 md:mb-0 -mb-20 relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 lg:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Context Sidebar */}
      <aside className={`hidden lg:block ${sidebarOpen ? 'lg:w-80' : 'lg:w-0'} transition-all duration-300 overflow-hidden`}>
        <SidebarContent />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-w-0 md:static fixed inset-0 top-14 sm:top-16 md:inset-auto z-10 overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Desktop toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🤖</span> <span className="hidden sm:inline">AI</span> Assistant
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">
                Ask questions about your sites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSite && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 max-w-[120px] sm:max-w-none">
                <span className="text-sm">{selectedSite.site_type === "FOREST" ? "🌲" : "🎯"}</span>
                <span className="text-sm font-medium text-emerald-700 truncate">{selectedSite.name}</span>
              </div>
            )}
            {!selectedSite && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm">🌍</span>
                <span className="text-sm font-medium text-slate-600">General</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                <span className="text-4xl sm:text-5xl">🤖</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                How can I help you today?
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-md">
                I'm your agricultural and forestry assistant. Ask me questions about your sites,
                irrigation, forest health, or get personalized advice.
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
                    className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 ${message.role === "user"
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
                    <div className={`prose prose-sm max-w-none ${message.role === "user" ? "prose-invert text-white" : "text-slate-700"}`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-base font-bold my-2" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-1" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="text-sm" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                          strong: ({ node, ...props }) => <strong className={`font-bold ${message.role === "user" ? "text-white underline decoration-white/30" : "text-emerald-700 font-semibold"}`} {...props} />,
                          a: ({ node, ...props }) => <a className={`${message.role === "user" ? "text-white underline" : "text-emerald-600 underline hover:text-emerald-700"}`} {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs mt-3 ${message.role === "user" ? "text-emerald-100" : "text-slate-400"
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
        <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-3 sm:p-4 pb-20 sm:pb-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2 sm:gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your question..."
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all placeholder:text-slate-400 text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
