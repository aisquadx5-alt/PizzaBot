"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  content: string;
  msgId: string;
  isActive: boolean;
  onComplete: (id: string) => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  content,
  msgId,
  isActive,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState<string>('');
  const indexRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  // Keep references updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // If not active, render immediately and trigger completion
    if (!isActive) {
      setDisplayedText(content);
      return;
    }

    setDisplayedText('');
    indexRef.current = 0;
    
    // Typewriting speed: ~12ms per character
    const interval = setInterval(() => {
      if (indexRef.current < content.length) {
        setDisplayedText(prev => prev + content.charAt(indexRef.current));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
        onCompleteRef.current(msgId);
      }
    }, 12);

    return () => {
      clearInterval(interval);
    };
  }, [content, msgId, isActive]);

  return (
    <span className="whitespace-pre-wrap leading-relaxed font-sans text-gray-200">
      {displayedText}
      {isActive && indexRef.current < content.length && (
        <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-cursor-blink select-none align-middle" />
      )}
    </span>
  );
};
