import type { Category } from "generated/prisma";

export interface BulkCategoryResult {
    success: boolean;
    data?: Category;   
    message?: string;
  }
  