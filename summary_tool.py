import pandas as pd
import os
import sys
import csv

# Configure stdout to use UTF-8 to prevent encoding errors on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

def summarize_data():
    disaster_file = r"C:\Users\박준성\Downloads\시험문제\실전세트02·블루_ 재난안전모니터링\3과목_자료묶음\재난발생_현황.csv"
    facility_file = r"C:\Users\박준성\Downloads\시험문제\실전세트02·블루_ 재난안전모니터링\3과목_자료묶음\안전시설_현황.csv"
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(current_dir, "통계_결과.csv")

    print("=" * 50)
    print("🚨 재난 및 안전 데이터 자동 통계 요약")
    print("=" * 50)

    # Initialize stats dict
    stats = {}

    # 1. 재난발생 현황 분석
    if os.path.exists(disaster_file):
        df_disaster = pd.read_csv(disaster_file, encoding='utf-8')
        total_disasters = len(df_disaster)
        total_damage = df_disaster['피해금액_만원'].sum()
        avg_damage = df_disaster['피해금액_만원'].mean()
        
        stats['총 재난 발생 건수'] = f"{total_disasters}건"
        stats['총 피해 금액'] = f"{total_damage:,.0f}만원"
        stats['평균 피해 금액'] = f"{avg_damage:,.1f}만원"

        print("\n[재난발생 현황 요약]")
        print(f"총 재난 발생 건수: {total_disasters}건")
        print(f"총 피해 금액: {total_damage:,.0f}만원")
        print(f"평균 피해 금액: {avg_damage:,.1f}만원")
        
        type_counts = df_disaster['재난유형'].value_counts()
        print("\n- 재난유형별 발생 건수:")
        for t, count in type_counts.items():
            print(f"  * {t}: {count}건")
            stats[f'재난유형_{t}'] = f"{count}건"
            
        region_counts = df_disaster['발생지역'].value_counts()
        print("\n- 지역별 재난 발생 건수:")
        for r, count in region_counts.items():
            print(f"  * {r}: {count}건")
    else:
        print(f"\n[오류] 파일을 찾을 수 없습니다: {disaster_file}")

    # 2. 안전시설 현황 분석
    if os.path.exists(facility_file):
        df_facility = pd.read_csv(facility_file, encoding='utf-8')
        total_facilities = len(df_facility)
        avg_capacity = df_facility['수용인원'].mean()

        stats['총 안전시설 수'] = f"{total_facilities}개"
        stats['평균 수용 인원'] = f"{avg_capacity:,.1f}명"

        print("\n" + "=" * 50)
        print("[안전시설 현황 요약]")
        print(f"총 안전시설 수: {total_facilities}개")
        print(f"평균 수용 인원: {avg_capacity:,.1f}명")
        
        fac_type_counts = df_facility['시설유형'].value_counts()
        print("\n- 시설유형별 수:")
        for ft, count in fac_type_counts.items():
            print(f"  * {ft}: {count}개")
            stats[f'시설유형_{ft}'] = f"{count}개"
            
        fac_region_counts = df_facility['지역'].value_counts()
        print("\n- 지역별 안전시설 수:")
        for r, count in fac_region_counts.items():
            print(f"  * {r}: {count}개")
    else:
        print(f"\n[오류] 파일을 찾을 수 없습니다: {facility_file}")

    print("\n" + "=" * 50)
    
    # Write to CSV
    try:
        with open(output_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['항목', '통계값'])
            for key, val in stats.items():
                writer.writerow([key, val])
        print(f"[SUCCESS] 통계 결과를 CSV로 저장했습니다: {output_csv}")
    except Exception as e:
        print(f"[ERROR] CSV 저장 실패: {e}")

if __name__ == "__main__":
    summarize_data()
