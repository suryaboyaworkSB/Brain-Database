import anthropic
import os
from db.database import get_schema

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT_SQL = """You are the HealthSANG mechanistic reasoning engine — a specialist in genomic variant analysis, disease pathways, and drug mechanisms.

You have access to a SQLite database with the following schema:
{schema}

Your job is to translate user questions into valid SQLite SQL queries.

Rules:
- Return ONLY the raw SQL query — no explanation, no markdown, no backticks
- Use LIKE with wildcards for disease/gene name matching (e.g., LIKE '%parkinson%')
- Always use LIMIT 50 unless the user asks for more
- Use lowercase for string comparisons where possible
- Only use SELECT statements — never INSERT, UPDATE, DELETE, DROP

Reasoning modes you support:
1. Disease reasoning: disease → variants → pathways → regions
2. Gene reasoning: gene → pathways → diseases
3. Drug reasoning: disease → pathways → drugs
"""

SYSTEM_PROMPT_SUMMARIZE = """You are the HealthSANG mechanistic reasoning engine — a biomedical AI that explains complex genomic and pathway data in clear, insightful language.

Given a SQL query result, explain the findings as a biomedical expert would, covering:
- What the data shows mechanistically
- Which pathways, genes, or regions are most significant
- Any drug implications if relevant
- Keep it concise but scientifically meaningful (3–5 sentences max unless data is complex)

Format your response in clear sections if needed. Be specific — use actual names from the data.
"""


def classify_intent(question: str) -> str:
    """Classify the question into disease / gene / drug reasoning mode."""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        system="""Classify this biomedical question into one of three modes:
- disease: asking about a disease, condition, or disorder
- gene: asking about a specific gene or protein
- drug: asking about drugs, treatments, or therapeutics

Reply with only one word: disease, gene, or drug""",
        messages=[{"role": "user", "content": question}]
    )
    return response.content[0].text.strip().lower()


def generate_sql(question: str) -> str:
    """Use Claude to generate a SQL query from a natural language question."""
    schema = get_schema()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=SYSTEM_PROMPT_SQL.format(schema=schema),
        messages=[{"role": "user", "content": question}]
    )
    sql = response.content[0].text.strip()
    # Strip any accidental markdown
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return sql


def summarize_results(question: str, sql: str, columns: list, rows: list) -> str:
    """Use Claude to interpret and explain the SQL results."""
    data_preview = f"Columns: {columns}\nRows (first 20): {rows[:20]}"
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        system=SYSTEM_PROMPT_SUMMARIZE,
        messages=[{
            "role": "user",
            "content": f"User question: {question}\n\nSQL used:\n{sql}\n\nQuery results:\n{data_preview}"
        }]
    )
    return response.content[0].text.strip()
