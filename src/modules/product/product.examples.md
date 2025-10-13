# Product API Examples

## Get Filter Options
```bash
GET /product/filters/options
```

**Response:**
```json
{
  "message": "Filter options retrieved successfully",
  "data": {
    "brands": [
      {
        "id": 1,
        "name": "TechBrand",
        "logo": "logo.jpg",
        "productCount": 25
      }
    ],
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "logo": "category.jpg",
        "parentCategoryId": null,
        "productCount": 50
      }
    ],
    "priceRange": {
      "min": 9.99,
      "max": 2999.99
    }
  }
}
```

## Get All Products (with Filters)

### Basic Usage
```bash
GET /product
```

### With Pagination
```bash
GET /product?page=1&limit=20
```

### Filter by Price Range
```bash
GET /product?minPrice=100&maxPrice=500
```

### Filter by Brand IDs
```bash
GET /product?brandIds=1,2,3
```

### Filter by Category IDs
```bash
GET /product?categoryIds=5,10,15
```

### Search Products
```bash
GET /product?search=laptop
```

### Combined Filters
```bash
GET /product?page=1&limit=12&minPrice=200&maxPrice=1000&brandIds=1,3&categoryIds=2,4&search=gaming
```

**Response Example:**
```json
{
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Gaming Laptop",
      "basePrice": 999.99,
      "virtualPrice": 899.99,
      "images": ["image1.jpg", "image2.jpg"],
      "avgRating": 4.5,
      "totalReviews": 25,
      "priceRange": {
        "min": 899.99,
        "max": 1199.99
      },
      "brand": {
        "id": 1,
        "name": "TechBrand",
        "logo": "logo.jpg"
      },
      "categories": [
        {
          "id": 2,
          "name": "Laptops",
          "logo": "category-logo.jpg"
        }
      ],
      "skus": [
        {
          "id": 1,
          "value": "16GB-512GB",
          "price": 899.99,
          "stock": 10,
          "image": "sku-image.jpg"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "applied": {
      "minPrice": 200,
      "maxPrice": 1000,
      "brandIds": [1, 3],
      "categoryIds": [2, 4],
      "search": "gaming"
    }
  }
}
```

## Get Single Product
```bash
GET /product/1
```

### Get Product with Specific Language
```bash
GET /product/1?languageId=en
```

## Create Product
```bash
POST /product
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- name: "New Product"
- basePrice: 99.99
- virtualPrice: 89.99
- brandId: 1
- categoryIds: [1, 2]
- variants: [{"name": "Size", "options": ["S", "M", "L"]}]
- skus: [{"value": "S", "price": 89.99, "stock": 10, "image": "sku.jpg"}]
- images: [file1, file2, file3]
```

## Update Product
```bash
PUT /product/1
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- name: "Updated Product"
- basePrice: 109.99
- images: [file1, file2]
```

## Delete Product
```bash
DELETE /product/1
Authorization: Bearer <jwt_token>
```

## Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Items per page (default: 10, max: 100) | `limit=20` |
| `minPrice` | number | Minimum price filter | `minPrice=100` |
| `maxPrice` | number | Maximum price filter | `maxPrice=500` |
| `brandIds` | string | Comma-separated brand IDs | `brandIds=1,2,3` |
| `categoryIds` | string | Comma-separated category IDs | `categoryIds=5,10,15` |
| `search` | string | Search in name and translations | `search=laptop` |

## Features

- **Price Filtering**: Filter products by SKU price ranges
- **Brand Filtering**: Filter by multiple brand IDs
- **Category Filtering**: Filter by multiple category IDs
- **Search**: Search across product names and translations
- **Pagination**: Efficient pagination with metadata
- **Ratings**: Automatic calculation of average ratings
- **Price Ranges**: Automatic calculation of min/max prices from SKUs
- **Soft Delete Awareness**: Only shows non-deleted products, brands, categories, and SKUs