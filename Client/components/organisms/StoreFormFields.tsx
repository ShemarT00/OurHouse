import { View, Text, TextInput } from 'react-native';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { RetailerPicker } from '../atoms/RetailerPicker';
import { normalizeWebsite, WEBSITE_ERROR } from '@/utils/storeLinks';
import type { Retailer, Store } from '@/types';

// Name and link fields for adding or editing a store. A store is linked to a
// retailer, has its own website, or neither: choosing one clears the other.
// Limits match the server's validation in Server/stores/StoreControllers.py.

export interface StoreFormValues {
  name: string;
  retailerKey: string | null;
  website: string;
}

export const EMPTY_STORE_FORM: StoreFormValues = { name: '', retailerKey: null, website: '' };

/** A store's current values, to edit it */
export const storeToForm = (store: Store): StoreFormValues => ({
  name: store.name,
  retailerKey: store.retailerKey,
  website: store.website ?? '',
});

/**
 * Form values to API fields. A retailer that is no longer offered (retired) is
 * dropped, since a store linked to it already behaves as if it has no link.
 */
export const storeFormToData = (values: StoreFormValues, retailers: Retailer[]) => {
  const offered = retailers.length === 0 || retailers.some((r) => r.key === values.retailerKey && !r.retired);
  return {
    name: values.name.trim(),
    retailerKey: offered ? values.retailerKey : null,
    website: normalizeWebsite(values.website) ?? null,
  };
};

interface StoreFormFieldsProps {
  form: UseFormReturn<StoreFormValues>;
  /** Retailers a store can be linked to */
  retailers: Retailer[];
  /** Why saving failed on the server (e.g. a duplicate name), shown under the name */
  serverError?: string;
}

export function StoreFormFields({ form, retailers, serverError }: StoreFormFieldsProps) {
  const { control, getValues, setValue, formState: { errors } } = form;

  const pickRetailer = (retailer: Retailer | null, onChange: (key: string | null) => void) => {
    const previous = retailers.find((r) => r.key === getValues('retailerKey'));
    onChange(retailer?.key ?? null);
    if (!retailer) return;
    setValue('website', '', { shouldValidate: true });
    // Fill in the name unless the member has already typed their own
    const name = getValues('name').trim();
    if (!name || name === previous?.name) setValue('name', retailer.name, { shouldValidate: true });
  };

  return (
    <View>
      <Text className="text-sm text-gray-500 mb-2">Store name</Text>
      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Store name is required',
          validate: (value) => value.trim().length > 0 || 'Store name is required',
          maxLength: { value: 255, message: 'Store name must be 255 characters or fewer' },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="e.g. Tesco"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-3">{errors.name?.message ?? serverError ?? ''}</Text>

      <Text className="text-sm text-gray-500 mb-2">Shop online at (optional)</Text>
      <View className="mb-4">
        <Controller
          control={control}
          name="retailerKey"
          render={({ field: { onChange, value } }) => (
            <RetailerPicker
              retailers={retailers}
              value={value}
              onChange={(retailer) => pickRetailer(retailer, onChange)}
            />
          )}
        />
      </View>

      <Text className="text-sm text-gray-500 mb-2">Or its own website (optional)</Text>
      <Controller
        control={control}
        name="website"
        rules={{ validate: (value) => normalizeWebsite(value) !== undefined || WEBSITE_ERROR }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="e.g. www.cornershop.co.uk"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={value}
            onChangeText={(text) => {
              onChange(text);
              if (text.trim()) setValue('retailerKey', null);
            }}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-3">{errors.website?.message ?? ''}</Text>
    </View>
  );
}
