import { itemFormToData } from '@/components/organisms/ItemFormFields';
import { Priority } from '@/types';

describe('itemFormToData', () => {
  it('trims text, converts quantity to a number and keeps the store', () => {
    expect(itemFormToData({ name: ' Milk ', priority: Priority.LOW, storeId: 7, quantity: ' 3 ', notes: ' 2% ' })).toEqual({
      name: 'Milk',
      priority: Priority.LOW,
      storeId: 7,
      quantity: 3,
      notes: '2%',
    });
  });

  it('turns blank quantity and notes into null so editing can clear them', () => {
    expect(itemFormToData({ name: 'Milk', priority: Priority.NONE, storeId: null, quantity: '', notes: '   ' })).toEqual({
      name: 'Milk',
      priority: Priority.NONE,
      storeId: null,
      quantity: null,
      notes: null,
    });
  });
});
