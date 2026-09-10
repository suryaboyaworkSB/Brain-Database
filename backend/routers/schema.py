from fastapi import APIRouter
from db.database import get_schema, get_table_list

router = APIRouter()


@router.get("/schema")
def schema():
    """Return the full database schema."""
    return {"schema": get_schema()}


@router.get("/tables")
def tables():
    """Return list of all tables."""
    return {"tables": get_table_list()}
