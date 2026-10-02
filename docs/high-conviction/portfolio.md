# High Conviction — Portfolio

Source of truth for the portfolio snapshot used by the High Conviction dashboard.

## Snapshot

Captured in Chile on 2026-10-02 from the broker screen; market snapshot is treated as the 2026-10-01 US close for historical reconstruction.

| Ticker | Snapshot value (USD) | Weight | Theme |
|---|---:|---:|---|
| ORBS | 3,663.90 | 54.29% | DAT / crypto-linked |
| ONON | 629.47 | 9.33% | Consumer growth |
| ETHA | 537.77 | 7.97% | DAT / crypto-linked |
| MRVL | 476.33 | 7.06% | AI semiconductors |
| LITS | 345.80 | 5.12% | DAT / crypto-linked |
| RMBS | 259.41 | 3.84% | AI semiconductors |
| VST | 224.80 | 3.33% | AI power & grid |
| GEV | 213.12 | 3.16% | AI power & grid |
| MOD | 101.13 | 1.50% | Cooling |
| BKSY | 99.27 | 1.47% | Space / intelligence |
| POWI | 99.18 | 1.47% | AI semiconductors |
| ZSTK | 98.00 | 1.45% | DAT / crypto-linked |

**Total snapshot:** USD 6,748.18.

## Important interpretation rule

Before transaction history is imported, historical portfolio performance is a **current-holdings reconstruction**. Shares are inferred from the 2026-10-01 snapshot and historical closes. This answers “how this current basket would have behaved,” not “what the broker account actually returned before the snapshot.”

The dashboard must keep actual broker performance and reconstructed performance explicitly separated.

## Next data upgrade

Add a transaction ledger with: ticker, trade date/time, side, quantity, execution price, fees, deposits/withdrawals and corporate actions. Once available, calculate both time-weighted return (TWR) and money-weighted return (XIRR) against SPY.
