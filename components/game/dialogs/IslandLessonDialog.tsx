"use client";

import { useEffect, useRef } from "react";
import type { IslandActor } from "@/types/game";
import styles from "../GameWorld.module.css";

type Props = {
  actor: IslandActor;
  lockedMessage?: string;
  completed: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export function IslandLessonDialog({ actor, lockedMessage, completed, onClose, onComplete }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const lesson = actor.lesson;

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={onClose}>
      <section
        className={`${styles.dialog} ${styles.lessonDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="island-lesson-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.teacherPortrait} aria-hidden="true">
          <span>{lockedMessage ? "?" : lesson?.order}</span>
          <small>{actor.name}</small>
        </div>

        <div className={styles.dialogBody}>
          <div className={styles.dialogTopline}>
            <span>{lockedMessage ? "Trail out of order" : lesson?.eyebrow}</span>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close lesson">×</button>
          </div>

          <h2 id="island-lesson-title">{lockedMessage ? "You missed an earlier lesson" : lesson?.title}</h2>

          {lockedMessage ? (
            <div className={styles.lockedLessonMessage}>
              <p>{lockedMessage}</p>
              <strong>Follow the numbered teacher marker, then return here.</strong>
            </div>
          ) : (
            <>
              <div className={styles.lessonPages}>
                {lesson?.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {lesson?.code ? <pre className={styles.islandCode}><code>{lesson.code}</code></pre> : null}
              {lesson?.takeaway ? <div className={styles.islandTakeaway}><span>REMEMBER</span>{lesson.takeaway}</div> : null}
            </>
          )}

          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondaryAction} onClick={onClose}>Close</button>
            {!lockedMessage ? (
              <button type="button" className={styles.primaryAction} onClick={onComplete}>
                {completed ? "Continue exploring" : "I understand · +10 coins"}<span aria-hidden="true">→</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
