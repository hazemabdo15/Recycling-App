import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/theme';
import { getLabel, isBuyer, isCustomer } from '../../utils/roleLabels';

const RoleDebugger = () => {
  const { user, isLoggedIn } = useAuth();

  const testLabels = [
    'cartTitle',
    'schedulePickup',
    'orderConfirmation',
    'appName',
    'welcomeMessage'
  ];

  if (!isLoggedIn || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Role Debug - Not Logged In</Text>
        <Text style={styles.text}>Please log in to see role debugging info</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Info:</Text>
        <Text style={styles.text}>Name: {user.name || 'N/A'}</Text>
        <Text style={styles.text}>Email: {user.email || 'N/A'}</Text>
        <Text style={styles.text}>Role: {user.role || 'undefined'}</Text>
        <Text style={styles.text}>Is Buyer: {isBuyer(user) ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Is Customer: {isCustomer(user) ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role-Based Labels:</Text>
        {testLabels.map(label => (
          <View key={label} style={styles.labelTest}>
            <Text style={styles.labelKey}>{label}:</Text>
            <Text style={styles.labelValue}>{getLabel(label, user.role)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw User Object:</Text>
        <Text style={styles.codeText}>{JSON.stringify(user, null, 2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 5,
  },
  labelTest: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral,
    width: 120,
  },
  labelValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.neutral,
    backgroundColor: colors.base100,
    padding: 10,
    borderRadius: 4,
  },
});

export default RoleDebugger;
