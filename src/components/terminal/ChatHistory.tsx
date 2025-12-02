import React, { useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useChatStore } from '../../stores/chatStore';
import { ToolCallDisplay } from '../chat/ToolCallDisplay';
import { SpoilerRenderer } from '../chat/Spoiler';
import 'highlight.js/styles/atom-one-dark.css';

const EMPTY_MESSAGES: any[] = [];

// Markdown component configuration - shared across renders
const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    return inline ? (
      <code
        className="bg-terminal-black/50 px-1 rounded text-terminal-amber"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold text-terminal-green mb-2 border-b border-terminal-green-dim pb-1">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-bold text-terminal-green mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-md font-bold text-terminal-green mb-1">
      {children}
    </h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside space-y-1 ml-2">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1 ml-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-terminal-green">{children}</li>
  ),
  p: ({ children }: any) => <p className="mb-2">{children}</p>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-terminal-amber pl-4 italic opacity-80">
      {children}
    </blockquote>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-terminal-amber">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-terminal-cyan">{children}</em>
  ),
};

export const ChatHistory: React.FC = () => {
  const messages = useChatStore((state) => {
    const session = state.sessions.find((s) => s.id === state.currentSessionId);
    return session ? session.messages : EMPTY_MESSAGES;
  });

  const sessions = useChatStore((state) => state.sessions);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const createSession = useChatStore((state) => state.createSession);
  const switchSession = useChatStore((state) => state.switchSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const clearHistory = useChatStore((state) => state.clearHistory);

  console.log('[ChatHistory] Render, messages count:', messages.length);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Memoized markdown renderer function for the SpoilerRenderer
  const renderMarkdown = useCallback((text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
    >
      {text}
    </ReactMarkdown>
  ), []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Session Management Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-terminal-green-dim bg-terminal-black/50">
        <span className="text-xs text-terminal-green/60 uppercase tracking-wider">Session:</span>
        <select
          value={currentSessionId || ''}
          onChange={(e) => switchSession(e.target.value)}
          className="flex-1 bg-black border border-terminal-green text-terminal-green text-sm px-2 py-1 rounded focus:outline-none focus:border-terminal-green-bright"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} ({session.messages.length})
            </option>
          ))}
        </select>
        <button
          onClick={createSession}
          className="px-3 py-1 bg-terminal-green/10 border border-terminal-green text-terminal-green text-sm rounded hover:bg-terminal-green/20 transition-colors"
          title="New Chat"
        >
          ✨ New
        </button>
        <button
          onClick={clearHistory}
          className="px-3 py-1 bg-terminal-amber/10 border border-terminal-amber text-terminal-amber text-sm rounded hover:bg-terminal-amber/20 transition-colors"
          title="Clear Current Chat"
        >
          🗑️
        </button>
        {sessions.length > 1 && (
          <button
            onClick={() => currentSessionId && deleteSession(currentSessionId)}
            className="px-3 py-1 bg-red-900/20 border border-red-500 text-red-500 text-sm rounded hover:bg-red-900/30 transition-colors"
            title="Delete Current Session"
          >
            ❌
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 font-mono">
        {messages.map((msg) => {
          // Render tool calls separately
          if (msg.isToolCall) {
            return (
              <ToolCallDisplay
                key={msg.id}
                toolName={msg.toolName || 'Unknown'}
                serverName={msg.serverName}
                arguments={msg.toolArguments || {}}
                response={msg.toolResponse}
                status={msg.toolStatus || 'pending'}
              />
            );
          }

          // Regular message rendering
          return (
            <div
              key={msg.id}
              className={`p-2 max-w-[90%] ${msg.sender === 'user'
                ? 'ml-auto text-right border-r-2 border-terminal-amber pr-4'
                : msg.sender === 'system'
                  ? 'mx-auto text-center text-sm border-y border-terminal-green-dim py-2'
                  : 'mr-auto border-l-2 border-terminal-green pl-4'
                }`}
            >
              <div
                className={`text-xs opacity-75 mb-1 uppercase tracking-widest ${msg.sender === 'user'
                  ? 'text-terminal-amber'
                  : msg.sender === 'system'
                    ? 'text-terminal-cyan'
                    : 'text-terminal-green'
                  }`}
              >
                {msg.sender === 'user'
                  ? 'USER_INPUT'
                  : msg.sender === 'ai'
                    ? 'SYSTEM_RESPONSE'
                    : 'SYSTEM_NOTICE'}
              </div>
              <div
                className={`${msg.sender === 'user'
                  ? 'text-terminal-amber'
                  : msg.sender === 'system'
                    ? 'text-terminal-cyan'
                    : 'text-terminal-green'
                  }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="markdown-content prose prose-invert prose-sm max-w-none">
                    <SpoilerRenderer
                      content={msg.content}
                      renderMarkdown={renderMarkdown}
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
