from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import pickle
import pandas as pd

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------
# LOAD MODEL
# -------------------------------
model_data = pickle.load(open("model.pkl", "rb"))

ratings = model_data['ratings']
movies = model_data['movies']
predicted_df = model_data['predicted_matrix']
best_model = model_data['best_model']

print("Model loaded successfully ✅")
print("Best Model:", best_model)

# -------------------------------
# HOME ROUTE
# -------------------------------
@app.get("/")
def home():
    return {"message": "Movie Recommendation API is running 🚀"}

# -------------------------------
# RECOMMENDATION FUNCTION
# -------------------------------
def recommend_movies(user_id, top_n=10):
    # Check if user exists
    if user_id not in predicted_df.index:
        return []

    # Get predicted ratings for user
    user_preds = predicted_df.loc[user_id]

    # Get already rated movies
    rated_movies = ratings[ratings['userId'] == user_id]['movieId'].values

    # Remove already watched movies
    user_preds = user_preds.drop(labels=rated_movies, errors='ignore')

    # Get top N recommendations
    top_movies = user_preds.sort_values(ascending=False).head(top_n)

    # Map movie IDs to titles
    result = movies[movies['movieId'].isin(top_movies.index)][['movieId', 'title_clean', 'genres']].copy()

    # Add predicted ratings
    result['predicted_rating'] = result['movieId'].map(top_movies.to_dict())

    # Sort results
    result = result.sort_values(by='predicted_rating', ascending=False)

    return result.to_dict(orient="records")

# -------------------------------
# API ENDPOINT
# -------------------------------
@app.get("/recommend/{user_id}")
def get_recommendations(user_id: int):
    recommendations = recommend_movies(user_id)

    if not recommendations:
        return {"message": "User not found or no recommendations available"}

    return {
        "user_id": user_id,
        "recommendations": recommendations
    }