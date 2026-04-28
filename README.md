# Movie Recommendation System

A full-stack movie recommendation system built with **FastAPI** (backend) and **React** (frontend), using the MovieLens dataset.

---

## Team

| Name | Role |
|---|---|
| Aniruddha Bolakhe | Backend API, Collaborative Filtering (US-04), Data Loading & Preprocessing (US-01, US-02, US-03) |
| Vidushi Negi | Content-Based Filtering (US-05), Matrix Factorization (US-06) |

---

## How It Works

The system uses three recommendation approaches:

| Approach | Description |
|---|---|
| **Collaborative Filtering** | Finds users with similar taste and recommends what they liked (KNN vs SVD — best model selected by RMSE) |
| **Content-Based Filtering** | Recommends movies with similar genres using TF-IDF and Cosine Similarity |
| **Matrix Factorization (SVD)** | Decomposes the user-movie ratings matrix using SVD to discover hidden patterns |

---

## Project Structure

```
Movie_Recommendation_system/
├── backend/
│   └── main.py          # FastAPI backend (3 API endpoints)
├── frontend/
│   └── src/
│       ├── App.js       # React frontend
│       └── App.css      # Styling
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- pip

### Backend Setup

```bash
cd backend
pip install fastapi uvicorn numpy pandas scikit-learn gdown
uvicorn main:app --reload
```

> On first run, `final_model.pkl` (~784 MB) will be automatically downloaded from Google Drive.

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/recommend/{user_id}` | Collaborative Filtering — top 10 picks for a user |
| GET | `/similar/{movie_name}` | Content-Based — movies similar to a given title |
| GET | `/recommend/svd/{user_id}` | SVD Matrix Factorization — top 10 picks for a user |

---

## Dataset

[MovieLens Small Dataset](https://grouplens.org/datasets/movielens/latest/) — 100,000 ratings from 610 users across 9,742 movies.

---

## Tech Stack

- **Backend:** FastAPI, NumPy, Pandas, Scikit-learn, SciPy
- **Frontend:** React, Axios
- **Dataset:** MovieLens (ml-latest-small)
- **Model Storage:** Google Drive (via gdown)
