import React, { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  FORMAT_TEXT_COMMAND,
  $isElementNode,
  $createParagraphNode,
  type EditorState,
  type LexicalEditor,
} from 'lexical';

// MODERNÍ ZPŮSOB: Importujeme si klíčovou funkci pro transformaci bloků
import { $setBlocksType } from '@lexical/selection';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS, $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

// Toolbar
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const type = element.getTag();
          setBlockType(type);
        } else if ($isHeadingNode(element)) {
            const type = element.getTag();
            setBlockType(type);
        } else {
          const type = element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }: { editorState: EditorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);
  
  const toolbarStyles: React.CSSProperties = { display: 'flex', gap: '4px', padding: '4px', borderBottom: '1px solid #555', marginBottom: '8px', flexWrap: 'wrap' };
  const buttonStyles = (active: boolean): React.CSSProperties => ({ background: active ? '#555' : 'transparent', border: '1px solid #555', color: 'white', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' });
  
  // MODERNÍ ZPŮSOB: Používáme $setBlocksType pro všechny transformace bloků
  const formatBlock = (type: 'h1' | 'h2' | 'h3' | 'quote' | 'paragraph') => {
      if (blockType !== type) {
          editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                  switch (type) {
                      case 'h1':
                      case 'h2':
                      case 'h3':
                          $setBlocksType(selection, () => $createHeadingNode(type));
                          break;
                      case 'quote':
                          $setBlocksType(selection, () => $createQuoteNode());
                          break;
                      default:
                          $setBlocksType(selection, () => $createParagraphNode());
                          break;
                  }
              }
          });
      } else { // Pokud je typ stejný, vrátíme ho na odstavec
          editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                  $setBlocksType(selection, () => $createParagraphNode());
              }
          });
      }
  };


  const formatUnorderedList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatOrderedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  return (
    <div style={toolbarStyles}>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} style={buttonStyles(isBold)} aria-label="Format Bold"><b>B</b></button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} style={buttonStyles(isItalic)} aria-label="Format Italic"><i>I</i></button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} style={buttonStyles(isUnderline)} aria-label="Format Underline"><u>U</u></button>
      <div style={{width: '1px', background: '#555', margin: '0 4px'}}></div>
      <button onClick={() => formatBlock('h1')} style={buttonStyles(blockType === 'h1')}>H1</button>
      <button onClick={() => formatBlock('h2')} style={buttonStyles(blockType === 'h2')}>H2</button>
      <button onClick={() => formatBlock('h3')} style={buttonStyles(blockType === 'h3')}>H3</button>
      <button onClick={() => formatBlock('quote')} style={buttonStyles(blockType === 'quote')}>"</button>
       <div style={{width: '1px', background: '#555', margin: '0 4px'}}></div>
      <button onClick={formatUnorderedList} style={buttonStyles(blockType === 'ul')}>UL</button>
      <button onClick={formatOrderedList} style={buttonStyles(blockType === 'ol')}>OL</button>
    </div>
  );
}

// Hlavní komponenta editoru
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

export default function LexicalEditorComponent({ initialContent, onContentChange }: { initialContent?: string, onContentChange: (markdown: string) => void }) {
  
  const handleStateChange = (editorState: EditorState) => {
    editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onContentChange(markdown);
    });
  };

  return (
    <div data-color-mode="dark">
      <LexicalComposer initialConfig={editorConfig}>
        <div style={{ position: 'relative', background: '#23262d', color: 'white', padding: '10px', borderRadius: '5px', border: '1px solid #555' }}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable style={{ minHeight: '200px', outline: 'none' }} />}
            placeholder={<div style={{ position: 'absolute', top: '48px', left: '10px', color: '#777', pointerEvents: 'none' }}>Zadejte text...</div>}
            ErrorBoundary={LexicalErrorBoundary as any}
          />
          <HistoryPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <InitialContentPlugin initialContent={initialContent} />
          <OnChangePlugin onChange={handleStateChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

