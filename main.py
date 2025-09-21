from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Tuple
import os
from csv_test_base import CsvTestBase, ColumnRole

app = FastAPI()

# Initialize loader for CSV-based questions
loader = CsvTestBase(
    delimiter=";",
    question_column=ColumnRole.RIGHT,
)

RESOURCES_DIR = os.path.join(os.path.dirname(__file__), "resources")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Load categories at startup
categories_cache: Dict[str, List[Tuple[str, str]]] = loader.load_from_directory(RESOURCES_DIR)

# Static files (frontend)
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Robotics Test Portal API"}


@app.get("/api/categories")
async def api_categories():
    return {"categories": list(categories_cache.keys())}


@app.get("/api/questions")
async def api_questions(category: str, mode: str = "flashcards", limit: int = 10, offset: int = 0):
    if category not in categories_cache:
        raise HTTPException(status_code=404, detail="Category not found")
    items = categories_cache[category]
    # Normalize to objects with question/answer
    normalized = [
        {"question": q, "answer": a} for (q, a) in items
    ]
    # For test mode, we can shuffle later; here keep order, trim answers on client if needed
    sliced = normalized[offset: offset + max(0, limit)] if limit > 0 else normalized[offset:]
    # For test mode, we do not hide answer here to allow checking endpoint to be stateless on server side
    return {"items": sliced}


class CheckBody(BaseModel):
    category: str
    question: str
    answer: str


@app.post("/api/check")
async def api_check(body: CheckBody):
    category = body.category
    if category not in categories_cache:
        raise HTTPException(status_code=404, detail="Category not found")
    # Find expected answer by exact question match
    expected = None
    for q, a in categories_cache[category]:
        if q == body.question:
            expected = a
            break
    if expected is None:
        raise HTTPException(status_code=404, detail="Question not found in category")
    # Simple comparison: case-insensitive and trimmed
    def norm(s: str) -> str:
        return (s or "").strip().lower()
    correct = norm(body.answer) == norm(expected)
    return {"correct": correct, "expected": expected}
