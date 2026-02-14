import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { MarkdownResult } from '@/components/markdown-result';
import type { ChatMessage } from '@/hooks/use-chat';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (message.type === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <MarkdownResult content={message.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
