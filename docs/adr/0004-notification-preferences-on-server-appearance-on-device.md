# Notification preferences are stored on the server; appearance stays on the device

Account settings are split by where they need to take effect. Notifications are created by a database trigger when an item event happens (ADR 0001), not by the app, so a preference such as muting a household only works if the trigger can read it: notification preferences are stored in the database alongside the account. Appearance choices, such as theme, only change how one phone draws the screen, and most apps treat them as a per-device choice, so they are kept in the app's local storage and never sent to the server.

## Considered Options

- **Everything on the server**: appearance would follow the account to every device, but it adds tables and API calls for settings that nothing on the server reads.
- **Everything on the device**: simplest, but notification preferences would be ignored, because the trigger would keep creating notifications the member asked not to get.

## Consequences

- A new notification preference means a migration and a change to the trigger, not just a client change.
- Reinstalling the app or signing in on a new phone resets appearance, but keeps notification preferences.
