import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHistory, type HistoryEntry } from '@/contexts/history-context';
import { ChatBubble } from '@/components/chat-bubble';

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
}

function HistoryCard({ entry, isDark }: { entry: HistoryEntry; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cardBg = isDark ? '#1e2123' : '#f4f6f8';
  const cardBorder = isDark ? '#2c3035' : '#e2e6ea';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]} numberOfLines={expanded ? undefined : 1}>
            {entry.title}
          </Text>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={22}
            color={isDark ? '#9BA1A6' : '#687076'}
          />
        </View>
        <Text style={[styles.cardTimestamp, { color: isDark ? '#9BA1A6' : '#687076' }]}>
          {formatTimestamp(entry.timestamp)}
        </Text>
      </View>
      {expanded && (
        <View style={styles.chatList}>
          {entry.chatArray.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { entries } = useHistory();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]} edges={['top']}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#11181C' }]}>History</Text>
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={48} color={isDark ? '#3a3f44' : '#c8cdd2'} />
          <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            No conversations yet. Start analyzing a CT scan to see your history here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard entry={item} isDark={isDark} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardTimestamp: {
    fontSize: 13,
  },
  chatList: {
    marginTop: 12,
    gap: 8,
  },
});
