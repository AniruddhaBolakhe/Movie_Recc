from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data = pickle.load(open("final_model.pkl", "rb"))
ratings          = data['ratings']
movies           = data['movies']
predicted_df     = data['predicted_matrix']
user_item_matrix = data['user_item_matrix']
predicted_ratings = data['predicted_ratings']
cosine_sim       = data['cosine_sim']
best_model       = data['best_model']


@app.get("/")
def home():
    return {"message": "Movie Recommendation API running", "best_model": best_model.upper()}


@app.get("/recommend/{user_id}")
def recommend(user_id: int):
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
    if user_id not in user_item_matrix.index:
        return {"error": f"User {user_id} not found"}

    idx      = user_item_matrix.index.get_loc(user_id)
    top      = np.argsort(predicted_ratings[idx])[::-1][:10]
    movie_ids = user_item_matrix.columns[top]

    result = movies[movies['movieId'].isin(movie_ids)][['movieId', 'title_clean', 'genres']].copy()

    return {"user_id": user_id, "model": "SVD", "recommendations": result.to_dict(orient="records")}
