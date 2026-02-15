export interface CropModalProps {
  uri: string | null;
  onCropDone: (uri: string, base64: string) => void;
  onCancel: () => void;
  isAnalyzing?: boolean;
}

/**
 * Native stub — on iOS/Android the picker's built-in crop UI is used instead.
 */
export function CropModal(_props: CropModalProps) {
  return null;
}
