import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import {
  StoreFormFields, EMPTY_STORE_FORM, storeFormToData, storeToForm,
} from '@/components/organisms/StoreFormFields';
import type { StoreFormValues } from '@/components/organisms/StoreFormFields';
import type { Retailer } from '@/types';

const retailer = (key: string, name: string, retired = false): Retailer => ({
  key, name, homepage: `https://${key}.example`, searchUrl: null, retired,
});
const retailers = [retailer('aldi', 'Aldi'), retailer('tesco', 'Tesco')];

// Renders the fields in a form and reports the values submitted
function Harness({ defaults = EMPTY_STORE_FORM, onSubmit, serverError }: {
  defaults?: StoreFormValues;
  onSubmit: (values: StoreFormValues) => void;
  serverError?: string;
}) {
  const form = useForm<StoreFormValues>({ defaultValues: defaults });
  return (
    <>
      <StoreFormFields form={form} retailers={retailers} serverError={serverError} />
      <Pressable onPress={form.handleSubmit(onSubmit)}><Text>Submit</Text></Pressable>
    </>
  );
}

const setup = (props: Partial<React.ComponentProps<typeof Harness>> = {}) => {
  const onSubmit = jest.fn();
  const screen = render(<Harness onSubmit={onSubmit} {...props} />);
  const submit = () => fireEvent.press(screen.getByText('Submit'));
  return { ...screen, onSubmit, submit };
};

describe('StoreFormFields', () => {
  it('offers a retailer, a website or no link', async () => {
    const { getByText, getByPlaceholderText, onSubmit, submit } = setup();

    expect(getByText('No retailer')).toBeTruthy();
    expect(getByPlaceholderText('e.g. www.cornershop.co.uk')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('e.g. Tesco'), 'Market');
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Market', retailerKey: null, website: '' });
  });

  it('fills in the name from the retailer picked, and it stays editable', async () => {
    const { getByText, getByPlaceholderText, onSubmit, submit } = setup();
    const name = getByPlaceholderText('e.g. Tesco');

    fireEvent.press(getByText('Tesco'));
    expect(name.props.value).toBe('Tesco');

    fireEvent.press(getByText('Aldi'));
    expect(name.props.value).toBe('Aldi'); // still the retailer's name, so it follows the pick

    fireEvent.changeText(name, 'Aldi Hackney');
    fireEvent.press(getByText('Tesco'));
    expect(name.props.value).toBe('Aldi Hackney'); // the member's own name is kept

    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Aldi Hackney', retailerKey: 'tesco', website: '' });
  });

  it('clears a typed website when a retailer is picked', () => {
    const { getByText, getByPlaceholderText } = setup();
    const website = getByPlaceholderText('e.g. www.cornershop.co.uk');

    fireEvent.changeText(website, 'tesco.com');
    fireEvent.press(getByText('Tesco'));

    expect(website.props.value).toBe('');
  });

  it('clears the retailer when a website is typed', async () => {
    const { getByText, getAllByRole, getByPlaceholderText, onSubmit, submit } = setup();

    fireEvent.press(getByText('Tesco'));
    fireEvent.changeText(getByPlaceholderText('e.g. www.cornershop.co.uk'), 'tesco.com');

    expect(getAllByRole('radio')[0].props.accessibilityState.selected).toBe(true); // 'No retailer'
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ retailerKey: null, website: 'tesco.com' });
  });

  it('shows an error under the website when it is not a web address', async () => {
    const { getByPlaceholderText, findByText, onSubmit, submit } = setup();

    fireEvent.changeText(getByPlaceholderText('e.g. Tesco'), 'Corner shop');
    fireEvent.changeText(getByPlaceholderText('e.g. www.cornershop.co.uk'), 'ftp://corner.example');
    submit();

    expect(await findByText('Website must be a web address, like www.example.com')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a name', async () => {
    const { findByText, onSubmit, submit } = setup();

    submit();

    expect(await findByText('Store name is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows why saving failed on the server under the name', () => {
    const { getByText } = setup({ serverError: 'There is already a store called "Tesco"' });
    expect(getByText('There is already a store called "Tesco"')).toBeTruthy();
  });
});

describe('storeFormToData', () => {
  it('adds https:// to a website with no scheme and trims the name', () => {
    expect(storeFormToData({ name: ' Corner shop ', retailerKey: null, website: 'cornershop.co.uk' }, retailers))
      .toEqual({ name: 'Corner shop', retailerKey: null, website: 'https://cornershop.co.uk' });
  });

  it('sends no link when both are blank', () => {
    expect(storeFormToData({ name: 'Market', retailerKey: null, website: ' ' }, retailers))
      .toEqual({ name: 'Market', retailerKey: null, website: null });
  });

  it('drops a retailer that is no longer offered', () => {
    expect(storeFormToData({ name: 'Old', retailerKey: 'gone', website: '' }, retailers).retailerKey).toBeNull();
    expect(storeFormToData({ name: 'Old', retailerKey: 'gone', website: '' }, []).retailerKey).toBe('gone');
  });

  it("starts an edit from the store's current values", () => {
    expect(storeToForm({
      OHID: 3, name: 'Market', householdId: 5, createdAt: '', retailerKey: null, website: 'https://market.example',
    })).toEqual({ name: 'Market', retailerKey: null, website: 'https://market.example' });
  });
});
