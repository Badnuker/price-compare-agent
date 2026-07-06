export interface Product {
  id: string;
  name: string;
  platform: string;
  price: number;
  original_price?: number;
  specs: string;
  category: string;
  features: string[];
  rating?: number;
  review_count?: number;
  shipping?: number;
  link: string;
  match_type?: "exact" | "similar" | "alternative";
}

export interface AgentStep {
  step: string;
  status: "running" | "done" | "error";
}

export interface AgentResult {
  products: Product[];
  recommendation: string;
  steps: AgentStep[];
}
