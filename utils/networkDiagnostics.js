import { API_BASE_URL } from '../services/api/config';

export const NetworkDiagnostics = {

  testAPIConnection: async () => {
    try {
      console.log('🔍 Testing API connection to:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        timeout: 10000,
      });
      
      if (response.ok) {
        console.log('✅ API connection successful');
        return { success: true, message: 'API connection successful' };
      } else {
        console.log('⚠️ API responded with status:', response.status);
        return { success: false, message: `API responded with status: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return { success: false, message: `API connection failed: ${error.message}` };
    }
  },

  testNotificationsEndpoint: async (token) => {
    try {
      console.log('🔍 Testing notifications endpoint...');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notifications endpoint successful, data:', data);
        return { success: true, data };
      } else {
        console.log('⚠️ Notifications endpoint failed with status:', response.status);
        const errorText = await response.text();
        return { success: false, message: `Status: ${response.status}, Error: ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Notifications endpoint failed:', error.message);
      return { success: false, message: `Notifications endpoint failed: ${error.message}` };
    }
  },

  testSocketEndpoint: async () => {
    try {
      console.log('🔍 Testing Socket.IO endpoint...');

      const response = await fetch(`${API_BASE_URL}/socket.io/`, {
        method: 'GET',
        timeout: 10000,
      });

      if (response.status === 400 || response.status === 200) {
        console.log('✅ Socket.IO endpoint is accessible');
        return { success: true, message: 'Socket.IO endpoint is accessible' };
      } else {
        console.log('⚠️ Socket.IO endpoint returned unexpected status:', response.status);
        return { success: false, message: `Unexpected status: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Socket.IO endpoint test failed:', error.message);
      return { success: false, message: `Socket.IO endpoint test failed: ${error.message}` };
    }
  },

  runFullDiagnostics: async (token = null) => {
    console.log('🏥 Running full network diagnostics...');
    console.log('🌐 Target server:', API_BASE_URL);
    
    const results = {
      timestamp: new Date().toISOString(),
      serverUrl: API_BASE_URL,
      tests: {}
    };

    results.tests.apiConnection = await NetworkDiagnostics.testAPIConnection();

    results.tests.socketEndpoint = await NetworkDiagnostics.testSocketEndpoint();

    if (token) {
      results.tests.notificationsEndpoint = await NetworkDiagnostics.testNotificationsEndpoint(token);
    } else {
      results.tests.notificationsEndpoint = { 
        success: false, 
        message: 'No token provided - skipping authenticated endpoint test' 
      };
    }

    const passedTests = Object.values(results.tests).filter(test => test.success).length;
    const totalTests = Object.keys(results.tests).length;
    
    console.log(`🏥 Diagnostics complete: ${passedTests}/${totalTests} tests passed`);
    console.log('📊 Full results:', results);
    
    return results;
  }
};
