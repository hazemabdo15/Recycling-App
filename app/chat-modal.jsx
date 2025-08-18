import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors, borderRadius, spacing, shadows, typography } from '../styles/theme';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { t } from 'i18next';

const MessageItem = React.memo(({ msg }) => (
    <View 
        style={[
            styles.message, 
            msg.type === 'user' ? styles.userMsg : styles.aiMsg,
            shadows.small
        ]}
    >
        <Text style={msg.type === 'user' ? styles.userText : styles.aiText}>
            {msg.content}
        </Text>
        {msg.tips && msg.tips.map((tip, i) => (
            <Text key={`${msg.id}-tip-${i}`} style={styles.tipText}>• {tip}</Text>
        ))}
    </View>
), (prevProps, nextProps) => {
    return prevProps.msg.id === nextProps.msg.id && 
           prevProps.msg.content === nextProps.msg.content;
});
MessageItem.displayName = "MessageItem";

export default function ChatModal() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef();
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const placeholders = [
        t("chatModal.howToDisposeOldElectronics"),
        t("chatModal.canRecyclePlasticBottles"),
        t("chatModal.whatAboutPizzaBoxes"),
        t("chatModal.howToDonateClothes"),
        t("chatModal.areBatteriesRecyclable"),
        t("chatModal.howToDisposeMedications"),
        t("chatModal.whatToDoWithBrokenGlass"),
        t("chatModal.canRecycleFurniture")
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    const parseResponse = useCallback((text) => {
        const cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '');
        const sections = cleaned.split(/\d+\.\s+/).filter(Boolean);
        return sections.map(section => {
            const lines = section.split('\n').filter(Boolean);
            const title = lines[0];
            const tips = lines.slice(1)
                .filter(line => line.startsWith('-') || line.startsWith('•'))
                .map(line => line.replace(/^[-•]\s*/, ''));
            return { title, tips };
        });
    }, []);

    const formatMessagesForAPI = useCallback((messages, newQuery = null) => {
        const systemMessage = {
            role: "system",
            content: "You are a helpful AI assistant that provides information about recycling, waste disposal, and environmental topics. Remember the conversation context and refer to previous messages when relevant."
        };

        const conversationHistory = messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        const allMessages = [systemMessage, ...conversationHistory];
        if (newQuery) {
            allMessages.push({ role: "user", content: newQuery });
        }

        if (allMessages.length > 21) {
            return [systemMessage, ...allMessages.slice(-20)];
        }

        return allMessages;
    }, []);

    const callApi = useCallback(async (query) => {
        if (isLoading) return;

        const userMsg = { id: Date.now(), type: 'user', content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setIsLoading(true);
        setInputValue('');

        try {
            const apiMessages = formatMessagesForAPI(messages, query);

            const response = await axios.post('https://api.fireworks.ai/inference/v1/chat/completions', {
                model: "accounts/fireworks/models/llama4-maverick-instruct-basic",
                messages: apiMessages,
                max_tokens: 1000,
                temperature: 0.7,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.EXPO_PUBLIC_FIREWORKS_API_KEY}`
                }
            });

            const reply = response.data.choices?.[0]?.message?.content || "Sorry, no response.";
            const parsed = parseResponse(reply);
            const aiMsg = {
                id: Date.now() + 1,
                type: 'ai',
                content: reply,
                title: parsed[0]?.title,
                tips: parsed[0]?.tips,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('API Error:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 2,
                type: 'ai',
                content: 'There was an error processing your request. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
            setIsLoading(false);
        }
    }, [isLoading, parseResponse, messages, formatMessagesForAPI]);

    const clearHistory = useCallback(() => {
        setMessages([]);
    }, []);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        callApi(inputValue);
    };

    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 50);
            });
        }
    }, [messages.length]);

    return (
        <Modal transparent={true} animationType="slide">
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <View style={styles.aiIcon}>
                                <MaterialCommunityIcons name="robot-outline" size={24} color="white" />
                            </View>
                            <Text style={styles.headerTitle}>{t("chatModal.title")}</Text>
                        </View>
                        <View style={styles.headerActions}>
                            {messages.length > 0 && (
                                <TouchableOpacity 
                                    onPress={clearHistory} 
                                    style={styles.clearButton}
                                >
                                    <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => router.back()}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.container}>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <MessageItem msg={item} />}
                            contentContainerStyle={{ padding: spacing.md }}
                            ref={scrollViewRef}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={10}
                            updateCellsBatchingPeriod={50}
                            initialNumToRender={20}
                            windowSize={10}
                            ListFooterComponent={
                                isTyping ? (
                                    <View style={styles.typingBubble}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                ) : null
                            }
                        />

                        <View style={styles.inputContainer}>
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                placeholder={placeholders[currentPlaceholder]}
                                placeholderTextColor={colors.textTertiary}
                                style={styles.input}
                                multiline
                                textAlignVertical="top"
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                style={[
                                    styles.sendButton,
                                    (!inputValue.trim() || isTyping) && styles.disabledSend
                                ]}
                            >
                                <Ionicons name="send" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '70%', 
        width: '100%',
        backgroundColor: colors.base100,
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
        overflow: 'hidden',
        ...shadows.large,
    },
    container: {
        flex: 1,
        backgroundColor: colors.base100,
        paddingTop: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
        paddingBottom: spacing.sm,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderColor: colors.base200,
        ...shadows.small,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiIcon: {
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    headerTitle: {
        ...typography.subtitle,
        fontWeight: '600',
        color: colors.text,
    },
    clearButton: {
        padding: 4,
    },
    chatArea: {
        flex: 1,
    },
    message: {
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        maxWidth: '80%',
        minHeight: 60,
    },
    userMsg: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
    },
    aiMsg: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.base200,
    },
    userText: {
        color: colors.white,
        ...typography.body,
    },
    aiText: {
        color: colors.text,
        ...typography.body,
    },
    tipText: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
    typingBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.base200,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderColor: colors.base200,
    },
    input: {
        flex: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.base300,
        marginRight: spacing.sm,
        maxHeight: 100,
        ...typography.body,
        color: colors.text,
    },
    sendButton: {
        backgroundColor: colors.primary,
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    disabledSend: {
        backgroundColor: colors.base400,
    }
});