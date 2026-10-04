import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { learningModules } from "@/lib/mock-data";
import { topicLessons } from "@/lib/topic-lessons";

interface Props {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function TopicLessonPage({ params, searchParams }: Props) {
  const [{ topic }, { mode }] = await Promise.all([params, searchParams]);
  const lesson = topicLessons[topic];
  const module = learningModules.find((item) => item.id === topic);
  if (!lesson || !module) notFound();

  const isPractice = mode === "practice";

  return (
    <main className="route-page topic-page">
      <div className="topic-topline">
        <Link href="/learn" className="quiet-action"><span aria-hidden="true">←</span> Back to learning path</Link>
        <span className="topic-mode"><Icon name={isPractice ? "target" : "book"} />{isPractice ? "PRACTICE REVIEW" : "LESSON"}</span>
      </div>
      <header className="topic-hero">
        <div className="topic-hero__copy">
          <span className="page-eyebrow">PYTHON FOUNDATIONS · {module.status.toUpperCase()}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.subtitle}</p>
          <div className="topic-objective"><strong>What you’ll learn</strong><span>{lesson.objective}</span></div>
        </div>
        <div className={`topic-hero__icon tone-${module.accent}`} aria-hidden="true">{module.icon}</div>
      </header>

      {isPractice ? <section className="practice-banner"><Icon name="target" /><div><strong>Practice review</strong><p>Refresh the key idea, then try the short challenge at the end.</p></div></section> : null}

      <nav className="lesson-outline" aria-label="In this lesson">
        <strong>In this lesson</strong>
        <a href="#key-ideas">1. Key ideas</a>
        <a href="#big-picture">2. The big picture</a>
        <a href="#worked-examples">3. Worked examples</a>
        <a href="#common-mistakes">4. Common mistakes</a>
        <a href="#quick-check">5. Quick check</a>
        <a href="#your-turn">6. Your turn</a>
      </nav>

      <div className="topic-content-layout">
        <div className="topic-sections">
          <section className="key-ideas-group" id="key-ideas" aria-labelledby="key-ideas-title">
            <header className="lesson-group-heading"><span>SECTION 1</span><h2 id="key-ideas-title">Key ideas</h2><p>Start with the building blocks for this topic.</p></header>
            <div className="topic-sections__list">
              {lesson.sections.map((section, index) => (
                <article className="topic-section surface-card" key={section.heading}>
                  <div className="topic-section__number">{String(index + 1).padStart(2, "0")}</div>
                  <div><h3>{section.heading}</h3><p>{section.body}</p>
                    {section.code ? <pre className="topic-code"><code>{section.code}</code></pre> : null}
                    {section.takeaway ? <p className="topic-takeaway"><Icon name="sparkles" />{section.takeaway}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="topic-introduction surface-card" id="big-picture" aria-labelledby="topic-introduction-title">
            <span className="lesson-section-label">SECTION 2 · CONCEPT OVERVIEW</span>
            <h2 id="topic-introduction-title">The big picture: {lesson.introduction.heading}</h2>
            {lesson.introduction.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <pre className="topic-code"><code>{lesson.introduction.code}</code></pre>
            <h3>Trace what Python does</h3>
            <ol>{lesson.introduction.walkthrough.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>
          <section className="worked-examples" id="worked-examples" aria-labelledby="worked-examples-title">
            <header className="lesson-subheading"><span className="lesson-section-label">SECTION 3 · LEARN BY TRACING</span><h2 id="worked-examples-title">Worked examples</h2><p>Read the code, predict what happens, then compare your reasoning with the walkthrough.</p></header>
            {lesson.workedExamples.map((example, index) => (
              <article className="worked-example surface-card" key={example.title}>
                <div className="worked-example__heading"><span>EXAMPLE {index + 1}</span><h3>{example.title}</h3></div>
                <pre className="topic-code"><code>{example.code}</code></pre>
                <p>{example.explanation}</p>
                <div className="example-output"><strong>What happens</strong><code>{example.output}</code></div>
              </article>
            ))}
          </section>
          <section className="mistakes-card surface-card" id="common-mistakes" aria-labelledby="mistakes-title">
            <span className="lesson-section-label">SECTION 4 · DEBUGGING TIPS</span><h2 id="mistakes-title">Common mistakes</h2>
            <div className="mistake-list">{lesson.commonMistakes.map((item) => <article key={item.mistake}><strong>{item.mistake}</strong><p>{item.correction}</p></article>)}</div>
          </section>
          <section className="topic-checkpoint" id="quick-check">
            <span className="lesson-section-label">SECTION 5 · QUICK CHECK</span><h2>Pause and think</h2><p>{lesson.checkpoint}</p>
          </section>
          <section className="topic-practice surface-card" id="your-turn">
            <span className="lesson-section-label">SECTION 6 · YOUR TURN</span><h2>Small coding challenge</h2><p>{lesson.practicePrompt}</p>
            {lesson.exerciseId ? <Link className="solid-action" href={`/learn/${lesson.exerciseId}`}><Icon name="play" />Open interactive coding exercise</Link> : <div className="practice-placeholder"><Icon name="book" /><span>Challenge prompt ready.</span></div>}
          </section>
          <section className="topic-sources surface-card" aria-labelledby="topic-sources-title">
            <span className="page-eyebrow">KEEP EXPLORING</span><h2 id="topic-sources-title">More from the Python docs</h2>
            <p>The explanations above are written for this lesson. These official docs have more detail and examples.</p>
            <ul>{lesson.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul>
          </section>
          <section className="lesson-recap surface-card" aria-labelledby="lesson-recap-title">
            <span className="page-eyebrow">BEFORE YOU GO</span><h2 id="lesson-recap-title">Quick recap</h2>
            <ul>{lesson.recap.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>
        <aside className="topic-sidebar surface-card">
          <span className="page-eyebrow">LESSON GUIDE</span><h2>Keep this in mind</h2>
          <p>{module.beginnerNote}</p>
          <div className="topic-progress"><span>Path progress</span><strong>{module.progress}%</strong><i><b style={{ width: `${module.progress}%` }} /></i></div>
          <Link href="/learn" className="solid-action"><Icon name="check" />Back to your path</Link>
        </aside>
      </div>
    </main>
  );
}
