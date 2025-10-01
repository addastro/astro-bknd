import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Admin } from "bknd/ui";
import type { EditorState, LexicalEditor } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';

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
// OPRAVA 1: $isListItemNode patří sem
import { $isListItemNode, ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import type { HeadingTagType } from '@lexical/rich-text';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TreeView } from '@lexical/react/LexicalTreeView';

function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [blockType, setBlockType] = useState<string>('paragraph');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));

            const anchorNode = selection.anchor.getNode();
            // OPRAVA 2: Správná logika pro zjištění rodiče u seznamu
            let element = anchorNode.getTopLevelElementOrThrow();
            if ($isListItemNode(element)) {
              const parent = element.getParent();
              if ($isListNode(parent)) {
                element = parent;
              }
            }

            if ($isHeadingNode(element)) {
                setBlockType(element.getTag());
            } else if ($isListNode(element)) {
                setBlockType(element.getTag());
            } else {
                const type = element.getType();
                if(type === 'root') {
                    setBlockType('paragraph');
                } else {
                    setBlockType(type);
                }
            }
        }
    }, [editor]);


    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => updateToolbar());
            }),
            editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
                updateToolbar(); return false;
            }, 1),
            editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
                setCanUndo(payload); return false;
            }, 1),
            editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
                setCanRedo(payload); return false;
            }, 1),
        );
    }, [editor, updateToolbar]);
    
    const formatBlock = (type: HeadingTagType | 'quote' | 'paragraph') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => {
                    if (type === 'paragraph') return $createParagraphNode();
                    if (type === 'quote') return $createQuoteNode();
                    return $createHeadingNode(type);
                });
            }
        });
    };
    
    const formatList = (type: 'ul' | 'ol') => {
        if (blockType !== type) {
            editor.dispatchCommand(type === 'ul' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const toolbarStyles: React.CSSProperties = { display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid #444', marginBottom: '8px', background: '#2a2d33', flexWrap: 'wrap' };
    const buttonStyles = (active: boolean = false): React.CSSProperties => ({ background: active ? '#555' : '#333', border: '1px solid #555', color: 'white', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px' });

    return (
        <div style={toolbarStyles}>
            <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} style={buttonStyles()} disabled={!canUndo}>Undo</button>
            <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} style={buttonStyles()} disabled={!canRedo}>Redo</button>
            <div style={{width: '1px', background: '#555', margin: '0 4px'}}></div>
            <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} style={buttonStyles(isBold)}><b>B</b></button>
            <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} style={buttonStyles(isItalic)}><i>I</i></button>
            <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} style={buttonStyles(isUnderline)}><u>U</u></button>
            <div style={{width: '1px', background: '#555', margin: '0 4px'}}></div>
            <button onClick={() => formatBlock('h1')} style={buttonStyles(blockType === 'h1')}>H1</button>
            <button onClick={() => formatBlock('h2')} style={buttonStyles(blockType === 'h2')}>H2</button>
            <button onClick={() => formatBlock('quote')} style={buttonStyles(blockType === 'quote')}>"</button>
            <button onClick={() => formatList('ul')} style={buttonStyles(blockType === 'ul')}>UL</button>
            <button onClick={() => formatList('ol')} style={buttonStyles(blockType === 'ol')}>OL</button>
        </div>
    );
}

function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
    const [editor] = useLexicalComposerContext();
    const isFirstLoad = useRef(true);
    useEffect(() => {
        if (isFirstLoad.current && initialContent) {
            isFirstLoad.current = false;
            editor.update(() => $convertFromMarkdownString(initialContent, TRANSFORMERS));
        }
    }, [editor, initialContent]);
    return null;
}

function LexicalTreeView() {
    const [editor] = useLexicalComposerContext();
    return (
        <div style={{marginTop: '20px'}}>
            <h3 style={{color: 'white'}}>Live Editor State:</h3>
            <TreeView
                viewClassName="tree-view-output"
                editor={editor}
                timeTravelPanelClassName="debug-timetravel-panel"
                timeTravelButtonClassName="debug-timetravel-button"
                timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
                timeTravelPanelButtonClassName="debug-timetravel-panel-button"
            />
        </div>
    );
}

function LexicalEditorWrapper({ value, onChange }: { value?: string, onChange: (markdown: string) => void }) {
    const editorConfig = {
        namespace: 'BkndEditor',
        nodes: [HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode, CodeHighlightNode, LinkNode],
        onError(error: Error) { console.error(error); },
        theme: {},
    };

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div style={{ background: '#23262d', color: 'white', borderRadius: '5px', border: '1px solid #555' }}>
                <ToolbarPlugin />
                <div style={{position: 'relative', padding: '0 10px 10px 10px'}}>
                    <RichTextPlugin
                        contentEditable={<ContentEditable style={{ minHeight: '200px', outline: 'none' }} />}
                        placeholder={<div style={{ position: 'absolute', top: '8px', left: '8px', color: '#777', pointerEvents: 'none' }}>Zadejte text...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <InitialContentPlugin initialContent={value} />
                <OnChangePlugin onChange={(editorState) => editorState.read(() => onChange($convertToMarkdownString(TRANSFORMERS)))} />
                <AutoFocusPlugin />
            </div>
            <LexicalTreeView />
        </LexicalComposer>
    );
}

const entitiesWithEditor = ['pages', 'articles', 'posts', 'comments'];

function generateEntityConfig(entityNames: string[]) {
  return entityNames.reduce((acc, entityName) => {
    acc[entityName] = {
      fields: {
        // @ts-ignore
        "content": {
          render: (_: any, __: any, ___: any, ctx: any) => (
            <LexicalEditorWrapper value={ctx.value} onChange={ctx.handleChange} />
          )
        }
      }
    };
    return acc;
  }, {} as any);
}

export default function CustomAdmin({ user }: { user: any }) {
  const entitiesConfig = generateEntityConfig(entitiesWithEditor);

  return (
    <Admin
      withProvider={{ user }}
      config={{
        basepath: "/admin",
        theme: "dark",
        logo_return_path: "/../",
        entities: entitiesConfig,
      }}
    />
  );
}