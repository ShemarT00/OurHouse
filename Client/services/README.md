## Services

This directory contains all API integration services for the OurHouse mobile app. Services handle communication between the frontend and backend, with type-safe interfaces and error handling.

### Architecture

Services are organized by domain (auth, user, household, etc.) and all use centralized HTTP utilities that handle:
- Authentication headers (JWT tokens)
- Error handling and status codes
- Consistent response formatting
- Supabase integration for auth-related operations

### File Structure

- **`config.ts`** - Supabase client, API configuration, endpoint mappings
- **`api.ts`** - HTTP utilities (GET, POST, PUT, PATCH, DELETE) with error handling
- **`auth.ts`** - Authentication operations (login, signup, password reset)
- **`user.ts`** - User profile operations
- **`household.ts`** - Household management
- **`member.ts`** - Household member management and invitations
- **`list.ts`** - Shopping list operations
- **`item.ts`** - Shopping list item operations
- **`notification.ts`** - Notification operations
- **`store.ts`** - Store/location management
- **`index.ts`** - Central export point

### Usage

#### Basic API Call

All services follow a consistent pattern with type-safe responses:

```typescript
import { getHousehold } from "@/services";

const fetchHousehold = async (householdId: string) => {
  const response = await getHousehold(householdId);
  
  if (response.success && response.data) {
    console.log("Household:", response.data);
  } else {
    console.error("Error:", response.error?.message);
  }
};
```

#### With TanStack Query

Services are designed to work seamlessly with TanStack Query (React Query):

```typescript
import { useQuery } from "@tanstack/react-query";
import { getHousehold, throwIfError } from "@/services";

export const useGetHousehold = (householdId: string) => {
  return useQuery({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const response = await getHousehold(householdId);
      return throwIfError(response);
    },
  });
};

// Usage in component
const { data: household, isLoading, error } = useGetHousehold("hh-123");
```

#### Authentication Flow

```typescript
import { loginWithEmail, getCurrentSession } from "@/services";

const handleLogin = async (email: string, password: string) => {
  const response = await loginWithEmail({ email, password });
  
  if (response.success) {
    // User is authenticated
    // Store tokens in Zustand auth store
  } else {
    // Handle login error
    console.error(response.error?.message);
  }
};
```

#### Creating Items

```typescript
import { createItem } from "@/services";

const handleAddItem = async (
  householdId: string,
  listId: string,
  itemName: string
) => {
  const response = await createItem(householdId, listId, {
    name: itemName,
    priority: "MEDIUM",
  });

  if (response.success && response.data) {
    // Update local state or refetch list
  }
};
```

#### Bulk Operations

```typescript
import { bulkUpdateItems } from "@/services";

const handleCheckMultipleItems = async (
  householdId: string,
  listId: string,
  itemIds: string[]
) => {
  const updates = itemIds.map((id) => ({
    OHID: id,
    data: { completed: true },
  }));

  const response = await bulkUpdateItems(householdId, listId, updates);
  
  if (response.success) {
    console.log("Updated items:", response.data);
  }
};
```

### Response Format

All services return an `ApiResponse<T>` type:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
    details?: Record<string, any>;
  };
}
```

### Error Handling

Services handle different types of errors:

```typescript
const response = await getHousehold("id");

if (!response.success) {
  const error = response.error;
  
  switch (error?.code) {
    case "NETWORK_ERROR":
      // Handle network issues
      break;
    case "AUTH_ERROR":
      // Handle authentication failures / redirect to login
      break;
    case "HTTP_401":
      // Handle unauthorized
      break;
    case "HTTP_404":
      // Handle not found
      break;
    default:
      // Handle other errors
      break;
  }
}
```

### Environment Configuration

Services require the following environment variables in `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### Real-time Subscriptions

For real-time features (notifications, live list updates), services use Supabase real-time:

```typescript
import { supabase } from "@/services";

// Subscribe to household member changes
supabase
  .channel(`household:${householdId}:members`)
  .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
    console.log("Member update:", payload);
  })
  .subscribe();
```

### Integration with Zustand

Services are typically called from Zustand store actions:

```typescript
import { create } from "zustand";
import { getHousehold } from "@/services";

const useHouseholdStore = create((set) => ({
  households: [],
  fetchHousehold: async (id: string) => {
    const response = await getHousehold(id);
    if (response.success) {
      set((state) => ({
        households: [...state.households, response.data],
      }));
    }
  },
}));
```

### Adding New Services

When adding new API endpoints:

1. Add endpoint mappings to `config.ts` → `API_ENDPOINTS`
2. Create service functions in appropriate file (or new file if new domain)
3. Use `alGet`, `apiPost`, etc. utilities
4. Export types and functions from `index.ts`
5. Document usage patterns in this README

Example:

```typescript
// In config.ts
ITEMS: {
  ARCHIVE: (householdId: string, listId: string, OHID: string) =>
    `/households/${householdId}/shopping-lists/${listId}/items/${OHID}/archive`,
}

// In item.ts
export const archiveItem = async (
  householdId: string,
  listId: string,
  itemOHID: string
): Promise<ApiResponse<Item>> => {
  return apiPut<Item>(
    API_ENDPOINTS.ITEMS.ARCHIVE(householdId, listId, itemOHID)
  );
};

// Export from index.ts
export { archiveItem } from "./item";
```

### Testing Services

When testing services, mock the API utilities:

```typescript
import { jest } from "@jest/globals";
import * as apiUtils from "@/services/api";

jest.mock("@/services/api");

(apiUtils.apiGet as jest.Mock).mockResolvedValue({
  success: true,
  data: { OHID: "1", name: "Test Household" },
});
```

### Best Practices

1. **Always use `throwIfError`** with TanStack Query to properly handle errors
2. **Check `response.success`** before accessing `response.data`
3. **Use descriptive error messages** in error handling UI
4. **Leverage TypeScript types** for compile-time safety
5. **Implement request/retry logic** in Zustand stores or TanStack Query
6. **Cache responses appropriately** using TanStack Query's `staleTime`
7. **Handle auth failures** by redirecting to login screen
8. **Use real-time subscriptions** for live collaboration features
