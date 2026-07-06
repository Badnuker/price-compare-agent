import { Input, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";

interface Props {
  onSearch: (question: string) => void;
  loading: boolean;
}

export default function SearchBox({ onSearch, loading }: Props) {
  const [value, setValue] = useState("");

  const handleSearch = () => {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
      <Input
        size="large"
        placeholder="例如：找一款300以内适合运动的蓝牙耳机"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleSearch}
      />
      <Button
        size="large"
        type="primary"
        icon={<SearchOutlined />}
        loading={loading}
        onClick={handleSearch}
      >
        比价
      </Button>
    </Space.Compact>
  );
}
