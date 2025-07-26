import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NetworkDiagnostics } from '../utils/networkDiagnostics';

// Debug component to test network connectivity
export const NetworkDiagnosticsComponent = () => {
  const { accessToken } = useAuth();

  const runDiagnostics = async () => {
    try {
      console.log('🏥 Starting network diagnostics...');
      const results = await NetworkDiagnostics.runFullDiagnostics(accessToken);
      
      // Show results in an alert
      const summary = `
Network Diagnostics Results:
- API Connection: ${results.tests.apiConnection.success ? '✅' : '❌'}
- Socket Endpoint: ${results.tests.socketEndpoint.success ? '✅' : '❌'}  
- Notifications API: ${results.tests.notificationsEndpoint.success ? '✅' : '❌'}

Check console for detailed logs.`;
      
      Alert.alert('Network Diagnostics', summary, [{ text: 'OK' }]);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      Alert.alert('Diagnostics Error', error.message, [{ text: 'OK' }]);
    }
  };

  return {
    runDiagnostics
  };
};
