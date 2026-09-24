# emergentOS

An autonomous onchain economy on Arc.

This repository was previously ScreenerPilot and is being rebuilt as **emergentOS**. The first public economy is **$EGENT**.

## V0

- Economy dashboard
- Agent transparency layer
- Argus-powered launchpad shell
- Public Arc wallet / onchain state
- No private keys or signing material in the frontend

## Architecture direction

Activity -> fees/revenue -> treasury -> constrained agent allocation -> product/liquidity/$EGENT ecosystem -> new activity.

The first launchpad phase uses Argus infrastructure. Native launch infrastructure can be introduced later if the product reaches sufficient usage.

## Agent wallet

`0x4fef4fe834ca4ee2003f08c57d76887ed68e5ecb`

Never commit private keys, seed phrases, wallet session credentials, or unrestricted signing secrets to this repository.
