import React from 'react';
import { Admin } from "bknd/ui";
import MDEditor from '@uiw/react-md-editor';

// ============================================================================
// Vytvoříme si čistou, znovupoužitelnou komponentu POUZE pro Markdown editor
// ============================================================================

function TranslatedMarkdownEditor({ value, onChange }: { value: any, onChange: (newValue: any) => void }) {
    const currentValues = value || { en: '', cz: '' };
    return (
        <div data-color-mode="dark">
          <label style={{ marginBottom: '8px', display: 'block' }}>Content (EN)</label>
          <MDEditor
            value={currentValues.en}
            onChange={(enValue) => onChange({ ...currentValues, en: enValue })}
            height={200}
          />
          <label style={{ marginTop: '16px', marginBottom: '8px', display: 'block' }}>Obsah (CZ)</label>
          <MDEditor
            value={currentValues.cz}
            onChange={(czValue) => onChange({ ...currentValues, cz: czValue })}
            height={200}
          />
        </div>
    );
}

// ============================================================================
// Hlavní komponenta administrace, která upravuje POUZE pole pro obsah
// ============================================================================

export default function CustomAdmin({ user }: { user: any }) {
  return (
    <Admin
      withProvider={{ user }}
      config={{
        basepath: "/admin",
        theme: "dark",
        logo_return_path: "/../",
        
        entities: {
          // Cílíme na entitu "pages"
          pages: {
            fields: {
              // @ts-ignore
              // Upravujeme POUZE pole "content_t"
              "content_t": {
                render: (context: any, entity: any, field: any, ctx: any) => (
                  <TranslatedMarkdownEditor value={ctx.value} onChange={ctx.handleChange} />
                )
              }
            },
          },
          // Stejný postup pro entitu "articles"
          articles: {
            fields: {
              // @ts-ignore
              "content_t": {
                render: (context: any, entity: any, field: any, ctx: any) => (
                  <TranslatedMarkdownEditor value={ctx.value} onChange={ctx.handleChange} />
                )
              }
            },
          },
        },
      }}
    />
  );
}

