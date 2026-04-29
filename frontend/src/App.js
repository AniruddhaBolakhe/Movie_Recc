import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const BASE = "http://127.0.0.1:8000";

const MODES = [
  {
    id: "user",
    label: "Collaborative",
    algo: "KNN / SVD",
    comment:
      "Looks at other users who have similar viewing habits to you and recommends movies they enjoyed. Automatically picks the most accurate model.",
    processing: "Scanning all users to find who shares your rating patterns, filtering out movies you have already seen, and ranking the best picks using the most accurate model (KNN or SVD).",
    basis: "Recommended based on what similar users rated highly.",
  },
  {
    id: "similar",
    label: "Content-Based",
    algo: "TF-IDF + Cosine",
    comment:
      "Enter a movie you like and we will find other movies with similar genres. No account or history needed — works purely on movie content.",
    processing: "Converting movie genres into a TF-IDF vector, then computing cosine similarity between the searched movie and every other movie in the dataset to find the closest genre matches.",
    basis: "Recommended because they share similar genres with your searched movie.",
  },
  {
    id: "svd",
    label: "SVD",
    algo: "Matrix Factorization",
    comment:
      "Analyses the entire database of ratings to uncover hidden patterns and predict which movies you would enjoy but have not seen yet.",
    processing: "Decomposing the full user-movie ratings matrix into hidden factors using Singular Value Decomposition, then reconstructing your predicted ratings for every unseen movie and picking the top 10.",
    basis: "Recommended by predicting your rating using hidden patterns across all users and movies.",
  },
  {
    id: "ncf",
    label: "Neural Network",
    algo: "Deep Learning",
    comment:
      "A trained neural network that learns subtle connections between users and movies, going deeper than traditional recommendation methods.",
    processing: "Passing your User ID through a trained neural network that has learned complex interaction patterns between users and movies, then scoring every movie and returning the highest-predicted ones.",
    basis: "Recommended by a deep learning model trained on 100,000+ user-movie interactions.",
  },
];

function TitleBar({ name }) {
  return (
    <div className="titlebar">
      <span className="dot dot--r" />
      <span className="dot dot--y" />
      <span className="dot dot--g" />
      <span className="titlebar__name">{name}</span>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`star ${s <= (hovered || value) ? "star--on" : ""}`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          aria-label={`${s} star`}
        >
          &#9733;
        </button>
      ))}
      {value > 0 && <span className="stars__label">{value}.0 / 5</span>}
    </div>
  );
}

export default function App() {
  const [mode, setMode]           = useState("user");
  const [input, setInput]         = useState("");
  const [results, setResults]     = useState([]);
  const [modelUsed, setModelUsed] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [genreFilter, setGenreFilter] = useState("");

  const [ratingUserId,  setRatingUserId]  = useState("");
  const [ratingMovieId, setRatingMovieId] = useState("");
  const [ratingValue,   setRatingValue]   = useState(0);
  const [ratingMsg,     setRatingMsg]     = useState("");
  const [ratingOk,      setRatingOk]      = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const currentMode = MODES.find((m) => m.id === mode);

  const handleModeChange = (m) => {
    setMode(m);
    setInput("");
    setResults([]);
    setModelUsed("");
    setError("");
    setGenreFilter("");
  };

  const search = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setModelUsed("");
    setGenreFilter("");
    try {
      let res;
      if (mode === "user")    res = await axios.get(`${BASE}/recommend/${input}`);
      if (mode === "similar") res = await axios.get(`${BASE}/similar/${encodeURIComponent(input)}`);
      if (mode === "svd")     res = await axios.get(`${BASE}/recommend/svd/${input}`);
      if (mode === "ncf")     res = await axios.get(`${BASE}/recommend/ncf/${input}`);
      const data = res.data;
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.recommendations || data.similar_movies || []);
        setModelUsed(data.model || "");
      }
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const submitRating = async () => {
    if (!ratingUserId || !ratingMovieId || ratingValue === 0) {
      setRatingOk(false);
      setRatingMsg("Fill in User ID, Movie ID, and select a rating.");
      return;
    }
    setRatingLoading(true);
    setRatingMsg("");
    try {
      await axios.post(`${BASE}/rate`, {
        userId:  parseInt(ratingUserId),
        movieId: parseInt(ratingMovieId),
        rating:  ratingValue,
      });
      setRatingOk(true);
      setRatingMsg("Rating submitted. Recommendations refresh within 60 seconds.");
      setRatingUserId("");
      setRatingMovieId("");
      setRatingValue(0);
    } catch {
      setRatingOk(false);
      setRatingMsg("Submission failed. Is the backend running?");
    }
    setRatingLoading(false);
  };

  const filteredResults = genreFilter.trim()
    ? results.filter((m) =>
        (m.genres || "").toLowerCase().includes(genreFilter.trim().toLowerCase())
      )
    : results;

  return (
    <div className="app">

      {/* ── Top bar ── */}
      <TitleBar name="movie.recommender.js" />

      <div className="layout">

        {/* ── Hero ── */}
        <section className="hero">
          <p className="hero__prompt">&gt;</p>
          <h1 className="hero__title">Movie<br />Recommender</h1>
          <p className="hero__sub">AI-powered movie recommendations</p>

          {/* mode selector */}
          <div className="mode-list">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-btn ${mode === m.id ? "mode-btn--active" : ""}`}
                onClick={() => handleModeChange(m.id)}
              >
                <span className="mode-btn__label">{m.label}</span>
                <span className="mode-btn__algo">{m.algo}</span>
              </button>
            ))}
          </div>

          {/* algorithm comment block */}
          <div className="comment-block">
            <span className="comment-block__bar" />
            <pre className="comment-block__text">{currentMode.comment}</pre>
          </div>
        </section>

        {/* ── Search + Results panel ── */}
        <section className="panel">
          <TitleBar name={`${currentMode.label}.results`} />
          <div className="panel__body">

            {/* search input */}
            <div className="search-row">
              <span className="search-row__prompt">&gt;</span>
              <input
                className="search-row__input"
                type={mode === "similar" ? "text" : "number"}
                placeholder={
                  mode === "similar"
                    ? "movie name (e.g. Toy Story)"
                    : "user_id (e.g. 1)"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <button className="search-row__btn" onClick={search} disabled={loading}>
                {loading ? "..." : "Search"}
              </button>
            </div>

            {/* error */}
            {error && <p className="err-line">{error}</p>}

            {/* loading */}
            {loading && (
              <div className="loading-block">
                <div className="loading-line">
                  <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                  <span className="loading-text">Working...</span>
                </div>
                <p className="loading-detail">{currentMode.processing}</p>
              </div>
            )}

            {/* results meta + filter */}
            {!loading && results.length > 0 && (
              <div className="results-meta">
                <span className="results-meta__count">
                  <span className="accent">{filteredResults.length}</span> results found
                  {modelUsed && (
                    <span className="results-meta__model">Model: {modelUsed}</span>
                  )}
                </span>
                <div className="filter-row">
                  <span className="filter-row__label">filter:</span>
                  <input
                    className="filter-row__input"
                    type="text"
                    placeholder="genre..."
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                  />
                  {genreFilter && (
                    <button className="filter-row__clear" onClick={() => setGenreFilter("")}>
                      clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* basis line */}
            {!loading && results.length > 0 && (
              <p className="basis-line">{currentMode.basis}</p>
            )}

            {/* no genre match */}
            {!loading && results.length > 0 && filteredResults.length === 0 && (
              <p className="err-line">No movies match "{genreFilter}". Try a different genre.</p>
            )}

            {/* movie grid */}
            {!loading && filteredResults.length > 0 && (
              <div className="grid">
                {filteredResults.map((m, i) => {
                  const title  = m.title_clean || m.title || "Unknown";
                  const genres = (m.genres || "").split("|").filter(Boolean);
                  return (
                    <div className="card" key={i}>
                      <span className="card__rank">{String(i + 1).padStart(2, "0")}</span>
                      <p className="card__title">{title}</p>
                      <div className="card__genres">
                        {genres.map((g, j) => (
                          <span key={j} className="tag">{g}</span>
                        ))}
                      </div>
                      {m.predicted_rating !== undefined && (
                        <p className="card__score accent">
                          {parseFloat(m.predicted_rating).toFixed(2)}
                          <span className="card__score-label"> / 5.00</span>
                        </p>
                      )}
                      {m.similarity_score !== undefined && (
                        <p className="card__score-label">Matched by genre similarity</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>

      </div>

      {/* ── Rate a Movie ── */}
      <section className="rate-section">
        <TitleBar name="rate.movie.js" />
        <div className="rate-body">
          <div className="rate-left">
            <p className="rate-heading">Rate a Movie</p>
            <p className="rate-sub">
              Enjoyed a film? Submit your rating here and the system will
              use it to improve your recommendations in real time.
            </p>
          </div>
          <div className="rate-right">
            <div className="rate-fields">
              <div className="field">
                <label className="field__label">Your User ID</label>
                <input
                  className="field__input"
                  type="number"
                  placeholder="e.g. 1"
                  value={ratingUserId}
                  onChange={(e) => setRatingUserId(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label">Movie ID</label>
                <input
                  className="field__input"
                  type="number"
                  placeholder="e.g. 1"
                  value={ratingMovieId}
                  onChange={(e) => setRatingMovieId(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label">Your Rating</label>
                <StarRating value={ratingValue} onChange={setRatingValue} />
              </div>
            </div>
            <button
              className="rate-submit"
              onClick={submitRating}
              disabled={ratingLoading}
            >
              {ratingLoading ? "Submitting..." : "Submit Rating"}
            </button>
            {ratingMsg && (
              <p className={ratingOk ? "rate-msg rate-msg--ok" : "rate-msg rate-msg--err"}>
                {ratingMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        MovieRecommender &mdash; Collaborative &middot; Content-Based &middot; SVD &middot; Neural Network
      </footer>

    </div>
  );
}
