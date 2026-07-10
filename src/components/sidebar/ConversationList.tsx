import { Button, Dropdown } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useState, useRef } from "react";
import type { Conversation } from "@/types/product";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
}: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conv={conv}
          active={conv.id === activeId}
          onSelect={() => onSelect(conv.id)}
          onDelete={() => onDelete(conv.id)}
          onRename={(t) => onRename(conv.id, t)}
        />
      ))}
      {conversations.length === 0 && (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: 12,
            textAlign: "center",
            padding: "20px 8px",
          }}
        >
          No conversations yet
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conv,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (t: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "8px 10px",
        marginBottom: 2,
        borderRadius: 6,
        cursor: "pointer",
        background: active ? "var(--bg-subtle)" : "transparent",
        border: active ? "1px solid var(--border-default)" : "1px solid transparent",
        transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <MessageOutlined
          style={{
            color: active ? "var(--text-secondary)" : "var(--text-tertiary)",
            fontSize: 14,
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-inset)",
                border: "1px solid var(--accent-blue)",
                borderRadius: 4,
                color: "var(--text-primary)",
                padding: "2px 6px",
                fontSize: 13,
                width: "100%",
                outline: "none",
              }}
            />
          ) : (
            <div
              style={{
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {conv.title}
            </div>
          )}
          <div
            style={{
              color: "var(--text-tertiary)",
              fontSize: 11,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {conv.lastMessage || "New conversation"}
          </div>
          <div style={{ color: "var(--text-placeholder)", fontSize: 10, marginTop: 2 }}>
            {formatTime(conv.updatedAt)}
          </div>
        </div>

        <Dropdown
          menu={{
            items: [
              {
                key: "rename",
                label: "Rename",
                icon: <EditOutlined />,
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  setEditing(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                },
              },
              {
                key: "delete",
                label: "Delete",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  onDelete();
                },
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined style={{ color: "var(--text-tertiary)", fontSize: 12 }} />}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 6,
              right: 4,
              borderRadius: 4,
              minWidth: 24,
              height: 24,
              opacity: 0.6,
            }}
          />
        </Dropdown>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US");
}
