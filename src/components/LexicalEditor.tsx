import React, { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  // Přidán import pro typ EditorState a přejmenování LexicalEditor, aby se předešlo konfliktu
  type EditorState,
  type LexicalEditor as LexicalEditorType,
} from 'lexical';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS, $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

// ============================================================================
// Komponenta pro Toolbar (panel nástrojů)
// ============================================================================
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    // Použijeme importovaný typ pro editorState
    return editor.registerUpdateListener(({ editorState }: { editorState: EditorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);
  
  const toolbarStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    borderBottom: '1px solid #ddd',
    marginBottom: '8px',
  };

  const buttonStyles = (active: boolean): React.CSSProperties => ({
    background: active ? '#ddd' : 'transparent',
    border: '1px solid #ccc',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
  });

  return (
    <div style={toolbarStyles}>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        style={buttonStyles(isBold)}
        aria-label="Format Bold"
      >
        <b>B</b>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        style={buttonStyles(isItalic)}
        aria-label="Format Italic"
      >
        <i>I</i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        style={buttonStyles(isUnderline)}
        aria-label="Format Underline"
      >
        <u>U</u>
      </button>
    </div>
  );
}


// ============================================================================
// Hlavní komponenta editoru
// ============================================================================

const editorConfig = {
  namespace: 'MyRichTextEditor',
  nodes: [ HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode, LinkNode ],
  onError(error: Error) { throw error; },
  theme: {},
};

function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        const contentToLoad = (typeof initialContent === 'string') ? initialContent : '';
        editor.update(() => {
            $convertFromMarkdownString(contentToLoad, TRANSFORMERS);
        });
    }, [editor, initialContent]);
    return null;
}

export default function LexicalEditor({ initialContent, onContentChange }: { initialContent?: string, onContentChange: (markdown: string) => void }) {
  
  const handleStateChange = (editorState: EditorState) => {
    editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onContentChange(markdown);
    });
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div style={{ position: 'relative', background: 'white', color: 'black', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={<ContentEditable style={{ minHeight: '200px', outline: 'none' }} />}
          placeholder={<div style={{ position: 'absolute', top: '48px', left: '10px', color: '#aaa', pointerEvents: 'none' }}>Zadejte text...</div>}
          ErrorBoundary={LexicalErrorBoundary as any}
        />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <InitialContentPlugin initialContent={initialContent} />
        <OnChangePlugin onChange={handleStateChange} />
      </div>
    </LexicalComposer>
  );
}

