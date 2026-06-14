import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { AlphaFeedbackMessage } from "@lifeplate/shared";
import { useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { fetchAlphaFeedbackMessages, sendAlphaFeedbackMessage } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { spacing } from "@/src/theme/lifeplate";

const POLL_MS = 5000;
const TAB_BAR_HEIGHT = 56;

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shouldShowBubble(segments: string[], hasSession: boolean) {
  if (!hasSession) return false;
  const root = segments[0];
  if (root === "(auth)" || root === "auth") return false;
  return true;
}

function MessageBubble({
  item,
  isOwn,
}: {
  item: AlphaFeedbackMessage;
  isOwn: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isOwn ? theme.colors.primary : theme.colors.surfaceVariant,
          },
        ]}
      >
        {!isOwn ? (
          <Text
            variant="labelSmall"
            style={[styles.authorName, { color: theme.colors.secondary }]}
          >
            {item.authorName}
          </Text>
        ) : null}
        <Text
          variant="bodyMedium"
          style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface }}
        >
          {item.message}
        </Text>
        <Text
          variant="labelSmall"
          style={[
            styles.messageTime,
            { color: isOwn ? `${theme.colors.onPrimary}B3` : theme.colors.onSurfaceVariant },
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function AlphaFeedbackBubble() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AlphaFeedbackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<AlphaFeedbackMessage>>(null);

  const visible = shouldShowBubble(segments, !!session);
  const onTabs = segments[0] === "(tabs)";
  const bubbleBottom = insets.bottom + (onTabs ? TAB_BAR_HEIGHT : 0) + spacing.md;

  const loadMessages = useCallback(async () => {
    try {
      const next = await fetchAlphaFeedbackMessages();
      setMessages(next);
      setError(null);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadMessages().finally(() => setLoading(false));

    const timer = setInterval(() => {
      void loadMessages();
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [open, loadMessages]);

  useEffect(() => {
    if (!open || messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [open, messages.length]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const sent = await sendAlphaFeedbackMessage(text);
      setDraft("");
      setMessages((prev) => [...prev, sent]);
      setError(null);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [draft, sending]);

  if (!visible) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open alpha feedback chat"
        onPress={() => setOpen(true)}
        style={[
          styles.fab,
          {
            bottom: bubbleBottom,
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons name="message-text-outline" size={24} color={theme.colors.onPrimary} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modalRoot, { backgroundColor: theme.colors.background }]}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + spacing.sm,
                borderBottomColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.headerText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Alpha feedback
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Share thoughts with other testers — everyone in the alpha can see this chat.
              </Text>
            </View>
            <IconButton icon="close" onPress={() => setOpen(false)} accessibilityLabel="Close chat" />
          </View>

          {loading && messages.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.messageList,
                messages.length === 0 ? styles.messageListEmpty : null,
              ]}
              renderItem={({ item }) => (
                <MessageBubble item={item} isOwn={item.userId === session?.user.id} />
              )}
              ListEmptyComponent={
                <Text
                  variant="bodyMedium"
                  style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
                >
                  No messages yet. Be the first to share feedback on the app.
                </Text>
              }
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <View
              style={[
                styles.composer,
                {
                  paddingBottom: insets.bottom + spacing.sm,
                  borderTopColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <TextInput
                mode="outlined"
                placeholder="Bug reports, ideas, first impressions…"
                value={draft}
                onChangeText={setDraft}
                multiline
                maxLength={2000}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                editable={!sending}
              />
              <IconButton
                icon={sending ? "loading" : "send"}
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor={theme.colors.onPrimary}
                disabled={!draft.trim() || sending}
                onPress={() => void handleSend()}
                accessibilityLabel="Send feedback"
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={4000}>
        {error}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: 4,
    paddingTop: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  messageListEmpty: {
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  messageRow: {
    marginBottom: spacing.sm,
    maxWidth: "88%",
  },
  messageRowOwn: {
    alignSelf: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  authorName: {
    fontWeight: "600",
  },
  messageTime: {
    alignSelf: "flex-end",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "transparent",
  },
  inputOutline: {
    borderRadius: 16,
  },
});
