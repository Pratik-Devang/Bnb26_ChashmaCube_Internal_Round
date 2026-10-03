"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface Round {
  start: number;
  requiredLastTile: number;
  choices: number[];
  correctStop: number;
}

export interface InterventionContent {
  type: string;
  title: string;
  estimatedMinutes?: number;
  instructions?: string;
  rounds?: Round[];
  nearTransferExerciseId?: string;
  farTransferExerciseId?: string;
}

interface Props {
  interventionId: string;
  content: InterventionContent;
  onComplete: () => Promise<void>;
  onContinueToTransfer: (exerciseId: string) => void;
}

export function RangeInterventionGame({
  interventionId: _interventionId,
  content,
  onComplete,
  onContinueToTransfer,
}: Props) {
  const defaultRounds: Round[] = [
    { start: 1, requiredLastTile: 5, choices: [5, 6, 7], correctStop: 6 },
    { start: 2, requiredLastTile: 8, choices: [8, 9, 10], correctStop: 9 },
  ];

  const rounds = content.rounds && content.rounds.length > 0 ? content.rounds : defaultRounds;
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const round = rounds[currentRoundIdx];
  const isCorrect = selectedChoice === round.correctStop;
  const isIncorrect = selectedChoice !== null && !isCorrect;

  // Compute which tiles are visited for the selected choice
  const visitedTiles: number[] = [];
  if (selectedChoice !== null) {
    for (let i = round.start; i < selectedChoice; i++) {
      visitedTiles.push(i);
    }
  }

  // Generate tile display range from start to max(choices)+1
  const maxDisplay = Math.max(round.requiredLastTile + 2, ...round.choices) + 1;
  const displayTiles: number[] = [];
  for (let t = round.start; t <= maxDisplay; t++) {
    displayTiles.push(t);
  }

  const handleSelectChoice = (choice: number) => {
    setSelectedChoice(choice);
    setErrorMsg(null);
  };

  const handleNextRound = async () => {
    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx(currentRoundIdx + 1);
      setSelectedChoice(null);
    } else {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        await onComplete();
        setAllCompleted(true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to record intervention completion.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetChoice = () => {
    setSelectedChoice(null);
  };

  const nearExerciseId = content.nearTransferExerciseId || "list-traversal-04";

  return (
    <section className="intervention-game-card surface-card" aria-label="Interactive boundary intervention">
      <header className="game-header">
        <div className="game-title-group">
          <span className="game-badge">
            <Icon name="brain" /> TARGETED INTERVENTION
          </span>
          <h3>{content.title || "Help Byte reach the final tile"}</h3>
          <p>
            {content.instructions || "Choose an endpoint in range(start, stop) so Byte visits every required tile."}
          </p>
        </div>
        <div className="round-pill" aria-live="polite">
          Round {currentRoundIdx + 1} of {rounds.length}
        </div>
      </header>

      {!allCompleted ? (
        <div className="game-stage">
          {/* Objective banner */}
          <div className="objective-strip">
            <span className="objective-label">MISSION</span>
            <span>
              Byte starts at tile <strong>{round.start}</strong> and must visit all tiles up to and including tile{" "}
              <strong>{round.requiredLastTile}</strong>.
            </span>
          </div>

          {/* Interactive Python expression builder */}
          <div className="code-expression-box" aria-label="Target range expression">
            <code>
              for tile in range({round.start}, <span className="param-slot">{selectedChoice ?? "?"}</span>):
            </code>
          </div>

          {/* Number line track */}
          <div className="track-container" aria-label="Tiles track">
            <div className="track-tiles">
              {displayTiles.map((tile) => {
                const isTarget = tile === round.requiredLastTile;
                const isVisited = visitedTiles.includes(tile);
                const isByteHere = visitedTiles.length > 0 && visitedTiles[visitedTiles.length - 1] === tile;

                let tileClass = "tile-node";
                if (isVisited) tileClass += " visited";
                if (isTarget) tileClass += " target";
                if (isByteHere) tileClass += " byte-here";

                return (
                  <div key={tile} className={tileClass}>
                    <span className="tile-num">{tile}</span>
                    {isByteHere ? (
                      <span className="byte-avatar" title="Byte is here" role="img" aria-label="Byte mascot">
                        🤖
                      </span>
                    ) : null}
                    {isTarget ? <span className="target-flag" title="Required final tile">🏁 Target</span> : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choices selection */}
          <div className="choices-group">
            <span className="choices-label">Choose the stopping value:</span>
            <div className="choices-buttons" role="radiogroup" aria-label="Range stopping value choices">
              {round.choices.map((choice) => {
                const selected = selectedChoice === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    className={`choice-button ${selected ? "selected" : ""}`}
                    onClick={() => handleSelectChoice(choice)}
                    aria-checked={selected}
                    role="radio"
                  >
                    <code>range({round.start}, {choice})</code>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback message */}
          {selectedChoice !== null ? (
            <div className={`feedback-banner ${isCorrect ? "success" : "failure"}`} role="alert">
              {isCorrect ? (
                <div>
                  <strong>🎉 Spot on!</strong>
                  <p>
                    In Python, <code>range({round.start}, {selectedChoice})</code> stops right before {selectedChoice},{" "}
                    so Byte visits tiles [{visitedTiles.join(", ")}] and reaches tile {round.requiredLastTile}!
                  </p>
                </div>
              ) : (
                <div>
                  <strong>⚠️ Not quite there yet.</strong>
                  <p>
                    <code>range({round.start}, {selectedChoice})</code> stops right before {selectedChoice}, visiting only [
                    {visitedTiles.length > 0 ? visitedTiles.join(", ") : "no tiles"}].
                    {selectedChoice === round.requiredLastTile ? (
                      <> It stops at {selectedChoice - 1} and misses tile {round.requiredLastTile}!</>
                    ) : (
                      <> It overshoots or misses the target tile.</>
                    )}
                  </p>
                  <button type="button" className="retry-action" onClick={handleResetChoice}>
                    Try another choice
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Footer actions */}
          <div className="game-footer">
            {isCorrect ? (
              <button
                type="button"
                className="solid-action"
                onClick={handleNextRound}
                disabled={isSubmitting}
              >
                <Icon name="check" />
                {isSubmitting
                  ? "Recording..."
                  : currentRoundIdx + 1 < rounds.length
                  ? "Next round"
                  : "Complete mini-game"}
              </button>
            ) : null}
            {errorMsg ? <div className="game-error" role="alert">{errorMsg}</div> : null}
          </div>
        </div>
      ) : (
        /* Completion state */
        <div className="game-completion">
          <div className="completion-icon">🌟</div>
          <h4>Intervention Complete!</h4>
          <p>
            You’ve mastered how Python’s <code>range(start, stop)</code> excludes its endpoint.
            Now apply this exact concept to a fresh near-transfer problem.
          </p>
          <button
            type="button"
            className="solid-action"
            onClick={() => onContinueToTransfer(nearExerciseId)}
          >
            <Icon name="play" /> Continue to Near-Transfer Challenge
          </button>
        </div>
      )}
    </section>
  );
}
