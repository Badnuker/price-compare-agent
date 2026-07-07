import { invoke } from "@tauri-apps/api/core";

export interface Settings {
  llm_provider: "openai" | "anthropic";
  llm_api_key: string;
  llm_base_url: string;
  llm_model: string;
}

export async function getSettings(): Promise<Settings> {
  return invoke<Settings>("get_settings");
}

export async function saveSettings(settings: Settings): Promise<void> {
  return invoke("save_settings", { settings });
}
