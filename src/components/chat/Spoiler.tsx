import React, { useState } from 'react';

interface SpoilerProps {
  title: string;
  children: React.ReactNode;
}

export const Spoiler: React.FC<SpoilerProps> = ({ title, children }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-3 border border-terminal-purple rounded-lg overflow-hidden">
      <button
        onClick={() => setRevealed(!revealed)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-300 ${
          revealed 
            ? 'bg-terminal-purple/20 text-terminal-purple' 
            : 'bg-terminal-purple/10 hover:bg-terminal-purple/20 text-terminal-purple/80'
        }`}
      >
        <span className={`transition-transform duration-300 ${revealed ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span className="font-bold">{title}</span>
        {!revealed && (
          <span className="ml-auto text-xs opacity-60 uppercase tracking-wider">
            Click to reveal
          </span>
        )}
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          revealed ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3 bg-terminal-black/50 border-t border-terminal-purple/30">
          <div className="text-terminal-green animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Preprocesses markdown content to convert spoiler syntax to a parseable format.
 * Converts: :::spoiler[Title]\nContent\n:::
 * To: A special marker that the component can detect
 */
export function preprocessSpoilers(content: string): {
  content: string;
  spoilers: Array<{ id: string; title: string; content: string }>;
} {
  const spoilers: Array<{ id: string; title: string; content: string }> = [];
  let idCounter = 0;

  // Match :::spoiler[Title]\nContent\n:::
  const spoilerRegex = /:::spoiler\[(.*?)\]\n([\s\S]*?)\n:::/g;

  const processedContent = content.replace(spoilerRegex, (_, title, spoilerContent) => {
    const id = `spoiler-${idCounter++}`;
    spoilers.push({
      id,
      title: title.trim(),
      content: spoilerContent.trim()
    });
    return `{{SPOILER:${id}}}`;
  });

  return { content: processedContent, spoilers };
}

/**
 * Renders content with spoiler placeholders replaced by actual Spoiler components
 */
export const SpoilerRenderer: React.FC<{
  content: string;
  renderMarkdown: (text: string) => React.ReactNode;
}> = ({ content, renderMarkdown }) => {
  const { content: processedContent, spoilers } = preprocessSpoilers(content);
  
  // If no spoilers, just render normally
  if (spoilers.length === 0) {
    return <>{renderMarkdown(content)}</>;
  }

  // Split content by spoiler placeholders and render
  const parts = processedContent.split(/(\{\{SPOILER:spoiler-\d+\}\})/);
  
  return (
    <>
      {parts.map((part, index) => {
        const spoilerMatch = part.match(/\{\{SPOILER:(spoiler-\d+)\}\}/);
        if (spoilerMatch) {
          const spoilerId = spoilerMatch[1];
          const spoiler = spoilers.find(s => s.id === spoilerId);
          if (spoiler) {
            return (
              <Spoiler key={index} title={spoiler.title}>
                {renderMarkdown(spoiler.content)}
              </Spoiler>
            );
          }
        }
        return <React.Fragment key={index}>{renderMarkdown(part)}</React.Fragment>;
      })}
    </>
  );
};

export default Spoiler;
