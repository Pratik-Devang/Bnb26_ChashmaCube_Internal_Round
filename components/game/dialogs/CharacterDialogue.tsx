"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import elderTalk from "@/2d_assets/Dialogue_person/NPC_1/Talk.png";
import elderCalm from "@/2d_assets/Dialogue_person/NPC_1/Calm.png";
import keeperTalk from "@/2d_assets/Dialogue_person/NPC_2/Talk.png";
import keeperCalm from "@/2d_assets/Dialogue_person/NPC_2/Calm.png";
import rangerTalk from "@/2d_assets/Dialogue_person/NPC_3/Talk.png";
import rangerCalm from "@/2d_assets/Dialogue_person/NPC_3/Calm.png";
import scoutTalk from "@/2d_assets/Dialogue_person/NPC_4/Talk.png";
import scoutCalm from "@/2d_assets/Dialogue_person/NPC_4/Calm.png";
import styles from "./CharacterDialogue.module.css";

const portraits = {
  elder: { talk: elderTalk, calm: elderCalm }, keeper: { talk: keeperTalk, calm: keeperCalm },
  ranger: { talk: rangerTalk, calm: rangerCalm }, scout: { talk: scoutTalk, calm: scoutCalm },
};
export type DialoguePortrait = keyof typeof portraits;
export type CharacterConversation = { speaker: string; portrait: DialoguePortrait; lines: string[]; label?: string };

export function CharacterDialogue({ conversation, onComplete, onDismiss }: {
  conversation: CharacterConversation; onComplete: () => void; onDismiss: () => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const advanceButton = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(0);
  const [letters, setLetters] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const line = conversation.lines[page] ?? "";
  const revealed = reduceMotion || letters >= line.length;
  const last = page === conversation.lines.length - 1;

  useEffect(() => {
    const element = modal.current;
    element?.showModal();
    advanceButton.current?.focus();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); element?.close(); };
  }, []);

  useEffect(() => {
    setLetters(0);
    if (reduceMotion) return;
    const timer = setInterval(() => setLetters((count) => Math.min(count + 2, line.length)), 24);
    const stop = setTimeout(() => clearInterval(timer), Math.ceil(line.length / 2) * 24 + 24);
    return () => { clearInterval(timer); clearTimeout(stop); };
  }, [line, reduceMotion]);

  const advance = () => {
    if (!revealed) setLetters(line.length);
    else if (!last) { setLetters(0); setPage((value) => value + 1); }
    else onComplete();
  };

  return <dialog ref={modal} className={styles.dialog} aria-labelledby="conversation-speaker" onCancel={(event) => { event.preventDefault(); onDismiss(); }} onKeyDown={(event) => {
    event.stopPropagation();
    if (event.repeat) { event.preventDefault(); return; }
    if (event.key.toLowerCase() === "e" || ((event.key === " " || event.key === "Enter") && !(event.target instanceof HTMLButtonElement))) { event.preventDefault(); advance(); }
  }}>
    <div className={styles.portrait} aria-hidden="true">
      <Image src={portraits[conversation.portrait].calm} alt="" unoptimized priority />
      <Image src={portraits[conversation.portrait].talk} alt="" unoptimized priority className={styles.talking} style={{ opacity: revealed ? 0 : 1 }} />
    </div>
    <div className={styles.panel}>
      <div className={styles.nameplate} id="conversation-speaker">{conversation.speaker}</div>
      <button className={styles.close} onClick={onDismiss} aria-label="Close conversation">×</button>
      <div className={styles.copy}>
        <p className={styles.screenReader} aria-live="polite" aria-atomic="true">{line}</p>
        <p aria-hidden="true">{revealed ? line : line.slice(0, letters)}<span className={styles.cursor}>{revealed ? "" : "▌"}</span></p>
      </div>
      <footer><span>{page + 1} / {conversation.lines.length}<i /> E to continue · Esc to leave</span><button ref={advanceButton} onClick={advance}>{!revealed ? "Show text" : last ? conversation.label ?? "Let’s go" : "Continue"} <b aria-hidden="true">▾</b></button></footer>
    </div>
  </dialog>;
}
