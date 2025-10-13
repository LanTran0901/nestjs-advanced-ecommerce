/**
 * Category Module CRUD Operations Examples
 * 
 * This file contains example usage of the Category module endpoints.
 * Categories support 2-level hierarchical structure only (parent-child relationships).
 * - Level 1: Parent categories (no parent)
 * - Level 2: Child categories (have a parent)
 * 
 * Base URL: /category
 */

// 1. Create a new parent category (Level 1)
// POST /category
const createParentCategoryExample = {
  method: "POST",
  url: "/category",
  body: {
    name: "Electronics",
    logo: "https://example.com/electronics-logo.png"
    // parentCategoryId is omitted for parent categories
  }
};

// 2. Create a child category (Level 2)
// POST /category
const createChildCategoryExample = {
  method: "POST",
  url: "/category",
  body: {
    name: "Smartphones",
    logo: "https://example.com/smartphone-logo.png",
    parentCategoryId: 1 // ID of the parent category (Electronics)
  }
};

// NOTE: Cannot create more than 2 levels
// Attempting to create a grandchild will result in an error:
// "Cannot create more than 2 levels of categories. The selected parent is already a child category."

// 3. Get all categories with filtering and pagination
// GET /category?includeDeleted=false&parentId=1&search=phone&page=1&limit=10
const getAllCategoriesExample = {
  method: "GET",
  url: "/category",
  queryParams: {
    includeDeleted: "false", // Include soft deleted categories
    parentId: "1",           // Filter by parent category ID (null for root categories)
    search: "phone",         // Search in category names
    page: "1",               // Page number for pagination
    limit: "10"              // Items per page
  }
};

// 4. Get category tree (2-level hierarchical structure)
// GET /category/tree
const getCategoryTreeExample = {
  method: "GET",
  url: "/category/tree",
  description: "Returns all categories in a hierarchical tree structure up to 4 levels deep"
};

// 5. Get a single category by ID with details
// GET /category/:id
const getSingleCategoryExample = {
  method: "GET",
  url: "/category/1",
  description: "Returns category with parent, children, products (first 5), and counts"
};

// 6. Update an existing category
// PATCH /category/:id
const updateCategoryExample = {
  method: "PATCH",
  url: "/category/1",
  body: {
    name: "Consumer Electronics",
    logo: "https://example.com/new-electronics-logo.png",
    parentCategoryId: null // Move to root level, or specify new parent ID
  }
};

// 7. Soft delete a category
// DELETE /category/:id
const deleteCategoryExample = {
  method: "DELETE",
  url: "/category/1",
  description: "Cannot delete if category has active products or child categories"
};

// 8. Permanently delete a category
// DELETE /category/:id/permanent
const permanentDeleteExample = {
  method: "DELETE",
  url: "/category/1/permanent"
};

// 9. Restore a soft-deleted category
// POST /category/:id/restore
const restoreCategoryExample = {
  method: "POST",
  url: "/category/1/restore"
};

/**
 * Category Business Rules:
 * 
 * 1. Hierarchy:
 *    - Categories can have parent-child relationships
 *    - Tree structure supports up to 4 levels deep
 *    - Cannot set self as parent (circular reference prevention)
 *    - Cannot set descendant as parent (circular reference prevention)
 * 
 * 2. Naming:
 *    - Category names must be unique within the same level (same parent)
 *    - Name length: 2-500 characters
 * 
 * 3. Deletion:
 *    - Cannot delete category with active products
 *    - Cannot delete category with child categories
 *    - Must remove/move products and children first
 * 
 * 4. Logo:
 *    - Optional field
 *    - Must be valid URL
 *    - Max 1000 characters
 * 
 * Response Format:
 * {
 *   "message": "Operation success message",
 *   "data": { 
 *     "id": 1,
 *     "name": "Electronics",
 *     "logo": "https://...",
 *     "parentCategory": { ... },
 *     "childrenCategories": [ ... ],
 *     "products": [ ... ], // First 5 products
 *     "_count": {
 *       "products": 25,
 *       "childrenCategories": 5
 *     },
 *     "createdBy": { ... },
 *     "updatedBy": { ... },
 *     "createdAt": "2025-09-24T...",
 *     "updatedAt": "2025-09-24T..."
 *   },
 *   "pagination": { // For paginated responses
 *     "page": 1,
 *     "limit": 10,
 *     "total": 50,
 *     "pages": 5
 *   }
 * }
 * 
 * Tree Response Format (GET /category/tree):
 * [
 *   {
 *     "id": 1,
 *     "name": "Electronics",
 *     "logo": "https://...",
 *     "childrenCategories": [
 *       {
 *         "id": 2,
 *         "name": "Smartphones",
 *         "logo": "https://...",
 *         "_count": { "products": 10 }
 *       },
 *       {
 *         "id": 3,
 *         "name": "Laptops", 
 *         "logo": "https://...",
 *         "_count": { "products": 15 }
 *       }
 *     ],
 *     "_count": { "products": 5, "childrenCategories": 2 }
 *   }
 * ]
 *
 * New 2-Level Specific Endpoints:
 * 
 * 9. Get only parent categories (Level 1)
 * GET /category/parents
 * 
 * 10. Get child categories by parent ID
 * GET /category/:parentId/children
 * 
 * Example responses:
 * 
 * GET /category/parents:
 * {
 *   "message": "Parent categories retrieved successfully",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Electronics",
 *       "logo": "https://...",
 *       "_count": {
 *         "products": 5,
 *         "childrenCategories": 3
 *       }
 *     }
 *   ]
 * }
 * 
 * GET /category/1/children:
 * {
 *   "message": "Child categories retrieved successfully",
 *   "data": [
 *     {
 *       "id": 2,
 *       "name": "Smartphones",
 *       "logo": "https://...",
 *       "parentCategory": {
 *         "id": 1,
 *         "name": "Electronics"
 *       },
 *       "_count": {
 *         "products": 10
 *       }
 *     }
 *   ]
 * }
 */
 *       }
 *     ],
 *     "_count": { "products": 25, "childrenCategories": 5 }
 *   }
 * ]
 */