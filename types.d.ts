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