import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface MarkdownResultProps {
  content: string;
}

export function MarkdownResult({ content }: MarkdownResultProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const markdownStyles = useMemo(
    () =>
      ({
        body: {
          color: isDark ? '#ECEDEE' : '#11181C',
          fontSize: 15,
          lineHeight: 22,
        },
        heading1: {
          color: isDark ? '#fff' : '#11181C',
          fontSize: 24,
          fontWeight: '700' as const,
          marginTop: 16,
          marginBottom: 8,
        },
        heading2: {
          color: isDark ? '#fff' : '#11181C',
          fontSize: 20,
          fontWeight: '700' as const,
          marginTop: 14,
          marginBottom: 6,
        },
        heading3: {
          color: isDark ? '#ddd' : '#333',
          fontSize: 17,
          fontWeight: '600' as const,
          marginTop: 12,
          marginBottom: 4,
        },
        bullet_list_icon: {
          color: isDark ? '#9BA1A6' : '#687076',
        },
        ordered_list_icon: {
          color: isDark ? '#9BA1A6' : '#687076',
        },
        list_item: {
          marginVertical: 2,
        },
        code_inline: {
          backgroundColor: isDark ? '#2c3035' : '#e8ecf0',
          color: isDark ? '#e6db74' : '#c7254e',
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 2,
          fontSize: 13,
          fontFamily: 'monospace',
        },
        fence: {
          backgroundColor: isDark ? '#1a1d20' : '#f0f3f6',
          borderColor: isDark ? '#2c3035' : '#e2e6ea',
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginVertical: 8,
          fontSize: 13,
          fontFamily: 'monospace',
          color: isDark ? '#ECEDEE' : '#11181C',
        },
        blockquote: {
          backgroundColor: isDark ? '#1a1d20' : '#f8f9fa',
          borderLeftColor: '#0a7ea4',
          borderLeftWidth: 4,
          paddingLeft: 12,
          paddingVertical: 4,
          marginVertical: 8,
        },
        table: {
          borderColor: isDark ? '#2c3035' : '#e2e6ea',
          borderWidth: 1,
          borderRadius: 4,
        },
        th: {
          backgroundColor: isDark ? '#1a1d20' : '#f0f3f6',
          padding: 8,
          borderColor: isDark ? '#2c3035' : '#e2e6ea',
        },
        td: {
          padding: 8,
          borderColor: isDark ? '#2c3035' : '#e2e6ea',
        },
        link: {
          color: '#0a7ea4',
        },
        strong: {
          fontWeight: '700' as const,
        },
        hr: {
          backgroundColor: isDark ? '#2c3035' : '#e2e6ea',
          height: 1,
          marginVertical: 12,
        },
      }) as const,
    [isDark]
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1e2123' : '#f4f6f8',
          borderColor: isDark ? '#2c3035' : '#e2e6ea',
        },
      ]}>
      <Markdown style={markdownStyles}>{content}</Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
