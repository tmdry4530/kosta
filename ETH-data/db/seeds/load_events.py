from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
EVENTS_MD = ROOT / 'docs' / 'EVENTS.md'
OUTPUT_SQL = ROOT / 'db' / 'seeds' / 'events.sql'

FIELD_ORDER = (
    'id',
    'name_ko',
    'name_en',
    'event_date',
    'category',
    'region',
    'description',
    'source_url',
)


def sql_quote(value: str | None) -> str:
    if value is None:
        return 'NULL'
    return "'" + value.replace("'", "''") + "'"


def parse_yaml_blocks(text: str) -> list[dict[str, str]]:
    blocks = re.findall(r'```yaml\n(.*?)```', text, flags=re.DOTALL)
    events: list[dict[str, str]] = []
    for block in blocks:
        current: dict[str, str] = {}
        for raw_line in block.splitlines():
            line = raw_line.rstrip()
            if not line.strip():
                continue
            if line.startswith('- '):
                if current:
                    events.append(current)
                current = {}
                line = line[2:]
            stripped = line.strip()
            if ': ' not in stripped:
                continue
            key, value = stripped.split(': ', 1)
            current[key] = value.strip()
        if current:
            events.append(current)
    return events


def render_insert_rows(events: Iterable[dict[str, str]]) -> str:
    rows: list[str] = []
    for event in events:
        row = ', '.join(sql_quote(event.get(field)) for field in FIELD_ORDER)
        rows.append(f'    ({row})')
    return ',\n'.join(rows)


def build_sql(events: list[dict[str, str]]) -> str:
    columns = ', '.join(FIELD_ORDER)
    updates = ',\n    '.join(
        f"{column} = EXCLUDED.{column}"
        for column in FIELD_ORDER
        if column != 'id'
    )
    return f"""-- Generated from docs/EVENTS.md by db/seeds/load_events.py\nINSERT INTO events ({columns})\nVALUES\n{render_insert_rows(events)}\nON CONFLICT (id) DO UPDATE SET\n    {updates};\n"""


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate idempotent events seed SQL from EVENTS.md')
    parser.add_argument('--output', type=Path, default=OUTPUT_SQL, help='Output SQL path')
    args = parser.parse_args()

    events = parse_yaml_blocks(EVENTS_MD.read_text(encoding='utf-8'))
    if len(events) != 21:
        raise SystemExit(f'Expected 21 events, found {len(events)}')

    sql = build_sql(events)
    output_path = args.output if args.output.is_absolute() else ROOT / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql, encoding='utf-8')
    output_path = output_path.resolve()
    try:
        display_path = output_path.relative_to(ROOT)
    except ValueError:
        display_path = output_path
    print(f'Wrote {display_path} with {len(events)} events')


if __name__ == '__main__':
    main()
