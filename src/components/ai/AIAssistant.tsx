'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, Maximize2, Loader2, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function AIAssistant({ 
  articleId, 
  articleTitle, 
  articleContent, 
  isOpen, 
  onToggle, 
  isMobile = false 
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMessage: Message = {
        id: 'greeting',
        role: 'assistant',
        content: `👋 Hello! I'm your NGSRN Research Assistant. I can answer questions about this article, create a summary, or explain complex terms. What would you like me to do?`,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          articleTitle,
          articleContent,
          question: content.trim(),
          conversationHistory: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact the authors directly for assistance.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'summarize':
        sendMessage('Please provide a summary of this article with key insights.');
        break;
      case 'question':
        inputRef.current?.focus();
        setInputValue('');
        break;
      case 'explain':
        sendMessage('Can you explain the main concepts in this article in simple terms?');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!isOpen) return null;

  const containerClasses = isMobile 
    ? 'w-full h-full bg-white flex flex-col'
    : 'w-full bg-white';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">NGSRN Assistant</span>
          <span className="text-xs bg-blue-800 px-2 py-1 rounded-full">AI-powered by Gemini</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-blue-800 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-blue-800 rounded transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleQuickAction('summarize')}
                  className="flex items-center space-x-2 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">📖 Summarize this article</span>
                </button>
                <button
                  onClick={() => handleQuickAction('question')}
                  className="flex items-center space-x-2 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">❓ Ask a question</span>
                </button>
                <button
                  onClick={() => handleQuickAction('explain')}
                  className="flex items-center space-x-2 p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">💡 Explain concepts</span>
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about this article..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            {/* Suggestions */}
            {messages.length > 1 && !isLoading && (
              <div className="mt-3 text-xs text-gray-500">
                <p>💡 Try asking: "What are the key recommendations?" or "Explain [specific term]"</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}