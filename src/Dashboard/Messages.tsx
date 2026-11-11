import DashboardLayout from "./DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  UserRound,
  MoreVertical,
  LogOut,
  VolumeX,
  Volume2,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import {
  ApiError,
  chatService,
  unwrapConversation,
  unwrapConversations,
  unwrapMessages,
  unwrapUsers,
  type ChatMessage,
  type ChatUserSummary,
  type Conversation,
} from "@/api";
import { useAuth } from "@/context/useAuth";
import { getUserDisplayName } from "@/lib/user";
import { sanitizeText } from "@/lib/validation";
import {
  conversationMembers,
  conversationSubtitle,
  conversationTitle,
  formatChatTime,
  initialsFromUser,
  isOwnMessage,
  lastMessagePreview,
  messageSender,
} from "@/lib/chat";

type FilterTab = "all" | "direct" | "group";
type ComposeMode = "direct" | "group" | null;

const POLL_MS = 4000;
const MAX_MESSAGE_LENGTH = 2000;

function Avatar({ user, label }: { user?: ChatUserSummary | null; label?: string }) {
  const text = label || initialsFromUser(user);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2C6E49]/15 text-sm font-bold text-[#2C6E49]">
      {text}
    </div>
  );
}

const Messages = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [composeMode, setComposeMode] = useState<ComposeMode>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<ChatUserSummary[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [pickedUsers, setPickedUsers] = useState<ChatUserSummary[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = "Messages | AGRISENSE";
  }, []);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const type = filter === "all" ? undefined : filter;
      const res = await chatService.listConversations(type);
      const rows = unwrapConversations(res).sort((a, b) => {
        const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setConversations(rows);
      if (!silent) setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : "Failed to load conversations.");
      }
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [filter]);

  const loadThread = useCallback(
    async (conversationId: string, silent = false) => {
      if (!silent) setLoadingThread(true);
      try {
        const [convRes, msgRes] = await Promise.all([
          chatService.getConversation(conversationId),
          chatService.getMessages(conversationId, { page: 1, limit: 100 }),
        ]);
        const conv = unwrapConversation(convRes);
        const msgs = unwrapMessages(msgRes).slice().sort((a, b) => {
          return (
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
        });
        setSelected(conv);
        setMessages(msgs);
        await chatService.markRead(conversationId).catch(() => undefined);
        if (!silent) setError(null);
      } catch (err) {
        if (!silent) {
          setError(err instanceof ApiError ? err.message : "Failed to load messages.");
        }
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadConversations();
    listPollRef.current = setInterval(() => loadConversations(true), POLL_MS);
    return () => {
      if (listPollRef.current) clearInterval(listPollRef.current);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setMessages([]);
      if (threadPollRef.current) clearInterval(threadPollRef.current);
      return;
    }
    loadThread(selectedId);
    threadPollRef.current = setInterval(() => loadThread(selectedId, true), POLL_MS);
    return () => {
      if (threadPollRef.current) clearInterval(threadPollRef.current);
    };
  }, [selectedId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  useEffect(() => {
    if (!composeMode) return;
    const handle = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await chatService.searchUsers(userQuery.trim());
        setUserResults(
          unwrapUsers(res).filter((item) => item.id && item.id !== currentUserId),
        );
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [composeMode, userQuery, currentUserId]);

  const filteredConversations = useMemo(() => conversations, [conversations]);

  const openCompose = (mode: ComposeMode) => {
    setComposeMode(mode);
    setUserQuery("");
    setUserResults([]);
    setPickedUsers([]);
    setGroupName("");
    setInfo(null);
    setError(null);
  };

  const togglePick = (person: ChatUserSummary) => {
    setPickedUsers((prev) => {
      if (prev.some((item) => item.id === person.id)) {
        return prev.filter((item) => item.id !== person.id);
      }
      if (composeMode === "direct") return [person];
      return [...prev, person];
    });
  };

  const createConversation = async () => {
    if (!pickedUsers.length) {
      setError("Select at least one person.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      let created: Conversation | null = null;
      if (composeMode === "direct") {
        const res = await chatService.createDirect({ userId: pickedUsers[0].id });
        created = unwrapConversation(res);
      } else {
        const name = sanitizeText(groupName).slice(0, 80);
        if (!name) {
          setError("Enter a group name.");
          setCreating(false);
          return;
        }
        const res = await chatService.createGroup({
          name,
          memberIds: pickedUsers.map((item) => item.id),
        });
        created = unwrapConversation(res);
      }
      setComposeMode(null);
      await loadConversations();
      if (created?.id) setSelectedId(created.id);
      setInfo(composeMode === "group" ? "Group created." : "Chat opened.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start chat.");
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const content = sanitizeText(draft).slice(0, MAX_MESSAGE_LENGTH);
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const res = await chatService.sendMessage(selectedId, { content });
      const created =
        res && typeof res === "object" && "content" in res
          ? (res as ChatMessage)
          : ((res as { message?: ChatMessage }).message ?? null);
      if (created) {
        setMessages((prev) => [...prev, created]);
      } else {
        await loadThread(selectedId, true);
      }
      setDraft("");
      await loadConversations(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const content = sanitizeText(editDraft).slice(0, MAX_MESSAGE_LENGTH);
    if (!content) return;
    try {
      const updated = await chatService.updateMessage(editingId, { content });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === editingId ? { ...msg, ...updated, content } : msg)),
      );
      setEditingId(null);
      setEditDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to edit message.");
    }
  };

  const removeMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deletedAt: new Date().toISOString(), content: "" } : msg,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete message.");
    }
  };

  const leaveConversation = async () => {
    if (!selectedId) return;
    if (!confirm("Leave this conversation?")) return;
    try {
      await chatService.leave(selectedId);
      setSelectedId(null);
      setMenuOpen(false);
      await loadConversations();
      setInfo("You left the conversation.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to leave conversation.");
    }
  };

  const toggleMute = async () => {
    if (!selectedId || !selected) return;
    const nextMuted = !selected.muted;
    try {
      await chatService.mute(selectedId, { muted: nextMuted });
      setSelected({ ...selected, muted: nextMuted });
      setMenuOpen(false);
      setInfo(nextMuted ? "Conversation muted." : "Conversation unmuted.");
      await loadConversations(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update mute.");
    }
  };

  const deleteGroup = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this group for everyone? Only the creator can do this.")) return;
    try {
      await chatService.deleteGroup(selectedId);
      setSelectedId(null);
      setMenuOpen(false);
      await loadConversations();
      setInfo("Group deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete group.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100dvh-4.5rem)] flex-col bg-white p-3 sm:p-4 md:h-[calc(100vh-2rem)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#0B6E4F]">Messages</h1>
            <p className="text-sm text-gray-500">Direct chats and farmer groups</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openCompose("direct")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2C6E49] px-3 py-2 text-sm font-semibold text-white hover:bg-[#23583a]"
            >
              <UserRound className="h-4 w-4" /> New chat
            </button>
            <button
              type="button"
              onClick={() => openCompose("group")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2C6E49] px-3 py-2 text-sm font-semibold text-[#2C6E49] hover:bg-[#2C6E49]/5"
            >
              <Users className="h-4 w-4" /> New group
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {info}
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_1fr]">
          {/* Inbox */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex gap-1 border-b p-2">
              {([
                ["all", "All"],
                ["direct", "Direct"],
                ["group", "Groups"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${
                    filter === id
                      ? "bg-[#2C6E49] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2C6E49]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <EmptyState art="chat" title="Your conversations will appear here" text="Start a chat or create a group." compact />
              ) : (
                filteredConversations.map((conversation) => {
                  const active = conversation.id === selectedId;
                  const unread = Number(conversation.unreadCount || 0);
                  const isGroup = String(conversation.type).toLowerCase() === "group";
                  const other =
                    conversationMembers(conversation).find((m) => m.id !== currentUserId) ||
                    null;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`flex w-full items-start gap-3 border-b px-3 py-3 text-left transition ${
                        active ? "bg-[#2C6E49]/8" : "hover:bg-gray-50"
                      }`}
                    >
                      <Avatar
                        label={
                          isGroup
                            ? (conversation.name || "G").slice(0, 2).toUpperCase()
                            : undefined
                        }
                        user={isGroup ? null : other}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {conversationTitle(conversation, currentUserId)}
                          </p>
                          <span className="shrink-0 text-[11px] text-gray-400">
                            {formatChatTime(
                              conversation.lastMessage?.createdAt ||
                                conversation.updatedAt ||
                                conversation.createdAt,
                            )}
                          </span>
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {conversationSubtitle(conversation, currentUserId)}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-600">
                            {lastMessagePreview(conversation)}
                          </p>
                          {unread > 0 && (
                            <span className="rounded-full bg-[#2C6E49] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Thread */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
            {!selectedId ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-gray-500">
                <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-700">Select a conversation</p>
                <p className="mt-1 text-sm">Or start a new direct chat / group.</p>
              </div>
            ) : loadingThread && !selected ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#2C6E49]" />
              </div>
            ) : (
              <>
                <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {conversationTitle(selected, currentUserId)}
                    </h2>
                    <p className="truncate text-xs text-gray-500">
                      {conversationSubtitle(selected || { id: selectedId }, currentUserId)}
                      {selected?.muted ? " · muted" : ""}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="rounded-lg border p-2 text-gray-600 hover:bg-gray-50"
                      aria-label="Conversation actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {selected?.muted ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4" />
                          )}
                          {selected?.muted ? "Unmute" : "Mute"}
                        </button>
                        <button
                          type="button"
                          onClick={leaveConversation}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <LogOut className="h-4 w-4" /> Leave
                        </button>
                        {String(selected?.type).toLowerCase() === "group" &&
                          (selected?.createdById === currentUserId ||
                            selected?.creatorId === currentUserId) && (
                            <button
                              type="button"
                              onClick={deleteGroup}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" /> Delete group
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </header>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7faf8] px-4 py-4">
                  {messages.map((message) => {
                    const mine = isOwnMessage(message, currentUserId);
                    const sender = messageSender(message);
                    const deleted = Boolean(message.deletedAt);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
                            mine
                              ? "rounded-br-md bg-[#2C6E49] text-white"
                              : "rounded-bl-md border bg-white text-gray-800"
                          }`}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[11px] font-semibold text-[#2C6E49]">
                              {getUserDisplayName(sender)}
                            </p>
                          )}
                          {editingId === message.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                className="w-full rounded-md border border-white/30 bg-white/10 p-2 text-sm text-white outline-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#2C6E49]"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="rounded bg-white/20 px-2 py-1 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm whitespace-pre-wrap ${deleted ? "italic opacity-70" : ""}`}>
                              {deleted ? "This message was deleted." : message.content}
                            </p>
                          )}
                          <div
                            className={`mt-1 flex items-center gap-2 text-[10px] ${
                              mine ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            <span>{formatChatTime(message.createdAt)}</span>
                            {mine && !deleted && editingId !== message.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(message.id);
                                    setEditDraft(message.content || "");
                                  }}
                                  className="inline-flex items-center gap-0.5 hover:underline"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMessage(message.id)}
                                  className="inline-flex items-center gap-0.5 hover:underline"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="flex items-end gap-2 border-t p-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    placeholder="Write a message…"
                    rows={2}
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2C6E49]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#2C6E49] px-4 text-sm font-semibold text-white hover:bg-[#23583a] disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Compose modal */}
      {composeMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {composeMode === "direct" ? "New direct chat" : "New group"}
              </h3>
              <button
                type="button"
                onClick={() => setComposeMode(null)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {composeMode === "group" && (
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="mb-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#2C6E49]"
              />
            )}

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search farmers by name, username, or email"
                className="h-11 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#2C6E49]"
              />
            </div>

            {pickedUsers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pickedUsers.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => togglePick(person)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2C6E49]/10 px-2.5 py-1 text-xs font-semibold text-[#2C6E49]"
                  >
                    {getUserDisplayName(person)} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4 max-h-56 overflow-y-auto rounded-lg border">
              {searchingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2C6E49]" />
                </div>
              ) : userResults.length === 0 ? (
                userQuery.trim() ? (
                  <EmptyState art="search" title="Nobody matches that name" text="Check the spelling or try another name." compact />
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">Type to search people you can message.</p>
                )
              ) : (
                userResults.map((person) => {
                  const picked = pickedUsers.some((item) => item.id === person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => togglePick(person)}
                      className={`flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-0 ${
                        picked ? "bg-[#2C6E49]/8" : "hover:bg-gray-50"
                      }`}
                    >
                      <Avatar user={person} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {getUserDisplayName(person)}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {person.email || person.username || person.id}
                        </p>
                      </div>
                      {picked && <Plus className="h-4 w-4 rotate-45 text-[#2C6E49]" />}
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              disabled={creating || !pickedUsers.length}
              onClick={createConversation}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2C6E49] text-sm font-semibold text-white hover:bg-[#23583a] disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {composeMode === "direct" ? "Open chat" : "Create group"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Messages;
