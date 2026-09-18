import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, title, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:text-slate-300"
        aria-label={title || 'Information'}
      >
        {children || <HelpCircle className="w-3.5 h-3.5" />}
      </button>

      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded-xl shadow-2xl z-50 pointer-events-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {title && <div className="font-semibold text-slate-100 mb-1">{title}</div>}
          <div className="text-slate-300 leading-relaxed font-normal">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};
