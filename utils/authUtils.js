import * as SecureStore from 'expo-secure-store';
// Removed circular dependency: import apiService from '../services/api/apiService';

export async function getAccessToken() {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    console.log(`[authUtils] Retrieved access token: ${token ? 'present' : 'null'} (length: ${token?.length || 0})`);
    return token;
  } catch (error) {
    console.error('[authUtils] Error retrieving access token:', error);
    return null;
  }
}

export async function setAccessToken(token) {
  try {
    const tokenSize = token.length;
    console.log(`[authUtils] Access token size: ${tokenSize} bytes`);
    await SecureStore.setItemAsync('accessToken', token);

    // Removed circular dependency call: apiService.setAccessToken(token)
    // The API service will get the token when needed via getAccessToken()
  } catch (error) {
    console.error('[authUtils] Error storing access token:', error);
  }
}

export async function getLoggedInUser() {
  try {
    const userString = await SecureStore.getItemAsync('user');
    if (userString) {
      const user = JSON.parse(userString);
      return user;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

export async function setLoggedInUser(user, deliveryStatus = null) {
  try {
    // Calculate data size before creating optimized version
    const fullSize = JSON.stringify(user).length;
    console.log(`[authUtils] Full user data size: ${fullSize} bytes`);
    
    // Create a very lightweight version of user data for storage
    const essentialUserData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isApproved: user.isApproved,
      totalPoints: user.totalPoints,
      imgUrl: user.imgUrl,
      // Only include the most essential data, no large arrays
      attachments: user.attachments ? {
        balance: user.attachments.balance,
        processedAt: user.attachments.processedAt,
        // Only keep last 3 transactions to minimize size
        transactions: user.attachments.transactions?.slice(-3) || []
      } : null,
      // Only keep last 5 points history entries
      pointsHistory: user.pointsHistory?.slice(-5) || [],
      voiceUsageCount: user.voiceUsageCount,
      voiceUsageLimit: user.voiceUsageLimit,
      lastActiveAt: user.lastActiveAt
    };

    // Check if delivery user needs status
    if (user?.role === 'delivery') {
      essentialUserData.deliveryStatus = deliveryStatus || user.deliveryStatus || 'pending';
    }

    const optimizedSize = JSON.stringify(essentialUserData).length;
    console.log(`[authUtils] Optimized user data size: ${optimizedSize} bytes`);
    
    // If still too large, use ultra-minimal version
    if (optimizedSize > 1800) {
      const minimalUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        totalPoints: user.totalPoints,
        imgUrl: user.imgUrl,
        deliveryStatus: user?.role === 'delivery' ? (deliveryStatus || user.deliveryStatus || 'pending') : undefined
      };
      const minimalSize = JSON.stringify(minimalUser).length;
      console.log(`[authUtils] Using minimal user data size: ${minimalSize} bytes`);
      await SecureStore.setItemAsync('user', JSON.stringify(minimalUser));
      console.log('[authUtils] Stored minimal user data to avoid size limit');
    } else {
      await SecureStore.setItemAsync('user', JSON.stringify(essentialUserData));
      console.log('[authUtils] User data stored successfully (size optimized)');
    }
  } catch (error) {
    console.error('[authUtils] Error storing user:', error);
    // Ultimate fallback: store only authentication essentials
    try {
      const ultraMinimalUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        totalPoints: user.totalPoints
      };
      await SecureStore.setItemAsync('user', JSON.stringify(ultraMinimalUser));
      console.log('[authUtils] Stored ultra-minimal user data as fallback');
    } catch (fallbackError) {
      console.error('[authUtils] Failed to store even ultra-minimal user data:', fallbackError);
    }
  }
}

export async function setDeliveryStatus(status) {
  try  {
    const user = await getLoggedInUser();
    if (user) {
      user.deliveryStatus = status;
      await setLoggedInUser(user);
      console.log('[authUtils] Delivery status updated:', status);
    } else {
      console.warn('[authUtils] No user found to update delivery status');
    }
  } catch (error) {
    console.error('[authUtils] Error updating delivery status:', error);
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('sessionId');
  } catch {}
}
