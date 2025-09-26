# -*- coding: utf-8 -*-
import sys, json, hashlib, pandas as pd

HEADERS = {
    "nid": "رقم الهوية",
    "name": "الاسم",
    "hw": "الواجبات",
    "research": "البحوث",
    "class_act": "الأنشطة الصفية",
    "practical_act": "النشاط العملي",
    "absent": "الغياب",
    "prac_exam": "الاختبار العملي",
    "theo_exam": "الاختبار النظري",
    "notes": "ملاحظات"
}

def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

def get(row, header):
    return row[header] if header in row and not pd.isna(row[header]) else ""

def main():
    if len(sys.argv) < 3:
        print("Usage: python export_ar_simple_hash.py <input.xlsx> <output.json>")
        sys.exit(1)

    xlsx_path = sys.argv[1]
    out_path = sys.argv[2]

    df = pd.read_excel(xlsx_path, sheet_name="students")
    records = []

    for _, row in df.iterrows():
        nid_raw = str(get(row, HEADERS["nid"])).strip()
        name = str(get(row, HEADERS["name"])).strip()

        # Build grades map in the exact order
        grades = {}
        mapping = [
            ("hw","الواجبات"),
            ("research","البحوث"),
            ("class_act","الأنشطة الصفية"),
            ("practical_act","النشاط العملي"),
            ("prac_exam","الاختبار العملي"),
            ("theo_exam","الاختبار النظري"),
        ]
        for key, label in mapping:
            v = get(row, HEADERS[key])
            if v != "":
                try:
                    vnum = float(v)
                    vnum = int(vnum) if vnum.is_integer() else vnum
                    grades[label] = vnum
                except:
                    pass

        # Attendance
        absent_raw = get(row, HEADERS["absent"])
        try:
            absent = int(absent_raw)
        except:
            absent = 0

        notes = str(get(row, HEADERS["notes"])).strip() if get(row, HEADERS["notes"]) != "" else ""

        record = {
            "nid_hash": sha256_hex(nid_raw) if nid_raw else "",
            "name": name,
            "grades": grades,
            "attendance": {"absent": absent},
            "notes": notes
        }
        records.append(record)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(records)} records to {out_path}")

if __name__ == "__main__":
    main()
