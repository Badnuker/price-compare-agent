import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, App } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { getSettings, saveSettings, type Settings } from "@/api/settings";

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Settings>();
  const { message } = App.useApp();

  useEffect(() => {
    getSettings().then((s) => {
      form.setFieldsValue(s);
      if (!s.llm_api_key) setOpen(true);
    });
  }, [form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    await saveSettings(values);
    message.success("Settings saved");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="text"
        icon={<SettingOutlined style={{ color: "var(--text-secondary)", fontSize: 16 }} />}
        onClick={() => setOpen(true)}
        style={{
          borderRadius: 4,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      <Modal
        title={
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>
            Model settings
          </span>
        }
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        okText="Save"
        cancelText="Cancel"
        width={420}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="llm_provider"
            label={<span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Provider</span>}
          >
            <Select
              options={[
                { value: "openai", label: "OpenAI Compatible" },
                { value: "anthropic", label: "Anthropic" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="llm_api_key"
            label={<span style={{ color: "var(--text-secondary)", fontSize: 12 }}>API Key</span>}
          >
            <Input.Password placeholder="sk-xxxx" />
          </Form.Item>
          <Form.Item
            name="llm_base_url"
            label={<span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Base URL</span>}
          >
            <Input placeholder="https://api.deepseek.com" />
          </Form.Item>
          <Form.Item
            name="llm_model"
            label={<span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Model</span>}
          >
            <Input placeholder="deepseek-chat" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
