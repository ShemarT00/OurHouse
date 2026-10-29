# Item events and their notifications are recorded by a database trigger

When a member adds, edits, buys, un-buys or removes an item, a trigger on the `ITEM` table works out the item event, writes its sentence and creates a notification for every other member of the household, in the same transaction as the change. We chose this over building notifications in the Flask item controller, even though Python code would be easier to read, change and unit-test, because a trigger cannot be skipped by any write path (including direct Supabase writes, which Row Level Security already permits) and the item change and its notifications always succeed or fail together. It also sits next to the existing live-update broadcast trigger.

## Consequences

- The rules can only be tested with integration tests against a real Supabase database, not plain pytest unit tests.
- Changing a message's wording or a notification rule means writing a new SQL migration.
- Items removed because their whole shopping list or household was deleted are recognised by the trigger and send no notifications.
