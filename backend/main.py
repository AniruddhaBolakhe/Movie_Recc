from fastapi import FastAPI, BackgroundTasks # MODIFIED: Added BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pickle
import numpy as np
import os
import gdown
import pandas as pd 
from tensorflow.keras.models import load_model
from database import engine
from pydantic import BaseModel
from sqlalchemy import text # NEW: Added for streaming SQL execution
import logging # NEW: Added for stream logging
import gc # NEW: Added for memory management

# --- NEW: Setup Logging for Streaming ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- NEW: Global variable for the reload timer ---
last_update_time = None

if not os.path.exists("ncf_model.h5"):
    print("Downloading NCF model from Google Drive...")
    gdown.download(id="19yRYDEWwkR7C4W5YycCoaXJ1LeI-OaRg", output="ncf_model.h5", quiet=False)
    print("NCF model download complete!")

ncf_model = load_model("ncf_model.h5", compile=False)

if not os.path.exists("user_item_encoders.pkl"):
    print("Downloading user/item encoders from Google Drive...")
    gdown.download(id="1V6tku8i2lltctNppO0YoQkX4YHrNOSyj", output="user_item_encoders.pkl", quiet=False)
    print("Encoders download complete!")

with open("user_item_encoders.pkl", "rb") as f:
    encoders = pickle.load(f)
    user_enc = encoders['user_encoder']
    item_enc = encoders['item_encoder']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("final_model.pkl"):
    print("Downloading model from Google Drive...")
    gdown.download(id="1KoJ1vW-GZdEzly5nAI_9MiY5LaSKyP3y", output="final_model.pkl", quiet=False)
    print("Download complete!")

# --- NEW: Data Loading with Memory Optimization (Fixes MemoryError) ---
with open("final_model.pkl", "rb") as f:
    temp_data = pickle.load(f)

ratings           = temp_data['ratings']
movies            = temp_data['movies']
predicted_df      = temp_data['predicted_matrix']
user_item_matrix  = temp_data['user_item_matrix']
predicted_ratings = temp_data['predicted_ratings']
cosine_sim        = temp_data['cosine_sim']
best_model        = temp_data['best_model']

del temp_data # NEW: Clear memory immediately
gc.collect() # NEW: Force garbage collection

# --- NEW: Function to reload ratings from MySQL (The Refresh Hook) ---
def refresh_rating_cache():
    global ratings, last_update_time
    ratings = pd.read_sql("SELECT * FROM ratings", engine)
    last_update_time = pd.Timestamp.now()
    logger.info("🔄 Live Cache Updated: Ratings reloaded from MySQL stream.")

@app.get("/")
def home():
    return {"message": "Movie Recommendation API running", "best_model": best_model.upper()}


@app.get("/metrics")
def get_metrics():
    models = [
        {
            "name": "KNN",
            "full_name": "K-Nearest Neighbors",
            "type": "Collaborative Filtering",
            "rmse": 1.0004,
            "best": best_model.upper() == "KNN",
        },
        {
            "name": "SVD",
            "full_name": "Singular Value Decomposition",
            "type": "Matrix Factorization",
            "rmse": 2.0914,
            "best": best_model.upper() == "SVD",
        },
        {
            "name": "NCF",
            "full_name": "Neural Collaborative Filtering",
            "type": "Deep Learning",
            "rmse": 0.8757,
            "best": False,
        },
    ]
    return {
        "models": models,
        "best_collaborative_model": best_model.upper(),
        "metric": "RMSE",
        "note": "Lower RMSE means more accurate predictions. RMSE measures the average error in predicted star ratings on a scale of 0.5 to 5.0.",
    }


@app.get("/recommend/{user_id}")
def recommend(user_id: int):
    # --- NEW: Check if we need to refresh data from the stream ---
    global last_update_time
    if last_update_time is None or (pd.Timestamp.now() - last_update_time).seconds > 60:
        refresh_rating_cache()

    if user_id not in predicted_df.index:
        return {"error": f"User {user_id} not found"}

    preds = predicted_df.loc[user_id]
    rated = ratings[ratings['userId'] == user_id]['movieId'].values
    preds = preds.drop(labels=rated, errors='ignore')
    top   = preds.sort_values(ascending=False).head(10)

    result = movies[movies['movieId'].isin(top.index)][['movieId', 'title_clean', 'genres']].copy()
    result['predicted_rating'] = result['movieId'].map(top.to_dict())
    result = result.sort_values('predicted_rating', ascending=False)

    return {"user_id": user_id, "model": best_model.upper(), "recommendations": result.to_dict(orient="records")}


@app.get("/similar/{movie_name}")
def similar(movie_name: str):
    match = movies[movies['title_clean'].str.lower() == movie_name.lower()]
    if match.empty:
        match = movies[movies['title'].str.lower() == movie_name.lower()]
    if match.empty:
        return {"error": f"Movie '{movie_name}' not found"}

    idx    = match.index[0]
    scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)[1:11]
    indices = [i[0] for i in scores]

    result = movies.iloc[indices][['title_clean', 'genres']].copy()
    result['similarity_score'] = [round(s[1], 2) for s in scores]

    return {"movie": movie_name, "similar_movies": result.to_dict(orient="records")}


@app.get("/recommend/svd/{user_id}")
def recommend_svd(user_id: int):
    # --- NEW: Check if we need to refresh data from the stream ---
    global last_update_time
    if last_update_time is None or (pd.Timestamp.now() - last_update_time).seconds > 60:
        refresh_rating_cache()

    if user_id not in user_item_matrix.index:
        return {"error": f"User {user_id} not found"}

    idx       = user_item_matrix.index.get_loc(user_id)
    top       = np.argsort(predicted_ratings[idx])[::-1][:10]
    movie_ids = user_item_matrix.columns[top]

    result = movies[movies['movieId'].isin(movie_ids)][['movieId', 'title_clean', 'genres']].copy()

    return {"user_id": user_id, "model": "SVD", "recommendations": result.to_dict(orient="records")}

# ------- us09 and us11-----------
@app.get("/recommend/ncf/{user_id}")
def recommend_ncf(user_id: int):
    # --- NEW: Check if we need to refresh data from the stream ---
    global last_update_time
    if last_update_time is None or (pd.Timestamp.now() - last_update_time).seconds > 60:
        refresh_rating_cache()

    try:
        movies_df = pd.read_sql("SELECT * FROM movies", engine)
        
        if 'title_clean' not in movies_df.columns and 'title' in movies_df.columns:
            movies_df['title_clean'] = movies_df['title']

        user_idx = user_enc.transform([user_id])[0]
        known_movie_ids = movies_df[movies_df['movieId'].isin(item_enc.classes_)]['movieId'].unique()
        
        if len(known_movie_ids) == 0:
            return {"error": "No valid movies found for prediction"}

        item_indices = item_enc.transform(known_movie_ids).astype('int32')
        user_input = np.array([user_idx] * len(item_indices), dtype='int32')
        
        predictions = ncf_model.predict([user_input, item_indices], batch_size=1024, verbose=0)
        
        top_indices = np.argsort(predictions.flatten())[-10:][::-1]
        recommended_movie_ids = item_enc.inverse_transform(top_indices)
     
        result = movies_df[movies_df['movieId'].isin(recommended_movie_ids)][['movieId', 'title_clean', 'genres']]
        
        return {
            "user_id": user_id, 
            "model": "Neural Collaborative Filtering (Deep Learning)",
            "recommendations": result.to_dict(orient="records")
        }
    except Exception as e:
        return {"error": f"Internal Error: {str(e)}"}


# --- NEW: User Story 10 - Real-Time Streaming Logic ---

class RatingSchema(BaseModel): # NEW: Schema for incoming data
    userId: int
    movieId: int
    rating: float

def stream_processor(user_id: int, movie_id: int, rating: float): # NEW: Background worker
    """
    Background Task: Ingests data into MySQL without blocking the API.
    """
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO ratings (userId, movieId, rating) VALUES (:user, :movie, :rate)"),
                {"user": user_id, "movie": movie_id, "rate": rating}
            )
        logger.info(f"STREAM SUCCESS: User {user_id} rated movie {movie_id} ({rating})")
    except Exception as e:
        logger.error(f"STREAM FAILURE: {e}")

@app.post("/rate") # NEW: The Streaming Endpoint
def post_rating(data: RatingSchema, background_tasks: BackgroundTasks):
    """
    Receives rating and dispatches to background stream.
    """
    background_tasks.add_task(stream_processor, data.userId, data.movieId, data.rating)
    return {
        "status": "Event Dispatched", 
        "message": "Your feedback is being processed through the real-time stream."
    }