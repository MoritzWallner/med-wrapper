import { useState } from 'react';

interface CTAnalysisState {
  result: string | null;
  isLoading: boolean;
  error: string | null;
}

const API_URL = 'https://mqtchfp0ykdm3gum.us-east-1.aws.endpoints.huggingface.cloud';

export function useCTAnalysis() {
  const [state, setState] = useState<CTAnalysisState>({
    result: null,
    isLoading: false,
    error: null,
  });

  async function analyze(base64Image: string) {
    setState({ result: null, isLoading: true, error: null });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            image: `data:image/jpeg;base64,${base64Image}`,
            text: 'Describe this medical image',
          },
          parameters: { max_new_tokens: 1024 },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const text = Array.isArray(data)
        ? (data[0]?.generated_text ?? '')
        : (data.generated_text ?? '');
      setState({ result: text.trim(), isLoading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred';
      setState({ result: null, isLoading: false, error: message });
    }
  }

  function reset() {
    setState({ result: null, isLoading: false, error: null });
  }

  return { ...state, analyze, reset };
}
