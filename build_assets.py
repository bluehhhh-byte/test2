from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def to_number(value):
    if value in (None, ""):
        return None
    try:
        num = float(value)
        return int(num) if num.is_integer() else num
    except ValueError:
        return value


def main() -> None:
    source = ROOT / "source"
    disasters = read_csv(source / "재난발생_현황.csv")
    facilities = read_csv(source / "안전시설_현황.csv")

    payload = {
        "disasters": [
            {
                "사건ID": row["사건ID"],
                "발생일자": row["발생일자"],
                "재난유형": row["재난유형"],
                "발생지역": row["발생지역"],
                "규모등급": to_number(row["규모등급"]),
                "피해금액_만원": to_number(row["피해금액_만원"]),
                "인명피해여부": row["인명피해여부"],
                "복구기간_일": to_number(row["복구기간_일"]),
            }
            for row in disasters
        ],
        "facilities": [
            {
                "시설코드": row["시설코드"],
                "시설유형": row["시설유형"],
                "지역": row["지역"],
                "설치연도": to_number(row["설치연도"]),
                "점검등급": row["점검등급"],
                "수용인원": to_number(row["수용인원"]),
            }
            for row in facilities
        ],
    }

    (ROOT / "data.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "data.js").write_text("window.__DATA__ = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
