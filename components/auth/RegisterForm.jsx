import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const RegisterForm = ({ onSubmit, loading}) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmShowPassword, setConfirmShowPassword] = useState(false);
    const [role, setRole] = useState('user');
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up Now!</Text>
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder='Mobile Number 01xxxxx-xxxx'
                value={number}
                keyboardType='phone-pad'
                onChangeText={setNumber}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />
            <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: 12 }}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                    </Pressable>
            </View>
            {/* <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            /> */}
            <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm Password"
                      secureTextEntry={!confirmShowPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <Pressable
                      onPress={() => setConfirmShowPassword(!confirmShowPassword)} style={{ position: 'absolute', right: 10, top: 12 }}
                      accessibilityLabel={confirmShowPassword ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons name={confirmShowPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                    </Pressable>
            </View>
            {/* <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                secureTextEntry
                onChangeText={setConfirmPassword}
            /> */}

            <Text style={styles.label}>Registering as:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                    style={styles.picker}
                    >
                    <Picker.Item label="User" value="user" />
                    <Picker.Item label="Buyer" value="buyer" />
                    </Picker>
                </View>
            <Pressable
                disabled={loading}
                onPress={() =>
                    onSubmit({ name, number, email, password, confirmPassword, role })
                }
                style={[styles.button, loading && { opacity: 0.5 }]}
                >
                <Text>{loading ? "Please wait..." : "Register"}</Text>
            </Pressable>

            <Pressable
                 onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, marginTop: 100 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: colors.primary },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 10, borderRadius: 5 },
    label: { fontSize: 16, marginBottom: 5 },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    button: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16
    },
    linkText: {
        marginTop: 15,
        textAlign: 'center',
        color: colors.primary,
        textDecorationLine: 'underline'
    },
    passwordContainer: {
        width: '100%',
        maxWidth: 350,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        padding: 12,
    },
})

export default RegisterForm;
