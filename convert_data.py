import pandas as pd
import json
import os
import math

def convert():
    # Input file paths
    disaster_path = r"C:\Users\박준성\Downloads\시험문제\실전세트02·블루_ 재난안전모니터링\3과목_자료묶음\재난발생_현황.csv"
    facility_path = r"C:\Users\박준성\Downloads\시험문제\실전세트02·블루_ 재난안전모니터링\3과목_자료묶음\안전시설_현황.csv"
    
    # Output file path (current directory)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "data.json")

    disasters = []
    facilities = []

    # Read disaster data
    if os.path.exists(disaster_path):
        try:
            df_disaster = pd.read_csv(disaster_path, encoding='utf-8')
            # Replace NaN/NaT with None so JSON serialization uses null instead of NaN
            df_disaster = df_disaster.where(pd.notnull(df_disaster), None)
            disasters = df_disaster.to_dict(orient='records')
            print(f"[OK] Loaded {len(disasters)} disaster records.")
        except Exception as e:
            print(f"[ERROR] Failed to read {disaster_path}: {e}")
    else:
        print(f"[ERROR] Disaster data not found at {disaster_path}")

    # Read facility data
    if os.path.exists(facility_path):
        try:
            df_facility = pd.read_csv(facility_path, encoding='utf-8')
            df_facility = df_facility.where(pd.notnull(df_facility), None)
            facilities = df_facility.to_dict(orient='records')
            print(f"[OK] Loaded {len(facilities)} facility records.")
        except Exception as e:
            print(f"[ERROR] Failed to read {facility_path}: {e}")
    else:
        print(f"[ERROR] Facility data not found at {facility_path}")

    # Combine into single JSON
    data = {
        "disasters": disasters,
        "facilities": facilities
    }

    # Save to data.json
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[SUCCESS] data.json created successfully at {output_path}")
    except Exception as e:
        print(f"[ERROR] Failed to save JSON: {e}")

if __name__ == "__main__":
    convert()
