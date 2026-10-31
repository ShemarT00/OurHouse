# Retailers are kept in a database table, not in code

The list of retailers OurHouse can open and search (Tesco, Aldi and so on) is the same for every household and only changes when we change it, so it could have been a constant in the Flask code. We keep it in a `RETAILER` table instead, filled by migrations, with each store pointing at a retailer by a foreign key. Members' apps can write to Supabase directly under Row Level Security (see ADR 0001), so a list that only the Flask server knows about could not stop a store being saved with a retailer that does not exist. A table lets the database itself refuse bad keys, and keeps one source of truth for both the server and the app.

## Consequences

- Adding a retailer, or fixing its homepage or search address, means writing a new SQL migration rather than editing Python.
- Retailers are never deleted, only marked retired; the foreign key blocks deleting one that stores still use, and a store linked to a retired retailer behaves as if it has no link.
- No one can add, change or remove retailers from the app; members can only read them.
