import type { DB } from "bknd";
import type { Insertable, Selectable, Updateable, Generated } from "kysely";
import type { FromSchema } from "json-schema-to-ts";

declare global {
  type BkndEntity<T extends keyof DB> = Selectable<DB[T]>;
  type BkndEntityCreate<T extends keyof DB> = Insertable<DB[T]>;
  type BkndEntityUpdate<T extends keyof DB> = Updateable<DB[T]>;
}

export interface Pages {
  id: Generated<number>;
  title?: string;
  content?: string;
  tags?: FromSchema<{
    type: "array", 
    items: {
      type: "string"
    }, 
    default: []
  }>;
  users_id?: number;
  images?: DB["media"][];
  users?: DB["users"];
}

export interface Posts {
  id: Generated<number>;
  title?: string;
  content?: string;
  active?: boolean;
  tags?: FromSchema<{
    type: "array", 
    items: {
      type: "string"
    }, 
    default: []
  }>;
  users_id?: number;
  images?: DB["media"][];
  image?: DB["media"][];
  users?: DB["users"];
}

interface Database {
  pages: Pages;
  posts: Posts;
}

declare module "bknd" {
  interface Users {
    pages?: Pages[];
    posts?: Posts[];
    avatar?: DB["media"];
  }

  interface DB extends Database {}
}