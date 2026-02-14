import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, StyleSheet, TouchableOpacity, Text, View } from 'react-native';

interface ImageSourceButtonsProps {
  onTakePhoto: () => void;
  onChooseFile: () => void;
  disabled?: boolean;
}

export function ImageSourceButtons({ onTakePhoto, onChooseFile, disabled }: ImageSourceButtonsProps) {
  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onTakePhoto}
          disabled={disabled}
          activeOpacity={0.7}>
          <MaterialIcons name="camera-alt" size={22} color="#fff" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onChooseFile}
        disabled={disabled}
        activeOpacity={0.7}>
        <MaterialIcons name="photo-library" size={22} color="#fff" />
        <Text style={styles.buttonText}>
          {Platform.OS === 'web' ? 'Upload File' : 'Choose File'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
