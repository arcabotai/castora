/* types.ts */
import { Document } from '@contentful/rich-text-types';

export type BlogItem = {
  fields: {
    title: string;
    slug: string;
    publishedDate: string;
    content: Document;
    featuredImage: {
      fields: {
        file: {
          url: string;
        };
      };
    };
  }
}
export type BlogItems = ReadonlyArray<BlogItem>;

export type BlogQueryResult = {
  items: BlogItems;
}