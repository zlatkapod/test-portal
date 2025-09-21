# Robotics Test Portal

A simple web portal to practice robotics topics using CSV-based Q&A decks. Categories are populated from CSV files in the `resources/` folder and rendered in a left sidebar. The main pane lets you practice with two modes: Flashcards and Test.

## Features
- Auto-detect categories from CSV files in `resources/`
- Flashcards mode: reveal answer, next/prev navigation
- Test mode: configurable number of questions per page, check answers client-side via API
- Minimal, dependency-light frontend served by FastAPI

## CSV format and parsing
This project uses the `csv_test_base` library to parse CSVs. In this configuration:
- delimiter: `;`
- question_column: `RIGHT` (questions are in the right column, answers in the left)

Place your CSV files into `resources/`. Each CSV file becomes a category named after the file (without extension). See `resources/robotic_business.csv` as an example.

## Getting started
### Requirements
- Python 3.10+
- `pip install fastapi uvicorn csv_test_base`

If you have a virtual environment, activate it and install the dependencies.

### Run the app
```
uvicorn main:app --reload
```
Then open your browser at http://127.0.0.1:8000/

### API overview
- `GET /api/categories` -> `{ "categories": ["category1", ...] }`
- `GET /api/questions?category=<name>&mode=flashcards|test&limit=<n>&offset=<k>` -> `{ "items": [{"question":"...","answer":"..."}, ...] }`
- `POST /api/check` with JSON `{ "category": "name", "question": "...", "answer": "..." }` -> `{ "correct": true/false, "expected": "..." }`

## Frontend usage
- Select a category in the left sidebar.
- Choose mode in the toolbar.
- Flashcards: click the answer area to reveal/hide the answer; navigate with Prev/Next.
- Test: set the number of questions per page and click Load; type answers and click Check to see correctness. Matching is case-insensitive and trims whitespace.

## Project structure
- `main.py` – FastAPI app, static file serving, and API endpoints
- `resources/` – CSV files (each becomes a category)
- `static/` – Frontend assets (index.html, styles.css, main.js)
- `test_lib.py` – Small script showing how the parsing library is used

## Notes
- On app start, all categories are loaded into memory. Restart the app if you add or change CSV files.
- The answer checking uses a simple normalized equality (lowercase, trim). You can extend this to tolerate punctuation, synonyms, or multiple valid answers.
