export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Item {
  OHID: number;
  name: string;
  priority: Priority;
  shoppingListId: string;
  isCompleted: boolean;
  storeId?: string;
  quantity?: number;
  notes?: string;
}
