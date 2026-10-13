## Navigation Structure

This directory contains all navigation configuration and utilities for the OurHouse mobile app using Expo Router v4+.

### Files

- **`types.ts`** - TypeScript type definitions for all navigation stacks and routes. Provides type safety throughout the app.
- **`routes.ts`** - Centralized route definitions and deep linking configuration. All route paths are defined here.
- **`RootNavigator.tsx`** - Root-level navigation logic that switches between authentication and app flows based on auth state.
- **`AuthNavigator.tsx`** - Handles authentication flow (login, signup, password reset).
- **`AppNavigator.tsx`** - Main app navigation with tab-based interface and household stack navigator.
- **`useNavigation.ts`** - Custom hooks for type-safe navigation throughout the app.
- **`index.ts`** - Central export point for all navigation utilities.

### Usage

#### Using Route Definitions

```typescript
import { AppRoutes, AuthRoutes } from "@/navigation";

// Navigate to household
navigation.push(AppRoutes.HOUSEHOLD("household-123"));

// Navigate to add item
navigation.push(AppRoutes.ADD_ITEM("list-456", "household-123"));
```

#### Using Navigation Hooks

```typescript
import { useNavigation, useAppNavigation } from "@/navigation";

export const MyComponent = () => {
  const navigation = useNavigation();
  const appNav = useAppNavigation();

  return (
    <Button onPress={() => appNav.goToHousehold("household-123")}>
      Open Household
    </Button>
  );
};
```

#### Type-Safe Route Parameters

All route parameters are typed based on the definitions in `types.ts`, providing autocomplete and type checking throughout the app.

### Navigation Flow

```
RootNavigator (auth state check)
├── (auth) - AuthNavigator
│   ├── login
│   ├── signup
│   ├── forgot-password
│   └── reset-password
└── (app) - AppNavigator (Tab-based)
    ├── home (index)
    ├── member-invites
    ├── profile
    ├── Household Stack (nested)
    │   ├── household-[OHID]
    │   ├── list-detail-[OHID]
    │   ├── add-item-[OHID]
    │   ├── edit-item-[OHID]
    │   └── household-members-[OHID]
    └── settings
```

### Deep Linking

The app supports deep linking through configured prefixes:
- `ourhouse://`
- `https://ourhouse.app`

Example deep links:
- `ourhouse://home`
- `ourhouse://household/hh-123`
- `ourhouse://list-detail/list-456`

### Setting Up Zustand Integration

Connect the `RootNavigator` to your auth store in your root layout:

```typescript
import { useAuthStore } from "@/stores";
import { RootNavigator } from "@/navigation";

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <RootNavigator 
      isAuthenticated={isAuthenticated} 
      isLoading={isLoading} 
    />
  );
}
```
