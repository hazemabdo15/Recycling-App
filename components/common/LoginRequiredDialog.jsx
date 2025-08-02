import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';

const LoginRequiredDialog = ({ visible, onClose, onLogin }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="account-alert" 
              size={48} 
              color={colors.primary} 
            />
          </View>
          
          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.message}>
            You need to be logged in to schedule a pickup. Please log in to continue.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.loginButton]} 
              onPress={onLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.base100,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.subtitle,
    color: colors.neutral,
    fontWeight: '600',
  },
  loginButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
  },
});

export default LoginRequiredDialog;
