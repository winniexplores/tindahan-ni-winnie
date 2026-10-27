# Tindahan ni Winnie

A sari-sari store math game for Grade 7 and 8 students around Baclaran. The player runs Winnie's store for five days: riding the jeep to buy stock, pricing goods, serving suki, giving change and checking the day's profit. On day 4 a typhoon warning arrives and the barangay needs help with relief packs.

It is plain HTML, CSS and JavaScript with no build step and no server, so it runs on GitHub Pages or straight from the folder (open `index.html`).

## Play it on GitHub Pages

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
3. After a minute the game is live at `https://<your-username>.github.io/tindahan-ni-winnie/`.

## Math in the game

| Part of the day | Grade 7 | Grade 8 |
| --- | --- | --- |
| Jeep trip | Fare = base fare + rate × extra km | Same, plus 20% student discount |
| Restocking | Adding pack prices | Adding pack prices |
| Pricing | Percent markup from unit cost, rounding up | Unit cost from pack price, then markup |
| Serving customers | Order totals and making change | Order totals and making change |
| Ledger | Profit = sales − cost of goods sold | Profit, plus profit as a percent of cost |
| Typhoon event | Division with remainders, multiplication | Division with remainders, proportion |

Every answer gets a worked explanation. The report card at the end shows accuracy for each skill so students can screenshot it for their teacher.

## Editing the content

Prices, products, places, jeep fares and customer names live in `js/data.js`. Change those values and refresh; no other file needs to change. The prices and fares are sample values for the game.

## Files

- `index.html` – page shell
- `css/style.css` – look and layout (works on phones)
- `js/data.js` – game content
- `js/game.js` – game logic

Progress is saved in the browser at the start of each day. Opening the page with `#debug` at the end of the URL exposes a small test hook used for automated playthroughs.
