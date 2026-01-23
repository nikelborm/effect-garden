# Queue decomposition

I have 3 sets of assets to render

1. immediate tier. usually there will be only one task that was immediately
   selected for downloading in case when user switches to a different asset,
   before clicking play. But we leave it to be a Set, just in case
2. next-possible click queue. Assets that a user can switch to with 1 click
3. next-possible double click queue. Assets that a user can switch to with 2 clicks

# How currently switch happens

1. user clicks a task
