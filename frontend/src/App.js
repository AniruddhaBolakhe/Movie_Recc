import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const BASE = "http://127.0.0.1:8000";

const MODES = [
  {
    id: "user",
    label: "User Recommendations",
    desc: "Collaborative Filtering — Finds users who have similar taste to you and recommends movies they liked. We trained both KNN and SVD, compared their accuracy (RMSE), and this tab always uses whichever model performed better.",
  },
  {
    id: "similar",
    label: "Similar Movies",
    desc: "Content-Based Filtering — Enter a movie you like and we find movies with similar genres using TF-IDF and Cosine Similarity. No user data needed — it works purely on movie content.",
  },
  {
    id: "svd",
    label: "SVD Recommendations",
    desc: "Matrix Factorization (SVD) — Breaks down the entire user-movie ratings matrix into hidden patterns to predict what you would rate unseen movies. Uses Singular Value Decomposition (scipy) independently of the best-model selection above.",
  },
];

export default function App() {
  const [mode, setMode]       = useState("user");
  const [input, setInput]     = useState("");
  const [results, setResults] = useState([]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleModeChange = (m) => {
    setMode(m);
    setInput("");
    setResults([]);
    setError("");
  };

  const search = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      let res;
      if (mode === "user")    res = await axios.get(`${BASE}/recommend/${input}`);
      if (mode === "similar") res = await axios.get(`${BASE}/similar/${encodeURIComponent(input)}`);
      if (mode === "svd")     res = await axios.get(`${BASE}/recommend/svd/${input}`);

      const data = res.data;
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.recommendations || data.similar_movies || []);
      }
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Movie Recommender</h1>
      </header>

      <div className="tabs">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`tab ${mode === m.id ? "tab--active" : ""}`}
            onClick={() => handleModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mode-desc">{MODES.find((m) => m.id === mode).desc}</p>

      <div className="search">
        <input
          type={mode === "similar" ? "text" : "number"}
          placeholder={mode === "similar" ? "Movie name (e.g. Toy Story)" : "User ID (e.g. 1)"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button onClick={search} disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <div className="grid">
          {results.map((m, i) => (
            <div className="card" key={i}>
              <p className="card__title">{m.title_clean || m.title}</p>
              <p className="card__genres">{m.genres}</p>
              {m.predicted_rating !== undefined && (
                <p className="card__score">⭐ {parseFloat(m.predicted_rating).toFixed(2)}</p>
              )}
              {m.similarity_score !== undefined && (
                <p className="card__score">Match: {m.similarity_score}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
