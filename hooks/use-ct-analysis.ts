import { useState } from 'react';

interface CTAnalysisState {
  result: string | null;
  isLoading: boolean;
  error: string | null;
}

const API_URL = 'https://your-api-endpoint.example.com/analyze';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setState({ result: data.result ?? data.analysis ?? '', isLoading: false, error: null });
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
