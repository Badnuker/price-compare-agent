import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Product } from "../types/product";

const MATCH_MAP: Record<string, { color: string; label: string }> = {
  exact: { color: "green", label: "完全匹配" },
  similar: { color: "blue", label: "相似" },
  alternative: { color: "orange", label: "替代推荐" },
};

const PLATFORM_COLOR: Record<string, string> = {
  京东: "red",
  淘宝: "orange",
};

const columns: ColumnsType<Product> = [
  { title: "商品名称", dataIndex: "name", key: "name" },
  {
    title: "平台",
    dataIndex: "platform",
    key: "platform",
    width: 80,
    render: (p: string) => (
      <Tag color={PLATFORM_COLOR[p] ?? "default"}>{p}</Tag>
    ),
  },
  {
    title: "价格",
    dataIndex: "price",
    key: "price",
    width: 100,
    sorter: (a, b) => a.price - b.price,
    defaultSortOrder: "ascend",
    render: (p: number) => (
      <span style={{ color: "#f5222d", fontWeight: "bold" }}>¥{p}</span>
    ),
  },
  { title: "规格", dataIndex: "specs", key: "specs" },
  {
    title: "匹配",
    dataIndex: "match_type",
    key: "match_type",
    width: 100,
    render: (t: string) => {
      const item = MATCH_MAP[t] ?? { color: "default", label: t || "未知" };
      return <Tag color={item.color}>{item.label}</Tag>;
    },
  },
  {
    title: "链接",
    dataIndex: "link",
    key: "link",
    width: 60,
    render: (l: string) => (
      <a href={l} target="_blank" rel="noreferrer">
        详情
      </a>
    ),
  },
];

export default function ResultTable({ data }: { data: Product[] }) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={false}
      bordered
      size="middle"
    />
  );
}
