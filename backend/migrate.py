import pandas as pd
from database import engine
import os

if not os.path.exists("movies.csv") or not os.path.exists("ratings.csv"):
    print("Files not found.")
else:
    movies = pd.read_csv("movies.csv")
    ratings = pd.read_csv("ratings.csv")

    try:
        movies.to_sql('movies', con=engine, if_exists='replace', index=False)
        ratings.to_sql('ratings', con=engine, if_exists='replace', index=False)
        print("Migration Successful")
    except Exception as e:
        print(f"Error: {e}")