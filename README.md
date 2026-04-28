# Movie Recommendation System

A full-stack movie recommendation system built with **FastAPI** (backend) and **React** (frontend), powered by the MovieLens dataset.

---

## How It Works

The system offers three recommendation approaches accessible from the UI:

| Approach | Description |
|---|---|
| **User Recommendations** | Collaborative Filtering — finds users with similar taste and recommends what they liked. Trains both KNN and SVD, compares accuracy (RMSE), and uses whichever model performs better. |
| **Similar Movies** | Content-Based Filtering — enter a movie title and get movies with similar genres using TF-IDF and Cosine Similarity. Requires no user data. |
| **SVD Recommendations** | Matrix Factorization — decomposes the user-movie ratings matrix via Singular Value Decomposition (SciPy) to discover hidden patterns and predict unseen ratings. |

---

## Project Structure

```
Movie_Recommendation_system/
├── backend/
│   ├── main.py          # FastAPI server — 3 recommendation endpoints
│   └── final_model.pkl  # Pre-trained model (auto-downloaded on first run)
├── frontend/
│   └── src/
│       ├── App.js       # React UI with three recommendation tabs
│       └── App.css      # Styling
└── requirements.txt
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- pip

---

### 1. Backend

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload
```

> On the first run, `final_model.pkl` (~784 MB) is automatically downloaded from Google Drive via `gdown`. This may take a few minutes depending on your connection.

Backend runs at: `http://localhost:8000`

---

### 2. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Using the App

Once both servers are running, open `http://localhost:3000` in your browser. You will see three tabs:

### User Recommendations
- Enter a **User ID** (e.g. `1`, `42`, `300`) and press **Search**.
- Returns the top 10 movie recommendations for that user using the best-performing collaborative filtering model (KNN or SVD, selected automatically by RMSE).

### Similar Movies
- Enter a **movie title** (e.g. `Toy Story`, `The Matrix`) and press **Search**.
- Returns 10 movies with similar genres, ranked by cosine similarity score.

### SVD Recommendations
- Enter a **User ID** and press **Search**.
- Returns 10 movies predicted to have the highest rating for that user using SVD matrix factorization.

> Valid User IDs range from **1 to 610** (MovieLens small dataset). Movie titles must match the dataset — try exact names like `Toy Story` or `Pulp Fiction`.

---

## API Endpoints

The backend exposes these REST endpoints directly if you want to query without the UI:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns status and active model name |
| `GET` | `/recommend/{user_id}` | Top 10 picks via Collaborative Filtering (best model) |
| `GET` | `/similar/{movie_name}` | Top 10 similar movies via Content-Based Filtering |
| `GET` | `/recommend/svd/{user_id}` | Top 10 picks via SVD Matrix Factorization |

**Examples:**
```
GET http://localhost:8000/recommend/1
GET http://localhost:8000/similar/Toy%20Story
GET http://localhost:8000/recommend/svd/1
```

---

## Dataset

[MovieLens Small Dataset](https://grouplens.org/datasets/movielens/latest/) — 100,000 ratings from 610 users across 9,742 movies.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Uvicorn |
| ML / Data | NumPy, Pandas, Scikit-learn, SciPy |
| Frontend | React 19, Axios |
| Model Storage | Google Drive (auto-downloaded via gdown) |
| Dataset | MovieLens ml-latest-small |
