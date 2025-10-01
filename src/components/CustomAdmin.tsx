import React from 'react';
import { Admin } from "bknd/ui";
import LexicalEditor from './LexicalEditor';

const entitiesWithEditor = [
  'pages', 
  'articles', 
  'posts', 
  'comments'
];

function generateEntityConfig(entityNames: string[]) {
  return entityNames.reduce((acc, entityName) => {
    acc[entityName] = {
      fields: {
        // @ts-ignore
        "content": {
          render: (context: any, entity: any, field: any, ctx: any) => (
            <LexicalEditor 
              initialContent={ctx.value}
              onContentChange={ctx.handleChange}
            />
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