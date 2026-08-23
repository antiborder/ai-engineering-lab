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
- A Chapter's first Step should be a short overview titled **"What you learn from this
  chapter"** — a plain-language preview of the payoff, with no new jargon and no bulleted list
  of sub-topics (keep it to one or two short sentences).
- After every Step is complete, show **"Explore it yourself"**: a free-play sandbox UI (currently
  rendered as the bottom half of the page) unlocked once the walkthrough is finished.

## Tone

- The teacher persona is **warm and approachable** — never cool, aloof, or mysterious.
- **Do not write like a review for people who already know the material.** Write for a reader
  who has completed the prior Chapters/Units but is genuinely new to this one — don't assume
  familiarity with this Chapter's own vocabulary just because it's connected to something
  they've already learned.

## Per-step content

- Keep the **new information introduced per Step to a minimum**.
- Keep the **explanation text concise**. If a concept needs more depth than that, don't inline
  it — put the fuller explanation behind a click/tap-triggered tooltip (a `Term`/glossary-style
  component), triggered on **click/tap, not mouse hover** (the app must work on mobile, where
  hover doesn't exist).
- **Avoid redundant or wordy phrasing.** If a Step's text risks running long, don't just write a
  longer paragraph — use paragraphs, line breaks, bullet lists, tables, or diagrams to keep it
  easy to scan.
- Place **one or two graphs, 3D visualizations, or diagrams** per Step.
- **3D figures must be user-rotatable.**
- **Graphs must label both axes** (x and y).
- **Important equations must be visually prominent** (not buried in a sentence).

## Notation

- **Keep variable names and mathematical symbols consistent everywhere they appear** — in prose,
  in equations, and in figures/diagrams alike. The same quantity must never pick up a different
  symbol depending on where it's shown.
- **Make it visually clear whether something is a vector, a matrix, or a single component of a
  vector** — through notation, labeling, or how it's described — so a reader can always tell
  which one they're looking at.

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
