import pandas as pd
from database import engine
import os

MOVIES_PATH  = os.path.join("data", "movies.csv")
RATINGS_PATH = os.path.join("data", "ratings.csv")

if not os.path.exists(MOVIES_PATH) or not os.path.exists(RATINGS_PATH):
    print("Files not found. Place movies.csv and ratings.csv inside the data/ folder.")
else:
    movies = pd.read_csv(MOVIES_PATH)
    ratings = pd.read_csv(RATINGS_PATH)

    try:
        movies.to_sql('movies', con=engine, if_exists='replace', index=False)
        ratings.to_sql('ratings', con=engine, if_exists='replace', index=False)
        print("Migration Successful")
    except Exception as e:
        print(f"Error: {e}")