"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adventureHref, loadAdventureJournal, topicNames, type AdventureProgress, type IncorrectAdventureReview } from "@/lib/game/curriculum";
import { challengeSolutions } from "@/lib/game/challenge-solutions";

export function AdventureSummary({ progress, reviews = [] }: { progress: AdventureProgress; reviews?: IncorrectAdventureReview[] }) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [topic, difficulty] = progress.track.split("-");
  const adventureReviews = reviews.filter((review) => review.world === progress.world && review.track === progress.track);
  const reviewId = `review-${progress.world}-${progress.track}`;
  const percent = (progress.completedLessonIds.length + progress.passedQuestionIds.length) * 20;
  return <section className="surface-card adventure-journal-card">
    <div><span className="page-eyebrow">{progress.world === "first-island" ? "THE FIRST ISLAND" : "CHAPEL OF CHOICES"} / {difficulty.toUpperCase()}</span><h2>{topicNames[topic] ?? topic}</h2><p>{progress.completed ? "Lessons and both checks completed. Revisit this adventure or choose another challenge." : "Your selected adventure is saved. Continue with the next guide or check."}</p></div>
    <div className="hero-progress"><span><i style={{ width: `${percent}%` }} /></span><strong>{percent}%</strong></div>
    <div className="adventure-journal-stats"><span>{progress.completedLessonIds.length}/3 lessons</span><span>{progress.passedQuestionIds.length}/2 checks</span><span>{progress.coinsEarned} coins</span><span>{progress.attemptCount} attempts · {progress.mistakeCount} incorrect</span></div>
    <p className="adventure-evidence-note">{progress.completed ? "Practice completed, including a transfer check. This does not yet establish lasting mastery or a resolved misconception." : "Guide completion records reading; challenge answers provide separate practice evidence."}</p>
    {adventureReviews.length > 0 && <div className="adventure-card-review">
      <button className="adventure-review-toggle" type="button" aria-expanded={isReviewOpen} aria-controls={reviewId} onClick={() => setIsReviewOpen((open) => !open)}>
        {isReviewOpen ? "Hide question review" : `Review ${adventureReviews.length === 1 ? "question" : `${adventureReviews.length} questions`}`}
      </button>
      {isReviewOpen && <div className="incorrect-review-list" id={reviewId}>{adventureReviews.map((review) => {
        const solution = review.exerciseId ? challengeSolutions[review.exerciseId] : undefined;
        return <article className="incorrect-review-item" key={review.id}>
          <h3>{review.prompt}</h3>
          {review.kind === "code" ? <>
            <p><strong>Attempt:</strong> {review.yourAnswer}</p>
            {review.code
              ? <><p><strong>Your submitted code:</strong></p><pre><code>{review.code}</code></pre></>
              : <p>Your earlier attempt was recorded before submitted code was saved, so that code is unavailable.</p>}
            <p className="incorrect-review-explanation"><strong>Hint:</strong> {review.explanation}</p>
            {solution && <details className="adventure-review-solution"><summary>Show a working solution</summary><pre><code>{solution}</code></pre></details>}
          </> : <>
            {review.code && <pre><code>{review.code}</code></pre>}
            <p><strong>Your answer:</strong> {review.yourAnswer}</p>
            <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
            <p className="incorrect-review-explanation"><strong>Explanation:</strong> {review.explanation}</p>
          </>}
        </article>;
      })}</div>}
    </div>}
    <Link className="solid-action" href={adventureHref(progress)}>{progress.completed ? "Revisit adventure" : "Resume adventure"} →</Link>
  </section>;
}

export function AdventureJournal() {
  const [saves, setSaves] = useState<AdventureProgress[]>([]);
  const [reviews, setReviews] = useState<IncorrectAdventureReview[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadAdventureJournal().then((journal) => {
      if (active) {
        setSaves(journal.saves);
        setReviews(journal.incorrectReviews ?? []);
      }
    }).catch(() => { if (active) setError("Could not load your topic-adventure progress. Refresh to retry."); });
    return () => { active = false; };
  }, []);
  if (!saves.length && !error) return null;
  return <section className="adventure-journal" aria-label="Topic adventure progress"><h2>Your topic adventures</h2>{error && <p role="alert">{error}</p>}<div>{saves.map((save) => <AdventureSummary key={`${save.world}:${save.track}`} progress={save} reviews={reviews} />)}</div></section>;
}
