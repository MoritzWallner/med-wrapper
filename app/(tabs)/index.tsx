import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChat } from '@/hooks/use-chat';
import { ImageSourceButtons } from '@/components/image-source-buttons';
import { ChatBubble } from '@/components/chat-bubble';
import { CropModal } from '@/components/crop-modal';
import { useHistory } from '@/contexts/history-context';

export default function AnalyzeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { chatArray, isLoading, error, hasImage, setImage, send, reset, retry } = useChat();
  const [inputText, setInputText] = useState('');
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { addEntry, updateEntry } = useHistory();
  const hasChatStarted = chatArray.length > 0;
  const historyIdRef = useRef<string | null>(null);

  function saveToHistory() {
    if (chatArray.length === 0) return;
    if (!chatArray.some((m) => m.type === 'ai')) return;

    if (!historyIdRef.current) {
      const firstUser = chatArray.find((m) => m.type === 'user');
      const title = firstUser?.text?.slice(0, 60) || 'CT Analysis';
      historyIdRef.current = addEntry({
        timestamp: Date.now(),
        title,
        chatArray,
        imageUri: imageUri ?? undefined,
      });
    } else {
      updateEntry(historyIdRef.current, chatArray);
    }
  }

  // Save / update history when chat changes
  useEffect(() => { saveToHistory(); }, [chatArray]);

  function handleNewChat() {
    saveToHistory();
    reset();
    setImageReady(false);
    setImageUri(null);
    historyIdRef.current = null;
  }

  async function pickImage(source: 'camera' | 'gallery') {
    if (Platform.OS !== 'web') {
      const permissionFn =
        source === 'camera'
          ? ImagePicker.requestCameraPermissionsAsync
          : ImagePicker.requestMediaLibraryPermissionsAsync;

      const { status } = await permissionFn();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          `Please grant ${source === 'camera' ? 'camera' : 'photo library'} access in your device settings to use this feature.`
        );
        return;
      }
    }

    const launchFn =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const isWeb = Platform.OS === 'web';

    const pickerResult = await launchFn({
      mediaTypes: ['images'],
      quality: 1,
      ...(isWeb ? {} : { allowsEditing: true, aspect: [896, 869] as [number, number] }),
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    reset();
    setImageReady(false);
    setImageUri(null);

    if (isWeb) {
      setPendingCropUri(asset.uri);
    } else {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 896, height: 869 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (manipulated.base64) {
        setImage(manipulated.base64);
        setImageUri(manipulated.uri);
        setImageReady(true);
      }
    }
  }

  function handleCropDone(uri: string, base64: string) {
    setPendingCropUri(null);
    setImage(base64);
    setImageUri(uri);
    setImageReady(true);
  }

  function handleCropCancel() {
    setPendingCropUri(null);
  }

  function handleSend() {
    const text = inputText.trim();
    setInputText('');
    send(text || undefined);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const canSend = imageReady && !isLoading;
  const bgColor = isDark ? '#151718' : '#fff';
  const inputBg = isDark ? '#1e2123' : '#f4f6f8';
  const inputBorder = isDark ? '#2c3035' : '#e2e6ea';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const placeholderColor = isDark ? '#666' : '#a0a8b0';

  const isHorizontalSplit = isLandscape;

  const chatScrollContent = () => (
    <ScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        isHorizontalSplit && styles.contentSplit,
        { paddingTop: 16, paddingBottom: 16 },
      ]}
      onContentSizeChange={() => {
        if (hasChatStarted) {
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isHorizontalSplit && styles.titleCompact, { color: isDark ? '#fff' : '#11181C' }]}>
            CT Scan Analyzer
          </Text>
          {hasChatStarted && (
            <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat} activeOpacity={0.7}>
              <MaterialIcons name="add" size={18} color="#0a7ea4" />
              <Text style={styles.newChatText}>New</Text>
            </TouchableOpacity>
          )}
        </View>
        {!isHorizontalSplit && (
          <Text style={[styles.subtitle, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            {hasChatStarted
              ? 'Ask follow-up questions about your scan'
              : 'Upload a CT scan image for AI-powered analysis'}
          </Text>
        )}
      </View>

      {/* Error */}
      {error && (
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: isDark ? '#2a1215' : '#fef2f2',
              borderColor: isDark ? '#5c2328' : '#fecaca',
            },
          ]}
        >
          <View style={styles.errorHeader}>
            <MaterialIcons name="error-outline" size={20} color="#ef4444" />
            <Text style={[styles.errorTitle, { color: isDark ? '#fca5a5' : '#dc2626' }]}>
              Request Failed
            </Text>
          </View>
          <Text style={[styles.errorMessage, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.7}>
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat messages */}
      {chatArray.map((msg, i) => (
        <ChatBubble key={i} message={msg} />
      ))}

      {/* Loading indicator inline after last message */}
      {isLoading && hasChatStarted && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0a7ea4" />
          <Text style={[styles.loadingText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Thinking...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        isHorizontalSplit && styles.inputBarSplit,
        {
          backgroundColor: bgColor,
          borderTopColor: inputBorder,
          paddingBottom: 8,
        },
      ]}
    >
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: inputBg,
            borderColor: inputBorder,
            color: textColor,
          },
        ]}
        placeholder={
          hasChatStarted ? 'Ask a follow-up...' : 'Describe what to analyze...'
        }
        placeholderTextColor={placeholderColor}
        value={inputText}
        onChangeText={setInputText}
        multiline
        editable={!isLoading}
        onSubmitEditing={canSend ? handleSend : undefined}
      />
      {isLoading ? (
        <View style={styles.sendButton}>
          <ActivityIndicator size="small" color="#0a7ea4" />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="send"
            size={22}
            color={canSend ? '#0a7ea4' : placeholderColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const leftPanel = (
    <View style={isHorizontalSplit ? styles.leftPanelLandscape : [styles.leftPanelPortrait, { height: height * 0.35 }]}>
      <Image source={{ uri: imageUri! }} contentFit="contain" style={{ flex: 1 }} />
      <TouchableOpacity
        style={styles.uploadNewButton}
        onPress={() => pickImage('gallery')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="photo-library" size={16} color="#fff" />
        <Text style={styles.uploadNewText}>Upload new</Text>
      </TouchableOpacity>
    </View>
  );

  const landingView = (
    <ScrollView contentContainerStyle={styles.landingContainer}>
      <View style={styles.landingContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#11181C' }]}>
            CT Scan Analyzer
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Upload a CT scan image for AI-powered analysis
          </Text>
        </View>
        <View
          style={[
            styles.placeholderCard,
            isHorizontalSplit && styles.placeholderCardCompact,
            { backgroundColor: inputBg, borderColor: inputBorder },
          ]}
        >
          <MaterialIcons
            name="medical-services"
            size={36}
            color={isDark ? '#3a3f44' : '#c8cdd2'}
          />
          <Text style={[styles.placeholderText, { color: placeholderColor }]}>
            Select or capture a CT scan image to begin
          </Text>
        </View>
        <ImageSourceButtons
          onTakePhoto={() => pickImage('camera')}
          onChooseFile={() => pickImage('gallery')}
          disabled={isLoading}
          vertical={isHorizontalSplit}
        />
      </View>
    </ScrollView>
  );

  const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const wrapperProps = Platform.OS === 'web'
    ? {}
    : { behavior: 'padding' as const, keyboardVerticalOffset: 90 };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: bgColor },
      ]}
      edges={['top']}
    >
      <Wrapper
        style={styles.container}
        {...wrapperProps}
      >
        {imageReady && imageUri ? (
          <View style={isHorizontalSplit ? styles.splitRow : styles.splitColumn}>
            {leftPanel}
            {isHorizontalSplit && <View style={[styles.divider, { backgroundColor: inputBorder }]} />}
            <View style={styles.chatPanel}>
              {chatScrollContent()}
              {inputBar}
            </View>
          </View>
        ) : (
          landingView
        )}

        <CropModal
          uri={pendingCropUri}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  newChatText: {
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  placeholderCard: {
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  placeholderCardCompact: {
    minHeight: 120,
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  contentSplit: {
    maxWidth: undefined,
  },
  inputBarSplit: {
    maxWidth: undefined,
    width: '100%',
  },
  splitRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
  },
  splitColumn: {
    flex: 1,
  },
  leftPanelLandscape: {
    flex: 0.35,
    position: 'relative',
  },
  leftPanelPortrait: {
    position: 'relative',
  },
  landingContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  landingContent: {
    padding: 16,
    gap: 12,
    maxWidth: 400,
    width: '100%',
  },
  chatPanel: {
    flex: 0.65,
    overflow: 'hidden',
    minWidth: 0,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
  uploadNewButton: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadNewText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
