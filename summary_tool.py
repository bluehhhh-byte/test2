from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def num(v):
    try:
        return float(v)
    except Exception:
        return 0.0


def main() -> None:
    source = ROOT / "source"
    disasters = read_csv(source / "재난발생_현황.csv")
    facilities = read_csv(source / "안전시설_현황.csv")

    type_counts = Counter(d["재난유형"] for d in disasters)
    region_damage = defaultdict(float)
    for d in disasters:
      region_damage[d["발생지역"]] += num(d["피해금액_만원"])

    facility_region = Counter(f["지역"] for f in facilities)
    facility_type = Counter(f["시설유형"] for f in facilities)

    summary = {
        "disaster_count": len(disasters),
        "facility_count": len(facilities),
        "top_disaster_types": type_counts.most_common(5),
        "top_damage_regions": sorted(region_damage.items(), key=lambda x: x[1], reverse=True)[:5],
        "facility_region_counts": facility_region.most_common(),
        "facility_type_counts": facility_type.most_common(),
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
