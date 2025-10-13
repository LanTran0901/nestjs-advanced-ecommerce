# Product Translation Examples

This file contains examples of how to use the Product Translation API endpoints.

## Create Product Translation

```json
POST /product-translation
{
  "productId": 1,
  "languageId": "en",
  "name": "iPhone 15 Pro",
  "description": "The latest iPhone with cutting-edge technology and advanced camera system."
}
```

## Update Product Translation

```json
PUT /product-translation/1
{
  "name": "iPhone 15 Pro Max",
  "description": "The ultimate iPhone with the largest display and most advanced features."
}
```

## Get All Product Translations

```
GET /product-translation?page=1&limit=10
```

## Get Product Translation by ID

```
GET /product-translation/1
```

## Delete Product Translation

```
DELETE /product-translation/1
```