# Interactive walkthrough pedagogy guidelines

Design checklist for every interactive Chapter (see [`content-hierarchy.md`](./content-hierarchy.md)
for the Module/Unit/Chapter/Section/Step vocabulary used below). Apply this to every new Chapter,
and when reviewing/fixing an existing one.

## Format and structure

- Main content is an **interactive slideshow**: users progress through it Step by Step.
- It's fine for a Chapter to have many Steps — explain every single item one at a time rather
  than compressing several ideas into one Step.
- Break a Chapter into **Sections** (e.g. the Regression Chapter is split into Sections like
  "Linear Model" and "Overfitting"). Apply the same Section structure to every other Chapter.
- Within a Step, the layout order is always **title → description → figure**, at every screen
  width — not just on mobile. A figure must never sit beside the text (e.g. in a left/right
  grid), only below it, so that step text can always safely say "the picture below" without it
  becoming wrong on wider screens.
- A Chapter's first two Steps introduce it, in this fixed order:
  1. **"What you learn from this chapter"** — a table of contents: a numbered list of the
     Chapter's own Sections, each with a short (few-word) description of what it covers. No new
     jargon, no diagram/visual on this Step — it's a plain list, nothing else.
  2. **A "big picture" Step** (e.g. "The big picture, before the details") — one short
     plain-language paragraph on the overall payoff of the Chapter, paired with a diagram or
     other figure that gives a first look at the whole mechanism before its pieces are explained
     one at a time.
- After every Step is complete, show **"Explore it yourself"**: a free-play sandbox UI (currently
  rendered as the bottom half of the page) unlocked once the walkthrough is finished.

## Tone

- The teacher persona is **warm and approachable** — never cool, aloof, or mysterious.
- **Do not write like a review for people who already know the material.** Write for a reader
  who has completed the prior Chapters/Units but is genuinely new to this one — don't assume
  familiarity with this Chapter's own vocabulary just because it's connected to something
  they've already learned.

## Dialogue

- **Every line should carry a genuine reaction, not just relay information.** The student
  character reacts with surprise, resistance, or relief; the teacher character explains calmly.
  A line that only restates a fact, with no emotional beat, reads as filler.
- **Dialogue sets up the question; the Step's body answers it.** Keep precise definitions,
  formulas, and technical detail out of dialogue — dialogue should create curiosity or tension
  that the body then resolves. If a line of dialogue is doing the technical explaining itself,
  move that content into the body instead.
- **One speaker turn per line, plain sentences only.** The dialogue renderer treats each line as
  one speaker's quote and cannot render a multi-line list inside one turn. If a character needs
  to lay out several items, either fold them into one flowing sentence or move them into the
  Step's body as a real list.
- **Voice the reader's likely wrong assumption before correcting it.** Have a character ask the
  natural-but-incorrect question a real learner would have (e.g. "isn't it obviously the same
  AI?") before the other character corrects it — this catches a misconception the reader may
  already hold, rather than only ever explaining the right answer with nothing to contrast it
  against.

## Subject matter

- **Teach the real-world, industry-standard concept as of August 2026 — not this app's own
  implementation.** A walkthrough's subject (AI, an agent, an LLM, RAG, evaluation, a metric,
  etc.) is a real thing that exists in the industry; teach that thing, its actual mechanisms,
  and its real trade-offs, not a guided tour of this app's mock/simplified version of it.
- **Match verbs to what's actually happening.** Don't describe a Step as "building" or
  "constructing" something the characters are only using or running through — an imprecise verb
  quietly teaches the wrong mental model of the mechanism.
- **Reuse the Chapter's own running example across its Steps**, rather than introducing a new,
  unrelated example each time. Switch to a different domain only when deliberately generalizing
  a concept before returning to the running example.
- **Show a concrete failure scenario, not just the abstract rule.** When a Step explains why
  something matters, illustrate what actually goes wrong when it's skipped or done incorrectly —
  a specific case, a specific wrong score, a specific bug that slips through — rather than only
  stating the rule in the abstract.
- A Step should still make sense to someone who has never opened this app. If a Step only makes
  sense by reference to "how this app does X," rewrite it around the real concept instead.
- **Confine any disclosure that this app's version is simplified to the Chapter's "Try it
  yourself" Step(s) only** (e.g. "this app's agent never revisits its plan, unlike real
  agents") — that is the one place a reader is about to touch the simplified demo itself and
  needs the caveat. Every other Step teaches the real concept with no reference to this app's
  own implementation at all, not even a brief aside.

## Per-step content

- Keep the **new information introduced per Step to a minimum**.
- Keep the **explanation text concise**. If a concept needs more depth than that, don't inline
  it — put the fuller explanation behind a click/tap-triggered tooltip (a `Term`/glossary-style
  component), triggered on **click/tap, not mouse hover** (the app must work on mobile, where
  hover doesn't exist).
- **Avoid redundant or wordy phrasing.** If a Step's text risks running long, don't just write a
  longer paragraph — use paragraphs, line breaks, bullet lists, tables, or diagrams to keep it
  easy to scan.
- **No unbroken run of prose longer than ~50 words.** Count the whole continuous block — e.g.
  a `<p>`'s full text — not sentence by sentence: several short sentences run together in one
  paragraph with no list, heading, or diagram between them still count as a single unbroken run,
  and their word counts add up. If a block would run past 50 words with no structural break in
  it, resolve it — depending on what the content actually is — by turning it into a bullet list,
  splitting it into multiple subheading+body sections, showing it as a diagram, or rewording it
  more concisely. Never let conciseness make it harder to
  understand than the longer version would have been — clarity always wins over the character
  count when the two are in tension.
- Place **one or two graphs, 3D visualizations, or diagrams** per Step.
- **3D figures must be user-rotatable.**
- **Graphs must label both axes** (x and y).
- **Important equations must be visually prominent** (not buried in a sentence).

## Font sizes

- **Minimum font size, anywhere in the app, in prose or in a diagram: 15px.**
- **Exception — deliberately secondary/supplementary text** (a caption, an axis tick label, a
  small status badge, a footnote-style aside): minimum **14px**. Never smaller than that, even
  when the text is meant to read as de-emphasized.
- **Exception — subscripts, superscripts, and exponents**, where being smaller than the
  surrounding text is the whole point: no minimum: leave these as-is.
- Never shrink a font size to make text fit. If a diagram's box or a Step's text is too small for
  the required size, make the box bigger, shorten the text, or split the content across more
  Steps — text size is never the variable that moves.

## Notation

- **Keep variable names and mathematical symbols consistent everywhere they appear** — in prose,
  in equations, and in figures/diagrams alike. The same quantity must never pick up a different
  symbol depending on where it's shown.
- **Make it visually clear whether something is a vector, a matrix, or a single component of a
  vector** — through notation, labeling, or how it's described — so a reader can always tell
  which one they're looking at.

## Terminology

- **Reuse the same word or phrase for the same concept everywhere it appears, across Steps,
  Sections, and Chapters.** Prefer repeating a term over reaching for a synonym just to avoid
  repetition — a learner builds their mental model by recognizing a term they've already seen;
  a fresh synonym for something already named reads as a new concept, not a stylistic
  improvement, and forces the reader to re-check whether it actually means the same thing.
- When two Steps (even in different Chapters) compare the same two things — e.g. "a single LLM
  call" vs. "an AI agent" — use the exact same label for each side every time that comparison
  appears, rather than inventing a new name for either side in each place it comes up.
- This is the prose counterpart of the [Notation](#notation) rule above: that section keeps
  mathematical symbols consistent, this one keeps the words consistent.
- **Never use a term before the Step that introduces it.** Before writing a line that names a
  concept, check whether an earlier Step — in this Chapter or an earlier one — already defined
  it. If so, treat it as familiar; don't reintroduce it as new.

## Consistency checks

- **The reason a Step's dialogue gives for something must be the same reason its body explains.**
  If dialogue justifies a concept one way (e.g. "fixing one thing might break another"), the body
  below it must expand on that same justification — not a different, only loosely related one
  (e.g. general topic coverage). Re-read dialogue and body together after writing both.
- **Before reusing an example, check that it actually illustrates the point being made.** An
  example chosen to show "the same question worded differently" must actually be a paraphrase —
  not an unrelated edge case that happens to sit nearby.
- **Check for unintentional duplication across Steps and Chapters.** Before finishing a Step,
  check whether its explanation already exists elsewhere, worded almost the same way; if so, give
  the new Step a distinct angle instead of repeating the old one.

## Interactivity

- Where a Step lets the user adjust values or settings (drag, click, type), it must be genuinely
  interactive, not just illustrative.
- If a Step has a button that advances some sandbox state, it must also have an **undo/back**
  button.
- Whatever change a user can make in a Step, there must be a way to **undo or reset** it.

## Platform

- **Language: English** (multi-language support is a planned future addition — don't hardcode
  assumptions that block it).
- **Responsive design**: the app must be usable on mobile, not just desktop.
