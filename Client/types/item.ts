export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Item {
  OHID: number;
  name: string;
  priority: Priority;
  shoppingListId: string;
  storeId?: string;
}
