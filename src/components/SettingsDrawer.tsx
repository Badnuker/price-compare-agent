import { useEffect, useState } from "react";
import { Drawer, Form, Input, Button, Select, App } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { getSettings, saveSettings, type Settings } from "../api/settings";

export default function SettingsDrawer() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Settings>();
  const { message } = App.useApp();

  useEffect(() => {
    getSettings().then((s) => {
      form.setFieldsValue(s);
      // 首次使用，API Key 为空则自动弹窗
      if (!s.llm_api_key) setOpen(true);
    });
  }, [form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    await saveSettings(values);
    message.success("设置已生效");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="text"
        icon={<SettingOutlined style={{ color: "#fff", fontSize: 18 }} />}
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="模型设置"
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        extra={
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="llm_provider"
            label="API 兼容格式"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "openai", label: "OpenAI" },
                { value: "anthropic", label: "Anthropic" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="llm_api_key"
            label="API Key"
            rules={[{ required: true, message: "请输入 API Key" }]}
          >
            <Input.Password placeholder="sk-xxxx" />
          </Form.Item>
          <Form.Item
            name="llm_base_url"
            label="API Base Url"
            rules={[{ required: true, message: "请输入 API 地址" }]}
          >
            <Input placeholder="https://api.deepseek.com" />
          </Form.Item>
          <Form.Item
            name="llm_model"
            label="模型 IDs"
            rules={[{ required: true, message: "请输入模型名" }]}
          >
            <Input placeholder="deepseek-v4-flash" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
