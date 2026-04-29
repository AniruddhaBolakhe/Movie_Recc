# Movie Recommendation System

A full-stack AI-powered movie recommendation system built with **FastAPI** and **React**, trained on the MovieLens dataset. It supports four independent recommendation approaches, real-time rating ingestion, and a clean dark-themed UI.

---

## Features

| Approach | Algorithm | What it does |
|---|---|---|
| Collaborative Filtering | KNN / SVD (auto-selected) | Finds users with similar taste and recommends movies they liked |
| Content-Based Filtering | TF-IDF + Cosine Similarity | Given a movie title, finds other movies with similar genres |
| Matrix Factorization | SVD (SciPy) | Decomposes the ratings matrix to uncover hidden patterns and predict unseen ratings |
| Deep Learning | Neural Collaborative Filtering | A trained neural network that learns complex user-movie interaction patterns |

**Real-time updates** — users can submit ratings from the UI. Ratings are saved to MySQL in the background and the recommendation cache refreshes every 60 seconds.

---

## Project Structure

```
Movie_Recommendation_system/
├── backend/
│   ├── main.py                 # FastAPI app — all recommendation endpoints
│   ├── database.py             # SQLAlchemy MySQL connection (reads from .env)
│   ├── migrate.py              # Loads movies.csv and ratings.csv into MySQL
│   ├── data/
│   │   ├── movies.csv          # MovieLens movies data (add manually)
│   │   └── ratings.csv         # MovieLens ratings data (add manually)
│   ├── .env                    # DB credentials (not committed)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.js              # React UI — 4 recommendation modes + rating panel
│   │   └── App.css             # Dark terminal-style theme
│   └── package.json
├── requirements.txt
└── README.md
```

> **Model files** (`final_model.pkl`, `ncf_model.h5`, `user_item_encoders.pkl`) are not stored in the repo. They are automatically downloaded from Google Drive on the first backend startup.

---

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8+

---

## Setup

### 1. Clone and install backend dependencies

```bash
cd Movie_Recommendation_system
pip install -r requirements.txt
```

---

### 2. Set up MySQL

Open your MySQL shell and create the database:

```sql
CREATE DATABASE movie_db;
```

Then create the `.env` file inside `backend/` with your credentials:

```
DB_USER=root
DB_PASS=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=movie_db
```

---

### 3. Load the MovieLens dataset

Download the MovieLens small dataset and place the CSV files in `backend/data/`:

```bash
cd backend
wget https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip
cp ml-latest-small/movies.csv data/
cp ml-latest-small/ratings.csv data/
```

Run the migration to load the data into MySQL:

```bash
python migrate.py
```

---

### 4. Start the backend

```bash
cd backend
uvicorn main:app --reload
```

On the **first run**, three model files are automatically downloaded from Google Drive:

| File | Size | Purpose |
|---|---|---|
| `final_model.pkl` | ~784 MB | Collaborative filtering + content-based models |
| `ncf_model.h5` | — | Neural Collaborative Filtering (deep learning) |
| `user_item_encoders.pkl` | — | User and item encoders for the NCF model |

This may take a few minutes depending on your internet connection.

Backend runs at: `http://localhost:8000`

---

### 5. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Using the App

Open `http://localhost:3000` in your browser. The app has four recommendation modes and a rating panel.

### Collaborative Filtering
- Enter a **User ID** (e.g. `1`, `42`, `300`) and click **Search**.
- Returns the top 10 movies for that user. The system automatically picks the better model (KNN or SVD) based on RMSE accuracy.

### Content-Based Filtering
- Enter a **movie title** (e.g. `Toy Story`, `The Matrix`) and click **Search**.
- Returns 10 movies with similar genres, ranked by cosine similarity score.

### SVD
- Enter a **User ID** and click **Search**.
- Returns 10 movies predicted to have the highest rating for that user using SVD matrix factorization independently of the collaborative model.

### Neural Network (NCF)
- Enter a **User ID** and click **Search**.
- Returns 10 movies predicted by the deep learning model, which captures non-linear interaction patterns between users and movies.

### Genre Filter
- After any search returns results, use the **Filter by genre** input to narrow down the displayed movies in real time.

### Rate a Movie
- Fill in your **User ID**, the **Movie ID**, and select a star rating (1–5).
- Click **Submit Rating**. The rating is saved to MySQL in the background and the system's recommendation cache will refresh within 60 seconds.

> Valid User IDs: **1 to 610** (MovieLens small dataset).  
> Movie titles must match the dataset — try exact names like `Toy Story` or `Pulp Fiction`.

---

## API Endpoints

The backend can also be queried directly without the UI:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns API status and active model name |
| `GET` | `/recommend/{user_id}` | Top 10 picks via Collaborative Filtering (best model auto-selected) |
| `GET` | `/similar/{movie_name}` | Top 10 similar movies via Content-Based Filtering |
| `GET` | `/recommend/svd/{user_id}` | Top 10 picks via SVD Matrix Factorization |
| `GET` | `/recommend/ncf/{user_id}` | Top 10 picks via Neural Collaborative Filtering |
| `POST` | `/rate` | Submit a user rating (saved to MySQL, triggers cache refresh) |

**Example requests:**

```
GET  http://localhost:8000/recommend/1
GET  http://localhost:8000/similar/Toy%20Story
GET  http://localhost:8000/recommend/svd/1
GET  http://localhost:8000/recommend/ncf/1

POST http://localhost:8000/rate
     { "userId": 1, "movieId": 1, "rating": 4.5 }
```

**Interactive API docs** are available at `http://localhost:8000/docs` (Swagger UI) once the backend is running.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI, Uvicorn |
| Machine Learning | Scikit-learn (KNN, SVD, TF-IDF), SciPy |
| Deep Learning | TensorFlow / Keras (Neural CF) |
| Data Processing | Pandas, NumPy |
| Database | MySQL, SQLAlchemy, PyMySQL |
| Frontend | React 19, Axios |
| Model Storage | Google Drive (auto-downloaded via gdown) |
| Dataset | MovieLens ml-latest-small (100K ratings, 9K movies, 610 users) |

---

## Dataset

[MovieLens Small Dataset](https://grouplens.org/datasets/movielens/latest/) — 100,836 ratings from 610 users across 9,742 movies, collected by the GroupLens research lab at the University of Minnesota.
