export interface IProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  color: string;
  price: number;
  size: string;
  tags: string[];
  image: string;
};

export interface IProductWithVector extends IProduct {
  vector: number[];
}

export interface ISession {
  messages: ChatCompletionMessageParam[];
  summary: string;
}

export interface IIntentRecognizerResponse {
  filters: Record<string, string | number | string[]>;
  needs_clarification: boolean;
  clarifying_question: string | null;
  search_query: string | null;
}