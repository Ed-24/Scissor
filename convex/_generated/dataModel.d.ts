import { GenericId } from "convex/values";

export type Doc<TableName extends TableNames> = TableName extends "links"
  ? {
      _id: Id<"links">;
      _creationTime: number;
      originalUrl: string;
      slug: string;
      userId?: string;
      anonymousClientId?: string;
      createdAt: number;
      expiresAt?: number;
      status: "active" | "expired";
    }
  : TableName extends "clicks"
  ? {
      _id: Id<"clicks">;
      _creationTime: number;
      linkId: Id<"links">;
      timestamp: number;
      referrer: string;
      country: string;
      device: string;
    }
  : never;

export type Id<TableName extends TableNames> = GenericId<TableName>;
export type TableNames = "links" | "clicks";
export type SystemTableNames = never;

export type DataModel = {
  links: {
    document: Doc<"links">;
    fieldPaths: keyof Doc<"links">;
    indexes: {
      by_slug: ["slug"];
      by_userId: ["userId"];
      by_anonymousClientId: ["anonymousClientId"];
    };
  };
  clicks: {
    document: Doc<"clicks">;
    fieldPaths: keyof Doc<"clicks">;
    indexes: {
      by_linkId: ["linkId"];
    };
  };
};

export default DataModel;
