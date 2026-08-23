# Content hierarchy: naming convention

This app's interactive learning content is organized into five nested levels. Use these names
consistently in code, comments, docs, and conversation — never "tab," "page," or "section" as a
loose synonym for a level other than the one it actually names below.

```
Module      "Fundamentals"                          (top-level nav item)
  └ Unit        "Transformers"                       (one page, e.g. /fundamentals/transformers)
      └ Chapter     "Attention"                       (one walkthrough — previously called a "tab")
          └ Section     "8. Multi-Head Attention"         (a segment in the SegmentedProgressBar)
              └ Step         "Splitting into heads"           (one screen/slide)
```

## Definitions

| Level | Name | What it is | Example |
|---|---|---|---|
| 1 | **Step** | The smallest unit — one screen of the interactive slideshow: a title, a short explanation, one or two figures, sometimes controls. | "Splitting into heads" |
| 2 | **Section** | A group of consecutive Steps within one Chapter, sharing one topic. Rendered as one segment of the `SegmentedProgressBar`. | "8. Multi-Head Attention" |
| 3 | **Chapter** | One self-contained walkthrough (steps + optional free-play sandbox). What earlier code called a "tab" within a Unit's tab-switcher. | "Attention" (one of four Chapters in the Transformers Unit) |
| 4 | **Unit** | One page (one route), containing one or more Chapters, e.g. via a tab-switcher UI. | "Transformers" (`/fundamentals/transformers`) |
| 5 | **Module** | The top-level nav grouping, containing multiple Units. | "Fundamentals" |

## Why these names

- **Step** and **Module** were already established (the codebase's own `MODULES` array, `app/layout.tsx`'s "five connected modules").
- **Section** matches the existing `section` field already used on every `Step` object and the `sections` prop of `SegmentedProgressBar` — no renaming needed there, just formalized.
- **Chapter** matches UI copy and code comments that already existed before this convention was written down (e.g. "This chapter has more new vocabulary than any other..."). What those comments called a "chapter" is exactly what the tab-switcher code called a "tab" — same thing, two names. "Chapter" wins going forward.
- **Unit** is new (previously unnamed, sometimes loosely called "section" or "page," colliding with the Section level above). Matches the Japanese "単元."

## Known collision this fixes

`app/fundamentals/page.tsx` previously had a `SECTIONS` constant listing Classical ML / Neural
Networks / Transformers / Tiny LLM — those are Units, not Sections. Renamed to `UNITS`.
