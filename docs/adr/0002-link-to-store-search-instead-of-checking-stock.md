# Link to the store's own search instead of checking stock

Members want to know whether an item is available before they go out. We chose not to check stock or find nearby branches inside OurHouse. Instead, a store can have a website, and tapping a store on an item opens that store's own search for the item, so the member sees the retailer's live page. UK supermarkets such as Aldi, Asda and Tesco offer no public product or stock API; the only alternatives were scraping their sites, which breaks without warning and conflicts with their terms, or paying a third-party data vendor. Showing stock ourselves would also mean storing a location for every household, which is personal data shared with all members.

## Consequences

- OurHouse never shows a stock level or a price; the retailer's page is the source of truth.
- Stores without a website are not tappable.
- Nearest-branch and stock features can be revisited if a retailer publishes an official API, as a separate piece of work with its own privacy decision about household location.
