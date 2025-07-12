import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiSend, FiAlertCircle, FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import axiosInstance from "../../axios";

const ChatBot = ({ onAnalysisComplete }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get("/data/getData");
        setAnalyticsData(data);
        setDataLoaded(true);

        // Welcome message with summary
        setMessages([
          {
            sender: "bot",
            text:
              `Welcome to your analytics assistant! Here's your business snapshot:\n\n` +
              `• Revenue: ₹${(
                data.profitMetrics?.grossRevenue ?? 0
              ).toLocaleString("en-IN")}\n` +
              `• Orders: ${data.shopify?.totalOrders ?? 0}\n` +
              `• Ad Spend: ₹${(data.meta?.totalSpend ?? 0).toLocaleString(
                "en-IN"
              )}\n` +
              `• Profit: ₹${(
                data.profitMetrics?.estimatedProfit ?? 0
              ).toLocaleString("en-IN")}\n\n` +
              `Feel free to ask anything about sales, advertising, shipping, or profit trends.`,
            isAnalysis: true,
            timestamp: new Date().toISOString(),
          },
        ]);

        if (onAnalysisComplete) {
          onAnalysisComplete(data);
        }
      } catch (err) {
        setError("Failed to load business data");
        toast.error("Could not connect to analytics service");
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [onAnalysisComplete]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !dataLoaded || isLoading) return;

    const userMessage = {
      sender: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        message: input.trim(),
        data: analyticsData,
      };

      const { data: replyPayload } = await axiosInstance.post(
        "/data/chat",
        payload
      );

      const botMessage = {
        sender: "bot",
        text: replyPayload.reply,
        isAnalysis: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Sorry, I encountered an error processing your request.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I encountered an error processing your request.",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, dataLoaded, isLoading, analyticsData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What is total orders count?",
    "What is total sales amount?",
    "What is total ad spend?",
    "What is estimated profit amount?",
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 text-white">
        <h2 className="text-lg font-semibold">Analytics Assistant</h2>
        <p className="text-xs opacity-80">
          {dataLoaded ? "Ready to answer your questions" : "Loading..."}
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.timestamp}-${idx}`}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-sm ${
                msg.sender === "user"
                  ? "bg-green-600 text-white"
                  : msg.isError
                  ? "bg-red-100 text-red-800"
                  : "bg-white border border-green-100 shadow-xs"
              }`}
            >
              {msg.text.split("\n").map((line, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {line}
                </p>
              ))}
              <div className="text-xs mt-1 opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-green-100 rounded-xl p-3 text-sm max-w-[85%]">
              <div className="flex items-center space-x-2 text-green-600">
                <FiLoader className="animate-spin" />
                <span>Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions (shown only before user asks anything) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 bg-gray-50">
          <h3 className="text-xs text-gray-500 mb-2">SUGGESTED QUESTIONS</h3>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => setInput(question)}
                className="text-xs bg-white hover:bg-green-50 border border-gray-200 rounded-lg p-2 text-left truncate"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        {error && (
          <div className="flex items-center text-red-600 text-xs mb-2">
            <FiAlertCircle className="mr-1" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !dataLoaded}
            placeholder={
              isLoading
                ? "Processing..."
                : !dataLoaded
                ? "Loading data..."
                : "Ask about orders, revenue, ads, or deliveries..."
            }
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !dataLoaded}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
