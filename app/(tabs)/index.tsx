import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCTAnalysis } from '@/hooks/use-ct-analysis';
import { ImageSourceButtons } from '@/components/image-source-buttons';
import { MarkdownResult } from '@/components/markdown-result';
import { CropModal } from '@/components/crop-modal';

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const { result, isLoading, error, analyze, reset } = useCTAnalysis();

  const cardBg = isDark ? '#1e2123' : '#f4f6f8';
  const cardBorder = isDark ? '#2c3035' : '#e2e6ea';

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

    if (isWeb) {
      // On web, open the crop modal for interactive cropping
      setPendingCropUri(asset.uri);
    } else {
      // On native, the picker already cropped — just resize to exact dimensions
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 896, height: 869 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImageUri(manipulated.uri);
      if (manipulated.base64) {
        analyze(manipulated.base64);
      }
    }
  }

  function handleCropDone(uri: string, base64: string) {
    setPendingCropUri(null);
    setImageUri(uri);
    analyze(base64);
  }

  function handleCropCancel() {
    setPendingCropUri(null);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#11181C' }]}>
          CT Scan Analyzer
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9BA1A6' : '#687076' }]}>
          Upload a CT scan image for AI-powered analysis
        </Text>
      </View>

      {/* Image Area */}
      <View
        style={[styles.imageCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons
              name="medical-services"
              size={48}
              color={isDark ? '#3a3f44' : '#c8cdd2'}
            />
            <Text style={[styles.placeholderText, { color: isDark ? '#666' : '#a0a8b0' }]}>
              Select or capture a CT scan image to begin
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <ImageSourceButtons
        onTakePhoto={() => pickImage('camera')}
        onChooseFile={() => pickImage('gallery')}
        disabled={isLoading}
      />

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={[styles.loadingText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Analyzing scan...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={[styles.errorCard, { backgroundColor: isDark ? '#2a1215' : '#fef2f2', borderColor: isDark ? '#5c2328' : '#fecaca' }]}>
          <View style={styles.errorHeader}>
            <MaterialIcons name="error-outline" size={20} color="#ef4444" />
            <Text style={[styles.errorTitle, { color: isDark ? '#fca5a5' : '#dc2626' }]}>
              Analysis Failed
            </Text>
          </View>
          <Text style={[styles.errorMessage, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={reset} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultsSection}>
          <Text style={[styles.resultsHeading, { color: isDark ? '#fff' : '#11181C' }]}>
            Analysis Results
          </Text>
          <MarkdownResult content={result} />
        </View>
      )}

      <CropModal
        uri={pendingCropUri}
        onCropDone={handleCropDone}
        onCancel={handleCropCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  imageCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
  },
  placeholder: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 15,
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
  dismissText: {
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  resultsSection: {
    gap: 12,
  },
  resultsHeading: {
    fontSize: 20,
    fontWeight: '700',
  },
});
