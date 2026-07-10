import { useEffect, useState } from "react";

const STEPS = ["Parse intent", "Search web", "Generate"];

interface Props {
  current: number;
}

export default function ThinkingBlock({ current }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: "2px 0" }}>
      {/* Step dots + connectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginBottom: 8,
        }}
      >
        {STEPS.map((_, i) => {
          const done = i < current;
          const active = i === current;

          let bg = "var(--bg-subtle)";
          let border = "var(--border-default)";
          let size = 8;
          let pulse = false;

          if (done) {
            bg = "var(--accent-green)";
            border = "var(--accent-green)";
          } else if (active) {
            bg = "var(--accent-blue)";
            border = "var(--accent-blue)";
            size = 10;
            pulse = true;
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                flex: i < STEPS.length - 1 ? 1 : undefined,
              }}
            >
              <div style={{ position: "relative" }}>
                {pulse && (
                  <div
                    style={{
                      position: "absolute",
                      top: -3,
                      left: -3,
                      width: size + 6,
                      height: size + 6,
                      borderRadius: "50%",
                      background: "rgba(88, 166, 255, 0.25)",
                      animation: "pulse 1.4s ease-out infinite",
                    }}
                  />
                )}
                <div
                  style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: bg,
                    border: `1.5px solid ${border}`,
                    transition: "all 0.3s",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: done ? "var(--accent-green)" : "var(--border-default)",
                    margin: "0 4px",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--text-tertiary)",
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {STEPS.map((name, i) => (
          <span
            key={i}
            style={{
              color:
                i < current
                  ? "var(--accent-green)"
                  : i === current
                  ? "var(--accent-blue)"
                  : "var(--text-tertiary)",
              fontWeight: i === current ? 600 : 400,
              transition: "color 0.3s",
            }}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Timer */}
      <div
        style={{
          fontSize: 10,
          color: "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--accent-blue)",
            animation: "pulse 1.4s ease-out infinite",
          }}
        />
        {elapsed}s elapsed
      </div>
    </div>
  );
}
