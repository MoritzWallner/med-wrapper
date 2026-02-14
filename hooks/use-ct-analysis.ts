import { useState } from "react";

interface CTAnalysisState {
  result: string | null;
  isLoading: boolean;
  error: string | null;
}

const API_URL =
  "https://mqtchfp0ykdm3gum.us-east-1.aws.endpoints.huggingface.cloud";

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          inputs: {
            image: `data:image/jpeg;base64,${base64Image}`,
            text: `Analyze this CT scan and provide a detailed assessment including:

1.Anatomical Region*: Identify the body part and scan plane (axial/coronal/sagittal)

2.Image Quality*: Comment on contrast, resolution, and any artifacts

3.Normal Findings*: Describe normal anatomical structures visible

4.Abnormalities*: Identify any conditions or abnormalities present, including:
   - Location and size
   - Density/appearance characteristics
   - Clinical significance

5.Differential Diagnoses*: List possible conditions based on findings

6.Recommendations*: Suggest any follow-up imaging or clinical correlation needed

Please provide a structured, clinically-oriented analysis.`,
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
        ? (data[0]?.generated_text ?? "")
        : (data.generated_text ?? "");
      setState({ result: text.trim(), isLoading: false, error: null });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred";
      setState({ result: null, isLoading: false, error: message });
    }
  }

  function reset() {
    setState({ result: null, isLoading: false, error: null });
  }

  return { ...state, analyze, reset };
}
