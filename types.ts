export enum MenuCategory {
  FOOD = 'Makanan',
  DRINKS = 'Minuman',
  SPECIALS = 'Menu Spesial'
}

export interface MenuItemType {
  id: number;
  name: string;
  price: number;
  category: MenuCategory;
  imageUrl: string;
}

export interface OrderItemType extends MenuItemType {
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  password; // In a real app, this would be hashed
  role: 'admin' | 'buyer';
}
