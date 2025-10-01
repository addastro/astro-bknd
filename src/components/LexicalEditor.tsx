import React, { useEffect } from 'react';
import { $getRoot } from 'lexical';
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

const editorConfig = {
  namespace: 'MyRichTextEditor',
  nodes: [ HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode, LinkNode ],
  onError(error: Error) { throw error; },
  theme: {},
};

function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        // Zkontrolujeme, jestli je initialContent skutečně string. Pokud ne, použijeme prázdný.
        const contentToLoad = (typeof initialContent === 'string') ? initialContent : '';
        editor.update(() => {
            $convertFromMarkdownString(contentToLoad, TRANSFORMERS);
        });
    }, [editor, initialContent]);
    return null;
}

export default function LexicalEditor({ initialContent, onContentChange }: { initialContent?: string, onContentChange: (markdown: string) => void }) {
  
  const handleStateChange = (editorState: any) => {
    editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onContentChange(markdown);
    });
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div style={{ position: 'relative', background: 'white', color: 'black', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
        <RichTextPlugin
          contentEditable={<ContentEditable style={{ minHeight: '200px', outline: 'none' }} />}
          placeholder={<div style={{ position: 'absolute', top: '10px', left: '10px', color: '#aaa', pointerEvents: 'none' }}>Zadejte text... můžete použít Markdown.</div>}
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