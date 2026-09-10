import sqlite3
import os
from typing import Any

DB_PATH = os.environ.get("DB_PATH", "./db/healthsang.sqlite")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_schema() -> str:
    """Extract full schema from the SQLite database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]

    schema_parts = []
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table});")
        columns = cursor.fetchall()
        col_defs = ", ".join([f"{col[1]} {col[2]}" for col in columns])
        schema_parts.append(f"TABLE {table} ({col_defs})")

    conn.close()
    return "\n".join(schema_parts)


def run_sql(sql: str) -> dict[str, Any]:
    """Execute a SQL query and return columns + rows."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        rows = cursor.fetchmany(100)
        columns = [d[0] for d in cursor.description] if cursor.description else []
        return {
            "columns": columns,
            "rows": [list(row) for row in rows],
            "count": len(rows),
        }
    except Exception as e:
        raise ValueError(f"SQL execution error: {str(e)}")
    finally:
        conn.close()


def get_table_list() -> list[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return tables
