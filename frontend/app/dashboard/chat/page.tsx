"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { sendChatMessage, getFields, Field, ChatMessage } from "@/lib/api";
import { Card, CardContent, Badge } from "@/components/ui";

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
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const suggestedQuestions = [
    "Quel est l'état de santé de mes cultures ?",
    "Quand dois-je irriguer ?",
    "Comment interpréter l'indice NDVI ?",
    "Quelle est la prédiction de rendement ?",
  ];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white p-4 flex flex-col">
        <h2 className="font-semibold text-slate-900 mb-2">Contexte</h2>
        <p className="text-sm text-slate-500 mb-4">
          Sélectionnez une parcelle pour des conseils personnalisés
        </p>

        <div className="space-y-2 flex-1 overflow-y-auto">
          <button
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              selectedFieldId === null
                ? "bg-emerald-50 border-2 border-emerald-500"
                : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
            }`}
            onClick={() => setSelectedFieldId(null)}
          >
            <span className="text-xl">🌍</span>
            <span className="font-medium">Conseils généraux</span>
          </button>

          {fields.map((field) => (
            <button
              key={field.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                selectedFieldId === field.id
                  ? "bg-emerald-50 border-2 border-emerald-500"
                  : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
              }`}
              onClick={() => setSelectedFieldId(field.id)}
            >
              <span className="text-xl">🗺️</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{field.name}</span>
                {field.crop_type && (
                  <span className="text-xs text-slate-500">{field.crop_type}</span>
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
                >
                  {field.latest_ndvi.toFixed(2)}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {selectedField && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <h3 className="font-semibold text-slate-900">{selectedField.name}</h3>
            {selectedField.crop_type && (
              <p className="text-sm text-slate-600">Culture: {selectedField.crop_type}</p>
            )}
            {selectedField.area_hectares && (
              <p className="text-sm text-slate-600">
                Surface: {selectedField.area_hectares.toFixed(1)} ha
              </p>
            )}
          </div>
        )}
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-900">Assistant IA</h1>
          <p className="text-sm text-slate-500">
            Posez vos questions sur vos cultures et obtenez des conseils personnalisés
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Comment puis-je vous aider ?
              </h2>
              <p className="text-slate-500 max-w-md mb-6">
                Je suis votre assistant agricole. Posez-moi des questions sur vos
                cultures, l'irrigation, ou demandez des conseils personnalisés.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(question)}
                    className="text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-emerald-500 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user" ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
