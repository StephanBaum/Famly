import React from 'react';

interface MarkdownMessageProps {
  text: string;
  isUser?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ text, isUser = false }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Parse lines into structured elements
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="space-y-1.5 my-2 pl-0.5">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (str: string): React.ReactNode => {
    // Process **bold** markers
    const parts = str.split(/(\*\*[^*]+?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={idx} className="font-extrabold text-stone-900 dark:text-white">
            {inner}
          </strong>
        );
      }

      // Process *italic* markers
      const subParts = part.split(/(\*[^*]+?\*)/g);
      if (subParts.length > 1) {
        return subParts.map((sub, sIdx) => {
          if (sub.startsWith('*') && sub.endsWith('*')) {
            return (
              <em key={sIdx} className="italic text-stone-700 dark:text-slate-300">
                {sub.slice(1, -1)}
              </em>
            );
          }
          return sub;
        });
      }

      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Check if bullet point: starts with "* ", "- ", "• "
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      currentList.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
          <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
          <span className="flex-1">{renderInline(content)}</span>
        </li>
      );
      continue;
    }

    // Not a bullet point: flush any active list
    flushList();

    // Check if line is a prominent subheader like "**Beim Bäcker:**" or "### Header"
    const isHeading =
      trimmed.startsWith('###') ||
      trimmed.startsWith('##') ||
      (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60);

    if (isHeading) {
      const headingText = trimmed.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '');
      elements.push(
        <h4
          key={`h-${i}`}
          className="font-black text-xs sm:text-sm text-stone-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5"
        >
          <span>{headingText}</span>
        </h4>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed">
          {renderInline(rawLine)}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
};
