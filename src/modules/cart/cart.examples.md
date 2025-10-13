# Cart API Examples

## Add Item to Cart
```bash
POST /cart/add
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "skuId": 1,
  "quantity": 2
}
```

## Get Cart
```bash
GET /cart
Authorization: Bearer <jwt_token>
```

## Update Cart Item Quantity
```bash
PATCH /cart/1
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "quantity": 5
}
```

## Remove Item from Cart
```bash
DELETE /cart/1
Authorization: Bearer <jwt_token>
```

## Remove Multiple Items by Product IDs
```bash
POST /cart/remove-multiple
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "productIds": [1, 2, 3, 5]
}
```

**Response:**
```json
{
  "message": "4 items removed from cart successfully",
  "data": {
    "removedCount": 4,
    "notFoundProductIds": []
  }
}
```

## Clear Cart
```bash
DELETE /cart
Authorization: Bearer <jwt_token>
```

## Get Cart Items Count
```bash
GET /cart/count
Authorization: Bearer <jwt_token>
```

## Get Cart Total
```bash
GET /cart/total
Authorization: Bearer <jwt_token>
```