# emergentOS product architecture

## Thesis

emergentOS is an autonomous economy on Arc. The agent's job is not to generate marketing text or pretend to be a fund manager. It observes economic state, selects only from allowed actions, executes within hard limits and publishes verifiable outcomes.

## Product surfaces

1. **Overview** — public state of the system.
2. **Economy** — treasury, external revenue, liquidity, $EGENT activity and holder economics.
3. **Agent** — wallet, policies, decisions and execution history.
4. **Launchpad** — initially powered by Argus; eventually a native launch and operating layer.

## Economic direction

```
users / agents
      |
      v
economic activity
      |
      +--> token activity
      |
      +--> external USDC revenue
                 |
                 v
              treasury
                 |
              agent
       +---------+---------+
       |         |         |
     reserve  liquidity  ecosystem
                         / $EGENT
```

A durable system should become less dependent on $EGENT trading alone as new revenue-producing products are added.

## Data policy

Never show invented balances, revenue, PnL, burns, holder rewards or liquidity. Until a metric is connected to a verifiable source, render it as unavailable/pending.

## Security

- Public wallet addresses are safe to display.
- Never commit a seed phrase or private key.
- Agent signing must be separated from the public web app.
- Autonomous execution requires explicit spending and venue limits.
