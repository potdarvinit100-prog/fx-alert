# FX Alert

## Real-time problem it solves

If you receive money from abroad, pay for something in dollars or pounds,
or just watch the rupee, you want the current conversion without opening a
bank app — and a nudge when a rate you care about is hit. FX Alert converts
between USD, EUR, GBP and INR at live reference rates and lets you set a
rate alert that fires visibly on the page.

## Data source

- Frankfurter API (ECB reference rates):
  `https://api.frankfurter.dev/v1/latest?from=USD&to=INR,EUR,GBP`
  No API key. All pairs are computed through USD cross-rates from that one
  response.

## How to run

No build step and no dependencies. Open `index.html` in a browser, or serve
the folder, for example:

```sh
python3 -m http.server 8000
```

then open http://localhost:8000

## Honest limits

- AED is deliberately not offered. Frankfurter's ECB-based currency list
  does not include the UAE dirham — a request for AED returns no AED rate —
  so the app covers USD, EUR, GBP and INR only rather than showing a rate
  from another source without saying so.
- These are ECB daily reference rates, not live market or bank rates: they
  update once per ECB business day, so weekend values are Friday's rates,
  and your bank will quote something slightly different.
- Rate alerts are checked only when rates refresh (every 10 minutes), live
  only in this browser's local storage, and do not fire while the page is
  closed.
- If the rate request fails, the page shows an error and no conversion
  rather than old or invented rates.
