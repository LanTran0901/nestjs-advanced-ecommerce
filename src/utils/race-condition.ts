// test-order-race-condition.js

const API_BASE_URL = 'http://localhost:5000'; // Adjust to your NestJS server URL

// Test data - you'll need to adjust these based on your actual data
const TEST_CONFIG = {
  // You'll need valid access tokens for testing
  accessTokens: [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // User 1 token
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // User 2 token (optional)
  ],
  
  // Test order data - adjust cart item IDs and shop IDs based on your data
  orderData: [
    {
      shopId: 1,
      status: 'PENDING_PAYMENT',
      receiver: {
        name: 'Test Receiver 1',
        phone: '123456789',
        address: '123 Test Street',
        email: 'test1@example.com'
      },
      items: [1, 2] // Cart item IDs - make sure these exist in your database
    },
    {
      shopId: 2,
      status: 'PENDING_PAYMENT',
      receiver: {
        name: 'Test Receiver 2',
        phone: '987654321',
        address: '456 Test Avenue',
        email: 'test2@example.com'
      },
      items: [3, 4] // Different cart item IDs
    }
  ]
};

// Helper function to create order
async function createOrder(orderData, accessToken, requestId = '') {
  const startTime = Date.now();
  
  console.log(`🚀 [${requestId}] Starting order creation at ${new Date().toISOString()}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Request-ID': requestId, // For tracking
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      console.log(`✅ [${requestId}] SUCCESS (${duration}ms): Order created`);
      console.log(`   📦 Orders: ${responseData.totalOrders}`);
      console.log(`   💰 Total: $${responseData.payment.totalAmount}`);
      console.log(`   🆔 Payment ID: ${responseData.payment.id}`);
    } else {
      console.log(`❌ [${requestId}] FAILED (${duration}ms): ${response.status}`);
      console.log(`   📝 Error: ${responseData.message || 'Unknown error'}`);
      if (responseData.error) {
        console.log(`   🔍 Details: ${JSON.stringify(responseData.error)}`);
      }
    }

    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      duration,
      requestId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`💥 [${requestId}] NETWORK ERROR (${duration}ms): ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      duration,
      requestId,
      timestamp: new Date().toISOString()
    };
  }
}



// Test 2: Different users, overlapping cart items
async function testDifferentUsersRaceCondition() {
  console.log('\n🧪 TEST 2: Different Users, Overlapping Cart Items');
  console.log('='.repeat(60));
  
  if (TEST_CONFIG.accessTokens.length < 2) {
    console.log('⚠️  Skipping test - need at least 2 access tokens');
    return [];
  }
  
  // Create orders with overlapping cart items to test inventory race condition
  const overlappingOrderData = [
    {
      shopId: 1,
      status: 'PENDING_PAYMENT',
      receiver: {
        name: 'User 1',
        phone: '111111111',
        address: 'Address 1',
        email: 'user1@test.com'
      },
      items: [1, 2] // Same cart items
    }
  ];
  
  const promises = [
    createOrder(overlappingOrderData, TEST_CONFIG.accessTokens[0], 'USER-1'),
    createOrder(overlappingOrderData, TEST_CONFIG.accessTokens[1], 'USER-2')
  ];
  
  const results = await Promise.allSettled(promises);
  
  console.log('\n📊 RESULTS:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { success, duration, requestId } = result.value;
      console.log(`   [${requestId}] ${success ? '✅ SUCCESS' : '❌ FAILED'} - ${duration}ms`);
    }
  });
  
  return results;
}

