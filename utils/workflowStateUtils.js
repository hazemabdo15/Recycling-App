import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKFLOW_STATE_KEY = 'pickup_workflow_state';

export const workflowStateUtils = {
  // Save workflow state before payment
  async saveWorkflowState(state) {
    try {
      const stateToSave = {
        selectedAddress: state.selectedAddress,
        currentPhase: state.currentPhase,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(stateToSave));
      console.log('💾 [Workflow State] Saved workflow state:', stateToSave);
    } catch (error) {
      console.error('❌ [Workflow State] Failed to save state:', error);
    }
  },

  // Restore workflow state after payment return
  async restoreWorkflowState() {
    try {
      const stateStr = await AsyncStorage.getItem(WORKFLOW_STATE_KEY);
      if (!stateStr) {
        console.log('ℹ️ [Workflow State] No saved state found');
        return null;
      }

      const state = JSON.parse(stateStr);
      const now = Date.now();
      const stateAge = now - state.timestamp;
      
      // Only restore state if it's less than 1 hour old
      if (stateAge > 60 * 60 * 1000) {
        console.log('⏰ [Workflow State] Saved state is too old, ignoring');
        await this.clearWorkflowState();
        return null;
      }

      console.log('📱 [Workflow State] Restored workflow state:', state);
      return state;
    } catch (error) {
      console.error('❌ [Workflow State] Failed to restore state:', error);
      return null;
    }
  },

  // Clear workflow state after successful order or timeout
  async clearWorkflowState() {
    try {
      await AsyncStorage.removeItem(WORKFLOW_STATE_KEY);
      console.log('🗑️ [Workflow State] Cleared workflow state');
    } catch (error) {
      console.error('❌ [Workflow State] Failed to clear state:', error);
    }
  }
};
