import { useCallback, useRef, useState } from "react";

export type ChatMessage = { type: "assistant" | "user"; text: string };

const BASE_URL =
  "https://us-central1-medwrapper.cloudfunctions.net/api";

export function useChat() {
  const [chatArray, setChatArray] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<ChatMessage[]>([]);

  const analyzeImage = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setError(null);
    chatRef.current = [];
    setChatArray([]);

    try {
      const response = await fetch(`${BASE_URL}/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ image_base64: base64 }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const initial: ChatMessage[] = [{ type: "assistant", text: data.text }];
      chatRef.current = initial;
      setChatArray(initial);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const send = useCallback(async (text: string) => {
    const userMessage: ChatMessage = { type: "user", text };
    const updated = [...chatRef.current, userMessage];
    chatRef.current = updated;
    setChatArray(updated);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/llm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ chatArray: updated }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      chatRef.current = data.chatArray;
      setChatArray(data.chatArray);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    const msgs = chatRef.current;
    if (msgs.length === 0) return;
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].type === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserText = msgs[lastUserIdx].text;
    chatRef.current = msgs.slice(0, lastUserIdx);
    setChatArray(chatRef.current);
    setError(null);
    send(lastUserText);
  }, [send]);

  const reset = useCallback(() => {
    chatRef.current = [];
    setChatArray([]);
    setIsLoading(false);
    setIsAnalyzing(false);
    setError(null);
  }, []);

  return { chatArray, isLoading, isAnalyzing, error, analyzeImage, send, reset, retry };
}
