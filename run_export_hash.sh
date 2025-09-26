#!/usr/bin/env bash
IN=${1:-students_template.xlsx}
OUT=${2:-../student-performance-site-hash/students.json}
python3 export_ar_simple_hash.py "$IN" "$OUT"
echo "تم التصدير (خصوصية) إلى $OUT"
