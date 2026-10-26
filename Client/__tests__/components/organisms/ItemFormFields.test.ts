import { itemFormToData } from '@/components/organisms/ItemFormFields';
import { Priority } from '@/types';

describe('itemFormToData', () => {
  it('trims text and converts quantity to a number', () => {
    expect(itemFormToData({ name: ' Milk ', priority: Priority.LOW, quantity: ' 3 ', notes: ' 2% ' })).toEqual({
      name: 'Milk',
      priority: Priority.LOW,
      quantity: 3,
      notes: '2%',
    });
  });

  it('turns blank quantity and notes into null so editing can clear them', () => {
    expect(itemFormToData({ name: 'Milk', priority: Priority.NONE, quantity: '', notes: '   ' })).toEqual({
      name: 'Milk',
      priority: Priority.NONE,
      quantity: null,
      notes: null,
    });
  });
});
