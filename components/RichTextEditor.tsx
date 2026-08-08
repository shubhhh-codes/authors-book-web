'use client';

import React, { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

const HIGHLIGHT_CLASSES: Record<HighlightColor, { bg: string; text: string; name: string; dot: string }> = {
  yellow: { bg: 'bg-yellow-200', text: 'text-gray-900', name: 'Yellow', dot: 'bg-yellow-500' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-950', name: 'Sage Green', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-sky-100', text: 'text-sky-950', name: 'Soft Blue', dot: 'bg-sky-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-950', name: 'Blush Rose', dot: 'bg-pink-500' },
};

/** Robust HTML Sanitizer to strip messy data-huuid spans and class bloat */
export function cleanHtmlString(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<span[^>]*style="[^"]*background-color:[^"]*"[^>]*>(.*?)<\/span>/gi, '<mark>$1</mark>')
    .replace(/<span[^>]*data-huuid[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [activeColor, setActiveColor] = useState<HighlightColor>('yellow');
  const visualRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state into visual editor DOM when entering visual mode
  useEffect(() => {
    if (mode === 'visual' && visualRef.current) {
      if (visualRef.current.innerHTML !== (value || '')) {
        visualRef.current.innerHTML = value || '';
      }
    }
  }, [mode, value]);

  // Sync changes from visual contentEditable to parent state
  const syncVisualToParent = () => {
    if (!visualRef.current) return;
    let html = visualRef.current.innerHTML;
    if (html.includes('data-huuid') || html.includes('style=')) {
      html = cleanHtmlString(html);
    }
    onChange(html);
  };

  // Switch tabs safely while syncing visual content
  const switchMode = (nextMode: 'visual' | 'code' | 'preview') => {
    if (mode === 'visual') {
      syncVisualToParent();
    }
    setMode(nextMode);
  };

  // Format command helper for visual mode
  const execFormat = (command: string, arg?: string) => {
    if (mode !== 'visual') {
      switchMode('visual');
      setTimeout(() => execFormat(command, arg), 50);
      return;
    }

    if (visualRef.current) {
      visualRef.current.focus();
      document.execCommand(command, false, arg);
      syncVisualToParent();
    }
  };

  // Turn off highlight or exit mark tag
  const turnOffHighlight = () => {
    if (mode === 'code') return;

    if (visualRef.current) {
      visualRef.current.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElem = container.nodeType === 1 ? (container as HTMLElement) : container.parentElement;
      const existingMark = parentElem?.closest('mark') || parentElem?.closest('span[style*="background"]');

      if (existingMark) {
        if (!sel.isCollapsed) {
          const textNode = document.createTextNode(existingMark.textContent || '');
          existingMark.parentNode?.replaceChild(textNode, existingMark);
        } else {
          const textNode = document.createTextNode('\u200B');
          if (existingMark.nextSibling) {
            existingMark.parentNode?.insertBefore(textNode, existingMark.nextSibling);
          } else {
            existingMark.parentNode?.appendChild(textNode);
          }
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      try {
        document.execCommand('hiliteColor', false, 'transparent');
      } catch {
        document.execCommand('removeFormat');
      }

      syncVisualToParent();
    }
  };

  // Apply or toggle preset highlight on selected text
  const applyPresetHighlight = (color: HighlightColor) => {
    setActiveColor(color);
    const colorInfo = HIGHLIGHT_CLASSES[color];

    if (mode === 'code') {
      wrapCodeSelection(`<mark class="${colorInfo.bg} ${colorInfo.text} px-1 rounded-xs">`, '</mark>');
      return;
    }

    if (visualRef.current) {
      visualRef.current.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElem = container.nodeType === 1 ? (container as HTMLElement) : container.parentElement;
      const existingMark = parentElem?.closest('mark');

      if (existingMark) {
        if (existingMark.className.includes(colorInfo.bg)) {
          turnOffHighlight();
          return;
        } else {
          existingMark.className = `${colorInfo.bg} ${colorInfo.text} px-1 rounded-xs`;
          syncVisualToParent();
          return;
        }
      }

      if (!sel.isCollapsed) {
        const markNode = document.createElement('mark');
        markNode.className = `${colorInfo.bg} ${colorInfo.text} px-1 rounded-xs`;
        try {
          range.surroundContents(markNode);
        } catch {
          const selectedText = sel.toString();
          execFormat('insertHTML', `<mark class="${colorInfo.bg} ${colorInfo.text} px-1 rounded-xs">${selectedText}</mark>`);
        }
      } else {
        const mark = document.createElement('mark');
        mark.className = `${colorInfo.bg} ${colorInfo.text} px-1 rounded-xs`;
        mark.textContent = 'highlighted text';
        range.insertNode(mark);
        range.selectNodeContents(mark);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      syncVisualToParent();
    }
  };

  // Toggle Editorial Quote (blockquote with cite credit line)
  const handleQuote = () => {
    if (mode === 'code') {
      wrapCodeSelection('<blockquote class="border-l-2 border-[#1a1714] pl-4 py-1 my-4 space-y-1"><p class="font-serif italic text-base text-[#1a1714]">“', '”</p><cite class="block text-[10px] font-bold tracking-[0.2em] text-[#8c8275] uppercase not-italic mt-1">EDITORIAL CHOICE</cite></blockquote>');
      return;
    }

    if (visualRef.current) {
      visualRef.current.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElem = container.nodeType === 1 ? (container as HTMLElement) : container.parentElement;
      const existingQuote = parentElem?.closest('blockquote');

      if (existingQuote) {
        // Untoggle quote
        const textNode = document.createTextNode(existingQuote.textContent || '');
        existingQuote.parentNode?.replaceChild(textNode, existingQuote);
      } else {
        // Create editorial blockquote matching design image
        const bq = document.createElement('blockquote');
        bq.className = 'border-l-2 border-[#1a1714] pl-4 py-1 my-4 space-y-1';
        const quoteText = !sel.isCollapsed ? sel.toString() : 'Think Like A Monk by Jay Shetty. Order your copy.';
        bq.innerHTML = `<p class="font-serif italic text-base text-[#1a1714]">“${quoteText}”</p><cite class="block text-[10px] font-bold tracking-[0.2em] text-[#8c8275] uppercase not-italic mt-1">EDITORIAL CHOICE</cite>`;

        if (!sel.isCollapsed) {
          execFormat('insertHTML', bq.outerHTML);
        } else {
          range.insertNode(bq);
          range.selectNodeContents(bq);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      syncVisualToParent();
    }
  };

  // Code editor selection wrapper
  const wrapCodeSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value || ''}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (value || '').substring(start, end);

    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}highlighted text${suffix}`;
    const updated = (value || '').substring(0, start) + replacement + (value || '').substring(end);
    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + replacement.length : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, start + replacement.length);
    }, 30);
  };

  // Handle smart paste event to sanitize dirty HTML instantly
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedHtml = e.clipboardData.getData('text/html');
    if (pastedHtml && (pastedHtml.includes('data-huuid') || pastedHtml.includes('<span'))) {
      e.preventDefault();
      const cleaned = cleanHtmlString(pastedHtml);
      if (mode === 'visual') {
        execFormat('insertHTML', cleaned);
      } else {
        wrapCodeSelection(cleaned, '');
      }
    }
  };

  const handleCleanBloat = () => {
    const cleaned = cleanHtmlString(value);
    onChange(cleaned);
    if (visualRef.current) visualRef.current.innerHTML = cleaned;
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Editor Control Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Formatting Toolbar Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}
            className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-gray-100 font-bold text-gray-800 transition-colors shadow-2xs flex items-center justify-center cursor-pointer active:bg-gray-200"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}
            className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-gray-100 italic font-serif text-gray-800 transition-colors shadow-2xs flex items-center justify-center cursor-pointer active:bg-gray-200"
            title="Italic"
          >
            I
          </button>

          {/* Color Highlight Presets */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
            {(Object.keys(HIGHLIGHT_CLASSES) as HighlightColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applyPresetHighlight(c); }}
                className={`w-5 h-5 rounded-full ${HIGHLIGHT_CLASSES[c].dot} hover:scale-110 transition-transform cursor-pointer border border-black/10 flex items-center justify-center ${
                  activeColor === c ? 'ring-2 ring-black ring-offset-1' : ''
                }`}
                title={`Highlight ${HIGHLIGHT_CLASSES[c].name}`}
              />
            ))}
            <span className="text-[10px] text-gray-400 font-mono ml-0.5">Highlight</span>
          </div>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); turnOffHighlight(); }}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors shadow-2xs text-xs cursor-pointer"
            title="Turn off highlight at cursor"
          >
            Off
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleQuote(); }}
            className="px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 italic font-serif text-gray-800 transition-colors shadow-2xs text-xs cursor-pointer flex items-center gap-1"
            title="Editorial Quote blockquote"
          >
            <span>“</span> Quote
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'p'); }}
            className="px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 font-mono text-gray-700 transition-colors shadow-2xs text-xs cursor-pointer"
            title="Paragraph <p>"
          >
            Paragraph
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('insertUnorderedList'); }}
            className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors shadow-2xs text-xs cursor-pointer"
            title="Bullet list"
          >
            • List
          </button>

          <button
            type="button"
            onClick={handleCleanBloat}
            className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors shadow-2xs flex items-center gap-1 text-xs cursor-pointer"
            title="Clean span & data-huuid bloat"
          >
            <span>✨</span> Clean HTML
          </button>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center bg-gray-200 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => switchMode('visual')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'visual' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => switchMode('code')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'code' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            HTML Code
          </button>
          <button
            type="button"
            onClick={() => switchMode('preview')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'preview' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Live Preview
          </button>
        </div>
      </div>

      {/* Main Editing Viewports */}
      {mode === 'visual' && (
        <div className="relative">
          <div
            ref={visualRef}
            contentEditable
            onInput={syncVisualToParent}
            onBlur={syncVisualToParent}
            onPaste={handlePaste}
            className="w-full min-h-[160px] max-h-[400px] overflow-y-auto p-4 font-serif text-sm text-[#2c2620] leading-relaxed focus:outline-none focus:ring-2 focus:ring-black selection:bg-yellow-200 prose max-w-none"
          />
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 text-[10px] text-gray-500 flex justify-between items-center">
            <span>Click <b>“ Quote</b> to insert or toggle an editorial pull quote block</span>
            <span>{value ? `${value.length} chars` : 'Empty'}</span>
          </div>
        </div>
      )}

      {mode === 'code' && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={7}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder || 'Raw HTML code mode...'}
            className="w-full p-4 font-mono text-xs text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-black resize-y"
          />
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 text-[10px] text-gray-500 flex justify-between items-center">
            <span>HTML Code View: Highlight text and click buttons to insert/remove tags</span>
            <span>{value ? `${value.length} chars` : 'Empty'}</span>
          </div>
        </div>
      )}

      {mode === 'preview' && (
        <div className="p-6 bg-[#f4f0ea] border-t border-gray-200 min-h-[160px] text-[#1a1714]">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#8c8275] mb-2 border-b border-[#e0d9cf] pb-1">
            Storefront Presentation Preview
          </div>
          {value ? (
            <div
              className="font-serif text-sm text-[#2c2620] leading-relaxed space-y-3 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanHtmlString(value) }}
            />
          ) : (
            <div className="font-serif italic text-xs text-[#a39b8e]">
              No description text entered yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
