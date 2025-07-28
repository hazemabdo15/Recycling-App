import axios from 'axios';

export const debugStripeConnection = async (user, accessToken) => {
  console.log('\n=== STRIPE DEBUG START ===');
  
  // Check user data
  console.log('User data:', {
    _id: user?._id,
    userId: user?.userId,
    id: user?.id,
    role: user?.role,
    email: user?.email,
  });
  
  // Check access token
  console.log('Access token:', accessToken ? 'Present' : 'Missing');
  
  // Test backend connectivity
  const baseUrl = 'http://192.168.0.165:5000';
  
  try {
    console.log('Testing backend connectivity...');
    const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    console.log('Backend health check:', healthResponse.status);
  } catch (error) {
    console.log('Backend health check failed:', error.message);
  }
  
  // Test the specific Stripe endpoint
  const userId = user?._id || user?.userId || user?.id;
  const stripeUrl = `${baseUrl}/users/${userId}/create-checkout-session`;
  
  console.log('Testing Stripe endpoint:', stripeUrl);
  
  try {
    const testPayload = {
      userId: userId,
      amount: 1000, // 10 EGP
      successUrl: 'recyclingapp://confirmation',
      cancelUrl: 'recyclingapp://review',
    };
    
    console.log('Test payload:', testPayload);
    
    const response = await axios.post(stripeUrl, testPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log('✅ Stripe endpoint SUCCESS:', response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log('❌ Stripe endpoint FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('URL:', error.config?.url);
    console.log('Headers:', error.config?.headers);
    
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status,
      url: error.config?.url 
    };
  } finally {
    console.log('=== STRIPE DEBUG END ===\n');
  }
};
