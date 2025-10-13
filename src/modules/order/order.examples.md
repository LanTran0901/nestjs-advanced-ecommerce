# Order API Examples

## Create Order
```http
POST /order
Content-Type: application/json
Authorization: Bearer <token>

{
  "data": [
    {
      "status": "PENDING_PAYMENT",
      "receiver": {
        "name": "Nguyễn Văn A",
        "phone": "0987654321",
        "address": "123 Đường ABC, Quận 1, TP.HCM"
      },
      "shopId": 2,
      "items": [1, 2, 3]
    }
  ]
}
```

### Response với QR Payment Link:
```json
{
  "orders": [
    {
      "id": 1,
      "status": "PENDING_PAYMENT",
      "totalAmount": 150000,
      "receiver": {
        "name": "Nguyễn Văn A",
        "phone": "0987654321",
        "address": "123 Đường ABC, Quận 1, TP.HCM"
      },
      "items": [...],
      "user": {...},
      "shop": {...}
    }
  ],
  "totalOrders": 1,
  "payment": {
    "id": 123,
    "status": "PENDING",
    "totalAmount": 150000,
    "qrPaymentLink": "https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=150000&des=Thanh%20toan%20don%20hang%20123",
    "instructions": {
      "amount": 150000,
      "bankAccount": "0010000000355",
      "bankName": "Vietcombank",
      "description": "Thanh toan don hang 123",
      "note": "Vui lòng quét mã QR hoặc chuyển khoản theo thông tin trên để hoàn tất thanh toán"
    }
  },
  "message": "1 order(s) created successfully with shared payment"
}
```

## Get All Orders (with pagination and filters)
```http
GET /order?page=1&limit=10&status=PENDING_PAYMENT&userId=1&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&search=john
Authorization: Bearer <token>
```

## Get My Orders
```http
GET /order/my-orders?page=1&limit=10&status=DELIVERED
Authorization: Bearer <token>
```

## Get Single Order
```http
GET /order/123
Authorization: Bearer <token>
```

## Update Order
```http
PUT /order/123
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "PENDING_DELIVERY",
  "receiver": {
    "name": "John Doe Updated",
    "phone": "1234567890",
    "address": "456 New St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "country": "USA"
  }
}
```

## Update Order Status Only
```http
PATCH /order/123/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "DELIVERED"
}
```

## Delete Order (Soft Delete)
```http
DELETE /order/123
Authorization: Bearer <token>
```

## Cancel Order
```http
POST /order/123/cancel
Authorization: Bearer <token>
```

## Return Order
```http
POST /order/123/return
Authorization: Bearer <token>
```

## Order Status Flow
```
PENDING_PAYMENT → PENDING_PICKUP → PENDING_DELIVERY → DELIVERED
                ↓                ↓                  ↓
              CANCELLED         CANCELLED         RETURNED
```

## Expected Response Format
```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": 1,
    "status": "PENDING_PAYMENT",
    "receiver": {
      "name": "John Doe",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "shopId": 2,
    "paymentId": 1,
    "items": [],
    "products": [],
    "payment": {},
    "user": {},
    "shop": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  },
  "message": "Order retrieved successfully"
}
```

## Pagination Response Format
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Orders retrieved successfully"
}
```