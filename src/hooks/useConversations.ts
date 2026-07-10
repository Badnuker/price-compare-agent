import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message } from "@/types/product";

const STORAGE_KEY = "pc_conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

function loadMessages(convId: string): Message[] {
  try {
    const raw = localStorage.getItem(`pc_msg_${convId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(convId: string, msgs: Message[]) {
  // 只存非 loading 的消息
  const toSave = msgs.filter(
    (m) => !m.loading || m.result
  );
  localStorage.setItem(`pc_msg_${convId}`, JSON.stringify(toSave));
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // 初始化：没有会话则创建
  useEffect(() => {
    const convs = loadConversations();
    if (convs.length === 0) {
      const id = Date.now().toString();
      const newConv: Conversation = {
        id,
        title: "新对话",
        lastMessage: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveConversations([newConv]);
      setConversations([newConv]);
      setActiveId(id);
    } else {
      setConversations(convs);
      setActiveId(convs[0].id);
    }
  }, []);

  // 切换 activeId 时加载对应消息
  useEffect(() => {
    if (!activeId) return;
    const msgs = loadMessages(activeId);
    setMessages(
      msgs.length > 0
        ? msgs
        : [
            {
              key: "welcome",
              role: "agent",
              content: "你好！我是比价助手 🛒\n\n告诉我你想买什么，我帮你跨平台比价，找到最划算的选择。",
            },
          ]
    );
  }, [activeId]);

  // 消息变化时自动保存
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    saveMessages(activeId, messages);

    // 查找最后一条用户消息（如果有）
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user" && m.content);

    // 只有当消息中确实包含用户消息时，才更新标题
    // 避免切换会话时用旧会话的消息覆盖新会话标题
    if (!lastUserMsg) return;

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeId) return c;
        return {
          ...c,
          title: lastUserMsg.content!.slice(0, 30),
          lastMessage: lastUserMsg.content!.slice(0, 50),
          updatedAt: Date.now(),
        };
      });
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeId]);

  const newConversation = useCallback(() => {
    const id = Date.now().toString();
    const conv: Conversation = {
      id,
      title: "新对话",
      lastMessage: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => {
      const next = [conv, ...prev];
      saveConversations(next);
      return next;
    });
    // 必须先清空消息，防止自动保存 effect 把旧会话的消息标题写到新会话
    setMessages([]);
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveConversations(next);
        if (id === activeId && next.length > 0) {
          setActiveId(next[0].id);
        }
        return next;
      });
      localStorage.removeItem(`pc_msg_${id}`);
    },
    [activeId]
  );

  const renameConversation = useCallback(
    (id: string, title: string) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, title } : c
        );
        saveConversations(next);
        return next;
      });
    },
    []
  );

  return {
    conversations,
    activeId,
    messages,
    setMessages,
    setActiveId,
    newConversation,
    deleteConversation,
    renameConversation,
  };
}