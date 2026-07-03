import { useEffect, useState } from "react";
import '../styles/stats.css';

function WordStats({ word, stats }) { // Formata os resultadps de um jeito bonito
  const max = Math.max(stats.correct1, stats.correct2, stats.incorrect);

  const bar = (value) => ({ width: `${(value / max) * 100}%` });

  return (
    <div className="word-card">
      <h3>{word}</h3>

      <div className="bar-row">
        <span>Correct 1</span>
        <div className="bar-container">
          <div className="bar correct1" style={bar(stats.correct1)}></div>
        </div>
        <span>{stats.correct1}</span>
      </div>

      <div className="bar-row">
        <span>Correct 2</span>
        <div className="bar-container">
          <div className="bar correct2" style={bar(stats.correct2)}></div>
        </div>
        <span>{stats.correct2}</span>
      </div>

      <div className="bar-row">
        <span>Incorrect</span>
        <div className="bar-container">
          <div className="bar incorrect" style={bar(stats.incorrect)}></div>
        </div>
        <span>{stats.incorrect}</span>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [statsList, setStatsList] = useState([]);

  useEffect(() => {
    async function getStats() {
      const res = await fetch("/api/getAllWordStats");
      const json = await res.json();

      // backend returns { results: [...] }
      setStatsList(json.results);
    }

    getStats();
  }, []);

  return (
    <>
    <div className="word-card-grid">
      {statsList.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "50px" }}>
          Loading statistics...
        </p>
      ) : (
        statsList.map((entry) => (
          <WordStats
            key={entry.letters}
            word={entry.letters}
            stats={{
              correct1: entry.CORRECT_1,
              correct2: entry.CORRECT_2,
              incorrect: entry.INCORRECT,
            }}
          />
        ))
      )}
    </div>
    </>
  );
}
