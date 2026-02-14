import { useCallback, useRef, useState } from "react";

export type ChatMessage = { type: "ai" | "user"; text: string };

const BASE_URL =
  "https://us-central1-medwrapper.cloudfunctions.net/api";

export function useChat() {
  const [chatArray, setChatArray] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<string | null>(null);
  const chatRef = useRef<ChatMessage[]>([]);

  const setImage = useCallback((base64: string) => {
    imageRef.current = base64;
  }, []);

  const send = useCallback(async (text?: string) => {
    if (!imageRef.current) return;

    const userMessage: ChatMessage = { type: "user", text: text || "" };
    const updated = [...chatRef.current, userMessage];
    chatRef.current = updated;
    setChatArray(updated);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          image_base64: imageRef.current,
          chat: updated,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      chatRef.current = data.chatArray;
      setChatArray(data.chatArray);
      setIsLoading(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred";
      setIsLoading(false);
      setError(message);
    }
  }, []);

  const retry = useCallback(() => {
    const msgs = chatRef.current;
    if (msgs.length === 0) return;
    // Find the last user message and re-send it
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].type === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserText = msgs[lastUserIdx].text;
    // Remove it so send() will re-add it
    chatRef.current = msgs.slice(0, lastUserIdx);
    setChatArray(chatRef.current);
    setError(null);
    send(lastUserText);
  }, [send]);

  const reset = useCallback(() => {
    imageRef.current = null;
    chatRef.current = [];
    setChatArray([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const hasImage = imageRef.current !== null;

  return { chatArray, isLoading, error, hasImage, setImage, send, reset, retry };
}
