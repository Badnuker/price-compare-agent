import { invoke } from "@tauri-apps/api/core";
import type { AgentResult } from "../types/product";

export async function searchProducts(question: string): Promise<AgentResult> {
  return invoke<AgentResult>("search_products", { question });
}
