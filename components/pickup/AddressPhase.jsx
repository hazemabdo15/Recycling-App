import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';

import { t } from 'i18next';
import { CITIES } from '../../utils/deliveryFees';
import { AnimatedButton } from '../common';

const AREAS = {
  'Cairo': ['Nasr City', 'Maadi', 'Heliopolis', 'Zamalek', 'Downtown', 'New Cairo'],
  'Alexandria': ['Stanley', 'Montaza', 'Sidi Gaber', 'Gleem', 'Sporting'],
  'Giza': ['Dokki', 'Mohandessin', 'Agouza', '6th October', 'Sheikh Zayed'],
};

const AddressPhase = ({ onNext, onAddressSelect, onBack, pickupWorkflow }) => {
  const { isLoggedIn, user } = useAuth();
  const { tRole } = useLocalization();
  const hasFetchedAddresses = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    landmark: '',
    notes: '',
  });

  useEffect(() => {
    console.log('AddressPhase mounted, checking authentication...');
    console.log('isLoggedIn:', isLoggedIn, 'user:', user?.email, 'role:', user?.role);

    if (isLoggedIn && user?.email && pickupWorkflow?.fetchAddresses && !hasFetchedAddresses.current) {
      console.log('Fetching addresses for authenticated user:', user?._id);
      hasFetchedAddresses.current = true;

      pickupWorkflow.fetchAddresses();
    } else if (!isLoggedIn) {
      console.log('User not authenticated, skipping address fetch');
      hasFetchedAddresses.current = false;
    }

  }, [isLoggedIn, pickupWorkflow, user?._id, user?.email, user?.role]);

  useEffect(() => {
    return () => {
      hasFetchedAddresses.current = false;
    };
  }, [user?.email]);

  const handleAddressSelect = (address) => {
    console.log('[AddressPhase] Address selected:', address);
    console.log('[AddressPhase] onAddressSelect type:', typeof onAddressSelect);
    console.log('[AddressPhase] onNext type:', typeof onNext);
    
    try {

      if (onAddressSelect && typeof onAddressSelect === 'function') {
        console.log('[AddressPhase] Calling onAddressSelect...');
        onAddressSelect(address);
        console.log('[AddressPhase] onAddressSelect completed');
      }

      setTimeout(() => {

        if (onNext && typeof onNext === 'function') {
          console.log('[AddressPhase] Calling onNext after delay...');
          onNext();
          console.log('[AddressPhase] onNext completed');
        }
      }, 100);
    } catch (error) {
      console.error('[AddressPhase] Error in handleAddressSelect:', error);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      city: address.city || '',
      area: address.area || '',
      street: address.street || '',
      building: address.building || '',
      floor: address.floor || '',
      apartment: address.apartment || '',
      landmark: address.landmark || '',
      notes: address.notes || '',
    });
    setShowForm(true);
  };

  const handleDeleteAddress = (address) => {
    Alert.alert(
      t("pickup.addressPhase.deleteAddress"),
      t("pickup.addressPhase.deleteMessage"),
      [
        { text: t("common.cancel"), style: 'cancel' },
        {
          text: t("common.delete"),
          style: 'destructive',
          onPress: async () => {
            try {
              await pickupWorkflow.deleteAddress(address._id);
            } catch (_error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleSaveAddress = async () => {
    if (!formData.city || !formData.area || !formData.street) {
      Alert.alert('Required Fields', 'Please fill in city, area, and street address');
      return;
    }

    try {
      if (editingAddress) {
        await pickupWorkflow.updateAddress(editingAddress._id, formData);
      } else {
        const newAddress = await pickupWorkflow.createAddress(formData);
        // ✅ Auto-select the newly created address
        if (newAddress && onAddressSelect && typeof onAddressSelect === 'function') {
          console.log('[AddressPhase] Auto-selecting newly created address:', newAddress);
          onAddressSelect(newAddress);
        }
      }
      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        city: '',
        area: '',
        street: '',
        building: '',
        floor: '',
        apartment: '',
        landmark: '',
        notes: '',
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save address');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData({
      city: '',
      area: '',
      street: '',
      building: '',
      floor: '',
      apartment: '',
      landmark: '',
      notes: '',
    });
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity style={styles.addressCard} onPress={() => handleAddressSelect(item)}>
      <View style={styles.addressInfo}>
        <Text style={styles.addressTitle}>
          {item.building && t("pickup.addressPhase.building", { building: item.building })}
          {item.street}
        </Text>
        <Text style={styles.addressDetails}>
          {item.area}, {item.city}
        </Text>
        {item.landmark && (
          <Text style={styles.addressLandmark}>{t("pickup.addressPhase.near", { landmark: item.landmark })}</Text>
        )}
      </View>
      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(item)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteAddress(item)}
        >
          <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (showForm) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingAddress ? t('pickup.reviewPhase.editAddress') : t('pickup.reviewPhase.addAddress')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("pickup.reviewPhase.selectCity")}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value, area: '' })}
                style={styles.picker}
              >
                <Picker.Item label={t("pickup.reviewPhase.selectCityLabel")} value="" />
                {CITIES.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          </View>

          {formData.city && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("pickup.reviewPhase.selectArea")}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.area}
                  onValueChange={(value) => setFormData({ ...formData, area: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Area --" value="" />
                  {(AREAS[formData.city] || []).map((area) => (
                    <Picker.Item key={area} label={area} value={area} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("pickup.reviewPhase.streetAddress")}</Text>
            <TextInput
              style={styles.textInput}
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
              placeholder="e.g. El-Central street"
              placeholderTextColor={colors.base300}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("pickup.reviewPhase.landmark")}</Text>
            <TextInput
              style={styles.textInput}
              value={formData.landmark}
              onChangeText={(text) => setFormData({ ...formData, landmark: text })}
              placeholder="e.g. El-Asdekaa Market"
              placeholderTextColor={colors.base300}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>{t("pickup.reviewPhase.building")}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.building}
                onChangeText={(text) => setFormData({ ...formData, building: text })}
                placeholder="Building"
                placeholderTextColor={colors.base300}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.label}>{t("pickup.reviewPhase.floor")}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.floor}
                onChangeText={(text) => setFormData({ ...formData, floor: text })}
                placeholder="Floor"
                placeholderTextColor={colors.base300}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>{t("pickup.reviewPhase.apartment")}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.apartment}
                onChangeText={(text) => setFormData({ ...formData, apartment: text })}
                placeholder="Apartment"
                placeholderTextColor={colors.base300}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.label}>{t("pickup.reviewPhase.notes")}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="e.g. Don't ring the bell"
                placeholderTextColor={colors.base300}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelForm}>
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <AnimatedButton
              style={styles.saveButton}
              onPress={handleSaveAddress}
              disabled={pickupWorkflow.loading}
            >
              <Text style={styles.saveButtonText}>
                {pickupWorkflow.loading ? t("common.saving") : t("common.save")}
              </Text>
            </AnimatedButton>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tRole('address.select', user?.role)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
          <Text style={styles.addButtonText}>{t("pickup.reviewPhase.addAddress")}</Text>
        </TouchableOpacity>
      </View>

      {pickupWorkflow.loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : (() => {

        let addresses = pickupWorkflow.addresses;
        if (user?.role === 'buyer' && user?._id) {
          addresses = addresses.filter(addr => {
            let addrUserId = addr.userId;
            if (typeof addrUserId === 'object' && addrUserId.$oid) {
              addrUserId = addrUserId.$oid;
            }
            const userIdStr = String(user._id);
            const addrUserIdStr = String(addrUserId);

            if (addrUserIdStr !== userIdStr) {
              console.log('[AddressPhase] Skipping address:', addr, 'addrUserId:', addrUserIdStr, 'user._id:', userIdStr);
            }
            return addrUserIdStr === userIdStr;
          });
        }
        if (addresses.length > 0) {
          return (
            <FlatList
              data={addresses}
              renderItem={renderAddressItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          );
        } else {
          return (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color={colors.base300} />
              <Text style={styles.emptyTitle}>No addresses found</Text>
              <Text style={styles.emptySubtitle}>Add your first address to get started</Text>
            </View>
          );
        }
      })()}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
  },
  addButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.neutral,
    textAlign: 'center',
  },
  listContainer: {
    padding: spacing.lg,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    ...typography.subtitle,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  addressDetails: {
    ...typography.body,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  addressLandmark: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.base100,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
  },
  backButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '600',
  },

  formContainer: {
    padding: spacing.xl,
  },
  formTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.base200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.base100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.base200,
  },
  cancelButtonText: {
    ...typography.subtitle,
    color: colors.neutral,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
  },
});

export default AddressPhase;
