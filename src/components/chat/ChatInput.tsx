import { Button, Input } from "antd";
import { SendOutlined, ThunderboltOutlined, StopOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  sending: boolean;
}

const QUICK_TEMPLATES = [
  { label: "🎧 蓝牙耳机", text: "找一款300以内适合运动的蓝牙耳机" },
  { label: "📱 拍照手机", text: "2000左右拍照好的手机推荐" },
  { label: "⌚ 智能手表", text: "500以内续航久的智能手表" },
  { label: "💻 笔记本", text: "6000以内适合编程的轻薄本" },
  { label: "⌨️ 机械键盘", text: "300以内性价比高的机械键盘" },
  { label: "🖥️ 显示器", text: "1500以内4K设计显示器推荐" },
];

export default function ChatInput({ onSend, onStop, sending }: Props) {
  const [value, setValue] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (!sending) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [sending]);

  useEffect(() => {
    setCharCount(value.trim().length);
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setValue("");
    setShowQuick(false);
    setCharCount(0);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Quick templates */}
      {showQuick && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 6,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {QUICK_TEMPLATES.map((tpl) => (
            <Button
              key={tpl.label}
              size="small"
              onClick={() => {
                setValue(tpl.text);
                setShowQuick(false);
                inputRef.current?.focus();
              }}
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
                borderRadius: 20,
                fontSize: 12,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-blue)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {tpl.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "flex-end",
          background: "var(--bg-inset)",
          border: "1px solid var(--border-default)",
          borderRadius: 8,
          padding: "6px 6px 6px 12px",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        className="chat-input-row"
      >
        {/* Quick template toggle */}
        <TooltipButton
          title={showQuick ? "Hide templates" : "Quick templates"}
          active={showQuick}
          onClick={() => setShowQuick(!showQuick)}
        >
          <ThunderboltOutlined
            style={{
              color: showQuick ? "var(--accent-orange)" : "var(--text-tertiary)",
              fontSize: 15,
            }}
          />
        </TooltipButton>

        {/* Text area */}
        <Input.TextArea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="搜索商品…  (Enter 发送, Shift+Enter 换行)"
          disabled={sending}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            fontSize: 14,
            resize: "none",
            boxShadow: "none",
            padding: "4px 0",
          }}
        />

        {/* Character count */}
        {charCount > 0 && !sending && (
          <span
            style={{
              fontSize: 10,
              color: charCount > 200 ? "var(--accent-orange)" : "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
              paddingBottom: 2,
            }}
          >
            {charCount}
          </span>
        )}

        {/* Send / Stop */}
        {sending && onStop ? (
          <Button
            type="default"
            size="small"
            icon={<StopOutlined />}
            onClick={onStop}
            style={{
              borderRadius: 4,
              borderColor: "rgba(248,81,73,0.3)",
              color: "var(--accent-red)",
              flexShrink: 0,
            }}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!value.trim()}
            style={{
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Hint row */}
      <div
        style={{
          textAlign: "center",
          marginTop: 4,
          fontSize: 10,
          color: "var(--text-placeholder)",
        }}
      >
        💡 支持追问："把预算缩小到200" · "推荐性价比最高的" · "有降噪功能吗"
      </div>
    </div>
  );
}

function TooltipButton({
  title,
  active,
  children,
  onClick,
}: {
  title: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="text"
      size="small"
      onClick={onClick}
      title={title}
      style={{
        borderRadius: 4,
        marginBottom: 2,
        background: active ? "var(--bg-subtle)" : "transparent",
        minWidth: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Button>
  );
}
