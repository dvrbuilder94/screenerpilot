#!/usr/bin/env python3
"""Read-only deterministic ranker; requires Python stdlib only."""
import json
from pathlib import Path
path = Path(__file__).resolve().parents[1] / "data" / "opportunities.json"
data = json.loads(path.read_text(encoding="utf-8"))
weights = {"demand":20,"acquisition":20,"monetization":20,"mvp":15,"margin":10,"automation":10,"risk":5}
for item in data["opportunities"]:
    axes=item["dimensions"]
    if any(not 0 <= axes[k] <= 5 for k in weights):
        raise ValueError(f"Invalid 0-5 rating in {item['id']}")
    raw=sum(axes[k]*w/5 for k,w in weights.items())
    item["calculated_score"]=round(max(0,raw-item["uncertainty_penalty"]),1)
for x in sorted(data["opportunities"],key=lambda q:q["calculated_score"],reverse=True):
    print(f"{x['calculated_score']:5.1f}  {x['id']}  {x['name']}")
