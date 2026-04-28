import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userId, setUserId] = useState("");
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setError("");
      setSearched(true);

      const res = await axios.get(
        `http://127.0.0.1:8000/recommend/${userId}`
      );

      if (res.data.recommendations.length === 0) {
        setMovies([]);
        setError("No recommendations found for this user ❌");
      } else {
        setMovies(res.data.recommendations);
      }
    } catch (err) {
      setError("Error fetching recommendations ⚠️");
    }
  };

  return (
    <div className="container">
      <h1>🎬 Movie Recommendation System</h1>

      <div className="input-section">
        <input
          type="number"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={fetchRecommendations}>
          Get Recommendations
        </button>
      </div>

      {/* ❌ ERROR MESSAGE */}
      {error && <p className="error">{error}</p>}

      {/* 🎬 MOVIES */}
      <div className="movies">
        {movies.map((movie, index) => (
          <div className="card" key={index}>
            <h3>{movie.title_clean}</h3>
            <p>{movie.genres}</p>
            <span>⭐ {movie.predicted_rating}</span>
          </div>
        ))}
      </div>

      {/* 🔍 NO RESULT STATE */}
      {searched && movies.length === 0 && !error && (
        <p className="no-data">No recommendations available 😕</p>
      )}
    </div>
  );
}

export default App;
