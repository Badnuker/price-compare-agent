import { Button, Tooltip } from "antd";
import {
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { Conversation } from "@/types/product";
import ConversationList from "./ConversationList";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: Props) {
  return (
    <div
      style={{
        width: collapsed ? 48 : 260,
        minWidth: collapsed ? 48 : 260,
        height: "100%",
        background: "var(--bg-overlay)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.18s cubic-bezier(0.3, 0, 0.5, 1)",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-default)",
          minHeight: 48,
        }}
      >
        {!collapsed && (
          <span
            style={{
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "-0.2px",
              userSelect: "none",
            }}
          >
            Conversations
          </span>
        )}
        <div style={{ display: "flex", gap: 2 }}>
          {!collapsed && (
            <Tooltip title="New conversation">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ color: "var(--text-secondary)" }} />}
                onClick={onNew}
                style={{ borderRadius: 4, color: "var(--text-secondary)" }}
              />
            </Tooltip>
          )}
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Button
              type="text"
              size="small"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ color: "var(--text-secondary)", fontSize: 14 }} />
                ) : (
                  <MenuFoldOutlined style={{ color: "var(--text-secondary)", fontSize: 14 }} />
                )
              }
              onClick={onToggle}
              style={{ borderRadius: 4 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Conversation list */}
      {!collapsed && (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
        />
      )}

      {/* Collapsed: only + */}
      {collapsed && (
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
          }}
        >
          <Tooltip title="New conversation" placement="right">
            <Button
              type="text"
              icon={<PlusOutlined style={{ color: "var(--text-secondary)", fontSize: 16 }} />}
              onClick={onNew}
              style={{ width: 36, height: 36, borderRadius: 4 }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}
