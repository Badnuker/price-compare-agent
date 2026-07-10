import React, { useEffect } from "react";
import type { Product } from "@/types/product";

interface Props {
  products: Product[];
}

// Dynamic color palette — each platform gets a distinct, consistent color
const PLATFORM_PALETTE = [
  "#f85149", // red
  "#d29922", // orange
  "#58a6ff", // blue
  "#3fb950", // green
  "#a371f7", // purple
  "#39d353", // teal
  "#f0883e", // amber
  "#db61a2", // pink
  "#79c0ff", // light blue
  "#e55354", // crimson
];

function assignPlatformColors(platforms: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  platforms.forEach((p, i) => {
    map[p] = PLATFORM_PALETTE[i % PLATFORM_PALETTE.length];
  });
  return map;
}

export default function PriceComparison({ products }: Props) {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || products.length === 0) return;

    import("echarts").then((echarts) => {
      const chart = echarts.init(chartRef.current!, "dark");
      const platforms = [...new Set(products.map((p) => p.platform))];
      const platformColors = assignPlatformColors(platforms);
      const display = products.slice(0, 10);

      const names = display.map(
        (p, i) => `${i + 1}. ${p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name}`
      );

      // Build legend data with colored icons to match bars
      const legendData = platforms.map((p) => ({
        name: p,
        icon: "roundRect",
        itemStyle: { color: platformColors[p] },
      }));

      chart.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: "#161b22",
          borderColor: "#30363d",
          textStyle: { color: "#c9d1d9", fontSize: 12, fontFamily: "var(--font-mono)" },
          axisPointer: { type: "shadow" },
          formatter: (params: unknown) => {
            if (Array.isArray(params)) {
              const filtered = params.filter(
                (p: { value: number | null }) => p.value !== null
              );
              return filtered
                .map(
                  (p: { color: string; seriesName: string; value: number }) =>
                    `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>¥${p.value}</b>`
                )
                .join("<br/>");
            }
            return "";
          },
        },
        legend: {
          data: legendData,
          bottom: 0,
          textStyle: { color: "#8b949e", fontSize: 11 },
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 16,
        },
        grid: { left: 4, right: 20, top: 40, bottom: 40, containLabel: true },
        xAxis: {
          type: "category",
          data: names,
          axisLabel: {
            color: "#8b949e",
            fontSize: 10,
            rotate: products.length > 6 ? 30 : 0,
            interval: 0,
            width: 90,
            overflow: "truncate",
          },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "#30363d" } },
        },
        yAxis: {
          type: "value",
          name: "¥",
          nameTextStyle: { color: "#6e7681", fontSize: 10 },
          axisLabel: { color: "#6e7681", fontSize: 10, formatter: "¥{value}" },
          splitLine: { lineStyle: { color: "#21262d", type: "dashed" } },
        },
        series: platforms.map((platform) => ({
          name: platform,
          type: "bar",
          color: platformColors[platform],
          data: display.map((p) =>
            p.platform === platform
              ? {
                  value: p.price,
                  itemStyle: {
                    color: platformColors[platform],
                    borderRadius: [4, 4, 0, 0],
                  },
                  label: {
                    show: products.length <= 8,
                    position: "top",
                    color: "#8b949e",
                    fontSize: 10,
                    formatter: "¥{c}",
                  },
                }
              : null
          ),
          barMaxWidth: 40,
          barGap: "20%",
          emphasis: {
            itemStyle: {
              opacity: 0.9,
              shadowBlur: 8,
              shadowColor: platformColors[platform] + "40",
            },
          },
        })),
        animationDuration: 800,
        animationEasing: "elasticOut",
      });

      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.dispose();
      };
    });
  }, [products]);

  const chartHeight = Math.max(220, Math.min(420, products.length * 34 + 80));

  // Stats summary
  const minPrice = Math.min(...products.map((p) => p.price));
  const maxPrice = Math.max(...products.map((p) => p.price));
  const avgPrice = Math.round(products.reduce((s, p) => s + p.price, 0) / products.length);
  const platformCount = new Set(products.map((p) => p.platform)).size;

  return (
    <div
      style={{
        background: "var(--bg-overlay)",
        borderRadius: 10,
        padding: "16px 18px 12px",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          📊 Price comparison chart
        </span>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
          {products.length} products · {platformCount} platforms
        </span>
      </div>

      {/* Quick stats row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          padding: "8px 12px",
          background: "var(--bg-inset)",
          borderRadius: 6,
          border: "1px solid var(--border-muted)",
        }}
      >
        <StatBadge label="Lowest" value={`¥${minPrice}`} color="var(--accent-green)" />
        <StatBadge label="Highest" value={`¥${maxPrice}`} color="var(--accent-red)" />
        <StatBadge label="Average" value={`¥${avgPrice}`} color="var(--accent-blue)" />
        <StatBadge label="Platforms" value={String(platformCount)} color="var(--accent-purple)" />
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ height: chartHeight, width: "100%" }} />
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
