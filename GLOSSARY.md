# OurHouse

OurHouse lets the members of a household share shopping lists, so everyone knows what is needed, where to get it, how much, and how urgently.

## Groups and people

**Household**:
A group of people who share shopping lists. Today a home; later it may also be a team in an organisation.
_Avoid_: Group, home, family

**Member**:
A person who belongs to a household.
_Avoid_: User (when meaning someone in a household), participant

**Actor**:
The member who made a change to an item.
_Avoid_: Author, sender, changer

## Lists and items

**Shopping List**:
A named list of items that belongs to one household.
_Avoid_: List (on its own, when ambiguous), basket

**Item**:
One thing to buy on a shopping list, with a name, quantity, urgency, store and notes.
_Avoid_: Product, entry

**Item Event**:
A change a member makes to an item: Added, Edited, Bought, Un-bought or Removed.
_Avoid_: Activity, action, change log

**Added**:
An item was put on a shopping list.

**Edited**:
One or more of an item's details changed, other than whether it is bought.
_Avoid_: Updated, modified

**Bought**:
An item was ticked as bought.
_Avoid_: Purchased, completed, done

**Un-bought**:
An item that was ticked as bought was unticked.
_Avoid_: Unticked, reopened

**Removed**:
An item was taken off its shopping list.
_Avoid_: Deleted

## Notifications

**Notification**:
What one member sees in their inbox about an item event in their household. The actor does not receive one.
_Avoid_: Alert, message, activity
