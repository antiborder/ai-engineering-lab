"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Equation } from "@/components/Equation";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { VllmDiagram } from "./VllmDiagram";
import { MemoryGridDiagram, type MemoryCell, type MemoryCellOwner } from "./MemoryGridDiagram";

const MAX_LEN = 2048; // tokens reserved per request under naive allocation
const BLOCK_SIZE = 16; // vLLM's real default KV cache block size, in tokens

function naiveUtilization(avgLen: number): number {
  return avgLen / MAX_LEN;
}

function pagedUtilization(avgLen: number): number {
  const blocksNeeded = Math.ceil(avgLen / BLOCK_SIZE) * BLOCK_SIZE;
  return avgLen / blocksNeeded;
}

function reservation(owner: MemoryCellOwner, used: number, wasted: number): MemoryCell[] {
  return [
    ...Array.from({ length: used }, () => ({ kind: "used" as const, owner })),
    ...Array.from({ length: wasted }, () => ({ kind: "wasted" as const, owner })),
  ];
}
function free(n: number): MemoryCell[] {
  return Array.from({ length: n }, () => ({ kind: "free" as const }));
}
function used1(owner: MemoryCellOwner): MemoryCell {
  return { kind: "used", owner };
}

// One request, reserved for the worst case, using almost none of it —
// illustrates "The Problem" Step. 32 cells total, matching GRID_CELLS
// below (1 cell ≈ 64 of MAX_LEN's 2048 tokens) — the same scale as every
// other grid in this Section, so cell counts don't silently vary Step to
// Step (caught in review: they used to be 16/32/9, which looked arbitrary
// — even fraudulent — despite each being independently "reasonable").
const RESERVATION_CELLS: MemoryCell[] = reservation("a", 2, 30);

// Several requests' reservations, each mostly wasted inside (internal
// fragmentation) with scattered single free cells between them, too
// small individually for a new reservation (external fragmentation) —
// illustrates "Two Kinds of Waste". Used+wasted+free cells here land
// close to the 60-80% waste figure the Step cites, not by coincidence.
// Per-guest ACTUAL usage (a reserves twice, c reserves twice): a = 2+2 =
// 4, b = 3, c = 1+1 = 2 — 9 total. The Fix's PHYSICAL_CELLS/FRONT_DESK
// arrays below must use this same 4/3/2 split, not a generic 3/3/3 —
// caught in review after they silently didn't match.
const FRAGMENTATION_CELLS: MemoryCell[] = [
  ...reservation("a", 2, 6),
  ...free(1),
  ...reservation("b", 3, 2),
  ...free(2),
  ...reservation("c", 1, 5),
  ...free(1),
  ...reservation("a", 2, 4),
  ...free(1),
  ...reservation("c", 1, 0),
  ...free(1),
];

// The same requests' actual usage (9 cells, matching FRAGMENTATION_CELLS'
// used-cell count) — illustrates "The Fix," paired with FRONT_DESK_ROWS
// below as two side-by-side diagrams: this one is the true physical
// layout (deliberately scattered — the Step's own text says rooms "do
// not need to sit next to each other," and this is where that has to
// actually be true), the other is the clean, ordered view the front
// desk's list gives each guest. Showing both side by side, rather than
// picking one, is what resolves it: a single diagram forced to be either
// "clearly low-waste" (grouped) or "honestly scattered" couldn't do both
// at once without contradicting its own caption. 9 used, 23 genuinely
// free — same totals as FRAGMENTATION_CELLS, same underlying pool.
// Matches FRAGMENTATION_CELLS' actual per-guest usage: a=4, b=3, c=2.
const PHYSICAL_CELLS: MemoryCell[] = [
  ...free(1),
  used1("a"),
  ...free(2),
  used1("b"),
  ...free(2),
  used1("c"),
  ...free(2),
  used1("a"),
  ...free(2),
  used1("b"),
  ...free(2),
  used1("a"),
  ...free(2),
  used1("c"),
  ...free(2),
  used1("a"),
  ...free(2),
  used1("b"),
  ...free(6),
];

// The same 9 rooms, as the front desk's own list sees them: one row per
// guest, each guest's own rooms in a tidy, uninterrupted sequence — no
// reference to where they actually physically sit, and no padding to
// force equal-length rows (a real 4/3/2 split, not a false 3/3/3).
const FRONT_DESK_ROWS: MemoryCell[][] = [reservation("a", 4, 0), reservation("b", 3, 0), reservation("c", 2, 0)];

const GRID_CELLS = 32; // cells representing MAX_LEN, for the live utilization grids in "Try it yourself"

function naiveGridCells(avgLen: number): MemoryCell[] {
  const used = Math.max(1, Math.round((avgLen / MAX_LEN) * GRID_CELLS));
  return reservation("a", used, GRID_CELLS - used);
}

function pagedGridCells(avgLen: number): MemoryCell[] {
  const used = Math.max(1, Math.round((avgLen / MAX_LEN) * GRID_CELLS));
  const blocksNeeded = Math.ceil(avgLen / BLOCK_SIZE) * BLOCK_SIZE;
  const total = Math.max(used, Math.round((blocksNeeded / MAX_LEN) * GRID_CELLS));
  return reservation("a", used, total - used);
}

// Illustrative KV cache cost for a 7B-parameter-class model (roughly
// matches published estimates for models in this size range) — used only
// to make "memory scales with context length × concurrency" concrete,
// not a precise spec for any specific model.
const MB_PER_TOKEN = 0.5;
const GPU_VRAM_GB = 80; // a common real GPU spec (e.g. an A100 80GB)

function totalCacheGb(contextLength: number, concurrency: number): number {
  return (MB_PER_TOKEN * contextLength * concurrency) / 1024;
}

/** Module 4 (Inference), Unit "vLLM" — the module's second Unit. Same
 * house style as Model Serving (no Southwear/Chloe/Maya narrative).
 * Covers spec.txt 19.2, scoped deliberately to avoid duplicating the 2
 * later Units that each own one of vLLM's mechanisms in depth
 * (Continuous Batching, Quantization): this chapter's own territory is
 * the 3 mechanisms neither of those Units claim — PagedAttention,
 * Prefix Caching, and Speculative Decoding — plus the KV cache concept
 * itself, which used to be planned as its own separate Unit (see
 * docs/product/module-4-inference.md) until writing PagedAttention
 * showed it couldn't be taught without a KV cache primer anyway. That
 * primer was extended here with the KV Cache Unit's one piece of content
 * that wasn't just a repeat of the primer: how cache size scales with
 * context length × concurrency — the module's 8→6 Unit consolidation.
 *
 * Rewritten after user feedback that the first draft assumed too much:
 * it used "KV cache" ~10 times with no definition (the dedicated KV
 * Cache Unit comes *after* this one), explained OS virtual memory to
 * readers who may never have taken an OS course, and left speculative
 * decoding fully abstract. Fixed by: a "KV Cache: A Quick Refresher"
 * Section built from Fundamentals' own Key/Value vocabulary before
 * PagedAttention needs it; a hotel-room analogy carrying the reader
 * through internal/external fragmentation and paging before naming
 * those terms; and a single worked example ("The Eiffel Tower is in
 * ___") threaded through all of Speculative Decoding instead of staying
 * abstract. Written for a first-year CS student with no prior
 * systems/OS background — only what this app itself already taught. */
export function VllmWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [avgLen, setAvgLen] = useState(300);
  const resetAvgLen = () => setAvgLen(300);

  const naiveUtil = naiveUtilization(avgLen);
  const pagedUtil = pagedUtilization(avgLen);
  const naiveGrid = naiveGridCells(avgLen);
  const pagedGrid = pagedGridCells(avgLen);

  const [contextLength, setContextLength] = useState(1000);
  const resetContextLength = () => setContextLength(1000);
  const [concurrency, setConcurrency] = useState(50);
  const resetConcurrency = () => setConcurrency(50);

  const totalGb = totalCacheGb(contextLength, concurrency);
  const overCapacity = totalGb > GPU_VRAM_GB;

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            Model Serving showed the request path and why traffic at scale is hard. This chapter
            meets vLLM, the real system most deployments actually run, and three of its tricks
            for serving far more traffic on the same hardware:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Why a Dedicated Serving Engine?</strong> — what a naive server leaves on the table.</li>
            <li><strong>The Pieces vLLM Combines</strong> — a map of what vLLM does, and which parts this chapter covers.</li>
            <li><strong>KV Cache: A Quick Refresher</strong> — what gets cached during generation, why, and how big it gets.</li>
            <li><strong>PagedAttention</strong> — vLLM&rsquo;s fix for wasted GPU memory.</li>
            <li><strong>Prefix Caching</strong> — reusing KV cache blocks across requests that share a beginning.</li>
            <li><strong>Speculative Decoding</strong> — a small model guessing ahead for the big one to check.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      body: (
        <div className="space-y-2">
          <p>
            vLLM is real, widely-used open-source software, originally built by researchers at UC
            Berkeley, for running the &ldquo;inference server&rdquo; stage from Model Serving —
            the software layer around a model that decides how requests share the GPU.
          </p>
          <p>
            The name is short for <strong>virtual LLM</strong>. &ldquo;Virtual&rdquo; is a nod to{" "}
            <strong>virtual memory</strong>, an idea explained fully — from scratch, no prior
            knowledge assumed — in the PagedAttention Section coming up.
          </p>
        </div>
      ),
      visual: <VllmDiagram />,
    },
    {
      section: "Welcome",
      title: "Where Does vLLM Actually Run?",
      body: (
        <div className="space-y-2">
          <p>
            vLLM is an ordinary running program — a server process, written mostly in Python,
            with its most performance-critical parts written in C++ and CUDA.
          </p>
          <p>
            The GPU driver and CUDA sit below it, executing whatever calculations vLLM sends
            them. They have no idea what a request even is — vLLM is the thing making that
            decision.
          </p>
        </div>
      ),
      visual: (
        <div className="max-w-sm mx-auto space-y-1.5 text-base">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center">
            <div className="font-medium text-neutral-700">Your application</div>
            <div className="text-neutral-500 text-sm mt-0.5">sends requests, gets answers back</div>
          </div>
          <div className="text-center text-neutral-300">↓ sends requests to</div>
          <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center">
            <div className="font-medium text-cyan-800">vLLM</div>
            <div className="text-neutral-500 text-sm mt-0.5">
              decides what to run, and when
            </div>
          </div>
          <div className="text-center text-neutral-300">↓ calls into</div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center">
            <div className="font-medium text-neutral-700">GPU driver / CUDA</div>
            <div className="text-neutral-500 text-sm mt-0.5">just executes whatever calculation it&rsquo;s given</div>
          </div>
        </div>
      ),
    },
    // -------------------- 1. Why a Dedicated Serving Engine? --------------------
    {
      section: "1. Why a Dedicated Serving Engine?",
      title: "The Naive Approach: One Request, Start to Finish",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>serving engine</strong> is the software that actually decides which
            requests run right now and manages the model&rsquo;s memory while doing it — the real
            implementation of the inference-server stage from Model Serving. Without one, the
            simplest version just calls the model directly, one request at a time.
          </p>
          <p>
            The GPU unit showed a GPU can run huge numbers of simple calculations at once — but
            only when there is enough data to keep all those cores busy.
          </p>
          <p>
            Serving one request at a time gives the GPU only one word&rsquo;s worth of work to do
            at each step — nowhere near enough data to fill thousands of cores. Most of them sit
            idle, instead of working on other requests at the same time.
          </p>
        </div>
      ),
      visual: <StatCard label="1 request at a time" value="most cores idle, even while running" tone="warn" />,
    },
    {
      section: "1. Why a Dedicated Serving Engine?",
      title: "The Measured Cost of Naive Serving",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Throughput</strong> just means how many requests get fully answered per
            second. Higher throughput means more users served on the same hardware.
          </p>
          <p>
            On that same GPU: without a serving engine, running one request at a time leaves most
            cores idle — throughput is only 1×. With vLLM, running many requests together keeps
            those cores busy, and throughput goes up to about 24× that.
          </p>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Same GPU, no serving engine — 1 request at a time" value="1× (baseline)" tone="warn" />
          <StatCard label="Same GPU, with vLLM — many requests at once" value="up to 24×" tone="good" />
        </div>
      ),
    },
    // -------------------- 2. The Pieces vLLM Combines --------------------
    {
      section: "2. The Pieces vLLM Combines",
      title: "The Pieces vLLM Combines",
      body: (
        <div className="space-y-2">
          <p>vLLM&rsquo;s throughput comes from several mechanisms working together:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Continuous batching</strong> — an approach from earlier serving systems, keeping the GPU busy across many requests at once (its own Unit, next in this module).</li>
            <li><strong>PagedAttention</strong> — stops KV cache memory from being wasted.</li>
            <li><strong>Prefix caching</strong> — built directly on PagedAttention&rsquo;s blocks, reuses KV cache blocks requests share.</li>
            <li><strong>Speculative decoding</strong> — an idea from decoding research, checking several guessed words per model call instead of one.</li>
          </ul>
          <p>The last three are this chapter&rsquo;s subject — starting with what a KV cache even is.</p>
        </div>
      ),
      visual: <VllmDiagram highlight={["memory", "prefix-cache", "speculative-decoding"]} />,
    },
    // -------------------- 3. KV Cache: A Quick Refresher --------------------
    {
      section: "3. KV Cache: A Quick Refresher",
      title: "Why Generating Text Needs Memory of the Past",
      body: (
        <div className="space-y-2">
          <p>
            Picture any Transformer, running on vLLM or anything else, generating &ldquo;The cat
            sat on the ___&rdquo; one word at a time. To choose the next word, it looks back at
            every word written so far and asks how relevant each one is — the same attention
            mechanism from Fundamentals&rsquo; Transformers Unit.
          </p>
          <p>
            For every earlier word, attention compares against that word&rsquo;s Key and Value —
            two small vectors computed once, the moment that word was generated.
          </p>
          <p className="text-sm text-neutral-500">
            Query works differently: computed once for a word&rsquo;s own turn, then never needed
            again — unlike Key and Value, which later words keep looking back at.
          </p>
        </div>
      ),
      visual: <StatCard label="Generating word 6 of &ldquo;The cat sat on the ___&rdquo;" value="looks back at words 1–5" />,
    },
    {
      section: "3. KV Cache: A Quick Refresher",
      title: "Recomputing the Same Old Words, Over and Over",
      body: (
        <div className="space-y-2">
          <p>
            Without saving anything, generating one more word means recomputing every earlier
            word&rsquo;s Key and Value from scratch — even though those words already had their
            turn and never change again.
          </p>
          <p>
            A 100-word response would redo this recomputation for the same early words up to 100
            times. That is work repeated for no reason.
          </p>
        </div>
      ),
      visual: <StatCard label="100-word response, nothing saved" value="early words recomputed up to 100×" tone="warn" />,
    },
    {
      section: "3. KV Cache: A Quick Refresher",
      title: "The KV Cache: Compute It Once, Reuse It",
      body: (
        <div className="space-y-2">
          <p>
            The KV cache is simply every earlier word&rsquo;s Key and
            Value, saved in GPU memory the moment they are computed. Generating a new word then
            only computes that one word&rsquo;s own Key and Value, and compares against everything
            already saved.
          </p>
          <p>This saved memory is exactly what the rest of this chapter is about managing efficiently.</p>
        </div>
      ),
      visual: <StatCard label="KV cache" value="saved Key/Value pairs, one per word so far" />,
    },
    {
      section: "3. KV Cache: A Quick Refresher",
      title: "The Cache Grows With Every Word, and With Every Request",
      body: (
        <div className="space-y-2">
          <p>The KV cache grows in two directions at once:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Longer context</strong> — every extra word generated adds one more Key/Value
              pair that has to stay saved for the rest of that response.
            </li>
            <li>
              <strong>More concurrent requests</strong> — the cache is never shared between
              different requests, so two customers talking to the assistant at the same time each
              need their own separate cache, all held in GPU memory together.
            </li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "3. KV Cache: A Quick Refresher",
      title: "Try it yourself: how big does the cache actually get?",
      body: (
        <div className="space-y-2">
          <p>
            For a model in the 7-billion-parameter class, saving one word&rsquo;s Key/Value pair
            costs roughly {MB_PER_TOKEN} MB. Drag how long each conversation is, and how many run
            at the same time, to see the total:
          </p>
          <Equation tex={"\\text{Total GB} = \\frac{\\text{MB per word} \\times \\text{words per conversation} \\times \\text{concurrent conversations}}{1024}"} />
        </div>
      ),
      controls: (
        <div className="w-full max-w-[320px] space-y-3">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Words per conversation</span>
              <span className="text-neutral-800 tabular-nums">{contextLength}</span>
            </div>
            <input
              type="range"
              min={100}
              max={4000}
              step={100}
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Concurrent conversations</span>
              <span className="text-neutral-800 tabular-nums">{concurrency}</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: () => {
        resetContextLength();
        resetConcurrency();
      },
      visual: (
        <StatCard
          label={`${contextLength} words × ${concurrency} conversations`}
          value={overCapacity ? `${totalGb.toFixed(1)} GB — more than an ${GPU_VRAM_GB} GB GPU has` : `${totalGb.toFixed(1)} GB of ${GPU_VRAM_GB} GB GPU memory`}
          tone={overCapacity ? "warn" : "good"}
        />
      ),
    },
    // -------------------- 4. PagedAttention --------------------
    {
      section: "4. PagedAttention",
      title: "The Problem: Reserving Space Before You Need It",
      body: (
        <div className="space-y-2">
          <p>
            Every server needs to store this cache somewhere in GPU memory, and for a long time
            most did it the same wasteful way: reserving one continuous chunk for each
            request&rsquo;s KV cache.
          </p>
          <p>
            That chunk was sized for the longest response the request might ever generate —
            before knowing how long the real response would actually be.
          </p>
          <p>
            Picture a hotel that reserves 32 adjacent rooms for one guest, sized for the most
            rooms that guest might ever need — before knowing how many they&rsquo;ll actually
            use. If they only end up needing 2, the other 30 sit empty, unusable by anyone else.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <MemoryGridDiagram cells={RESERVATION_CELLS} />
          <StatCard label="Reserved per request" value={`sized for ${MAX_LEN} tokens, worst case`} tone="warn" />
        </div>
      ),
    },
    {
      section: "4. PagedAttention",
      title: "Two Kinds of Waste",
      body: (
        <div className="space-y-2">
          <p>Reserving a room block sized for the worst case, like that, wastes space two ways:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Internal fragmentation</strong> — most guests only end up needing a couple
              of rooms, so most of what was reserved for them sits empty: space reserved but
              never used.
            </li>
            <li>
              <strong>External fragmentation</strong> — as different-sized reservations come and
              go, the hotel is left with scattered single free rooms, not enough next to each
              other for the next big reservation, even though plenty of rooms are free overall.
            </li>
          </ul>
          <p>vLLM&rsquo;s own published measurements found this wastes 60&ndash;80% of a GPU&rsquo;s KV cache memory.</p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <MemoryGridDiagram cells={FRAGMENTATION_CELLS} />
          <StatCard label="Memory wasted (naive reservation)" value="60–80%" tone="warn" />
        </div>
      ),
    },
    {
      section: "4. PagedAttention",
      title: "The Fix: Hand Out Rooms One at a Time",
      body: (
        <div className="space-y-2">
          <p>
            A real hotel would never reserve 32 rooms for one guest upfront. It gives out one
            room at a time, only as the guest actually needs another one.
          </p>
          <p>
            And those rooms do not need to sit next to each other — the front desk just keeps a
            list of which room belongs to which guest. The same rooms that used to sit wasted are
            now genuinely free, ready for other guests.
          </p>
        </div>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-neutral-500 text-center">Physical rooms</div>
            <MemoryGridDiagram cells={PHYSICAL_CELLS} />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-neutral-500 text-center">Front desk&rsquo;s list</div>
            <div className="flex flex-col items-center gap-1">
              {FRONT_DESK_ROWS.map((row, i) => (
                <MemoryGridDiagram key={i} cells={row} cols={row.length} legend={false} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      section: "4. PagedAttention",
      title: "The Front Desk's List Has a Name: a Page Table",
      body: (
        <div className="space-y-2">
          <p>
            Computer memory gets divided into small, equal-sized blocks the same way — each block
            is called a <strong>page</strong>. Whenever a program needs its next chunk of data
            stored, it goes into whatever page happens to be free, anywhere in memory.
          </p>
          <p>
            A <strong>page table</strong> is just a list, exactly like the front desk&rsquo;s:
            which page holds which piece of the program&rsquo;s data. The program itself never
            checks memory addresses directly — it only ever asks the page table.
          </p>
        </div>
      ),
      visual: (
        <div className="max-w-xs mx-auto bg-white border border-neutral-200 rounded-md p-2.5 text-base">
          <div className="text-neutral-500 text-sm mb-1">A page table, for example:</div>
          <div className="grid grid-cols-2 gap-x-4 text-neutral-700 tabular-nums">
            <span>Page 1</span><span>→ slot 340</span>
            <span>Page 2</span><span>→ slot 12</span>
            <span>Page 3</span><span>→ slot 875</span>
          </div>
        </div>
      ),
    },
    {
      section: "4. PagedAttention",
      title: "Virtual Memory: One Clean Space, Built From Scattered Pieces",
      body: (
        <div className="space-y-2">
          <p>
            The program only ever sees one clean, continuous stretch of memory, even though its
            real pages sit scattered all over physical memory.
          </p>
          <p>
            That illusion — a program acting as if it has one tidy block, when the real thing is
            scattered pieces stitched together by a page table — is what{" "}
            <strong>virtual memory</strong> means.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. PagedAttention",
      title: "PagedAttention: The Same Idea, Applied to the KV Cache",
      body: (
        <div className="space-y-2">
          <p>
            PagedAttention is vLLM&rsquo;s version of exactly
            this idea, applied to the KV cache: each request&rsquo;s Key/Value data is split into
            small fixed-size blocks — {BLOCK_SIZE} tokens each — allocated only as new words are
            actually generated, and stored wherever there is room.
          </p>
          <p>The same published measurements found this cuts memory waste to under 4%.</p>
        </div>
      ),
      visual: <StatCard label="Memory wasted (PagedAttention)" value="< 4%" tone="good" />,
    },
    {
      section: "4. PagedAttention",
      title: "Try it yourself: how much memory does reservation actually waste?",
      body: (
        <div className="space-y-2">
          <p>
            Every request here reserves memory sized for a {MAX_LEN}-token maximum response. Drag
            how long responses actually turn out to be, on average, and compare naive reservation
            against PagedAttention&rsquo;s {BLOCK_SIZE}-token blocks:
          </p>
          <Equation tex={"\\text{Utilization} = \\frac{\\text{average length used}}{\\text{memory actually reserved}}"} />
        </div>
      ),
      controls: (
        <div className="w-full max-w-[320px]">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Average response length</span>
              <span className="text-neutral-800 tabular-nums">{avgLen} tokens</span>
            </div>
            <input
              type="range"
              min={20}
              max={MAX_LEN - 20}
              step={20}
              value={avgLen}
              onChange={(e) => setAvgLen(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetAvgLen,
      visual: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Naive reservation" value={`${(naiveUtil * 100).toFixed(1)}% used`} tone={naiveUtil < 0.5 ? "warn" : "good"} />
            <StatCard label="PagedAttention" value={`${(pagedUtil * 100).toFixed(1)}% used`} tone="good" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <MemoryGridDiagram cells={naiveGrid} legend={false} />
            <MemoryGridDiagram cells={pagedGrid} legend={false} />
          </div>
          <div className="flex justify-center gap-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-neutral-700 inline-block" /> used</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-neutral-200 border border-dashed border-neutral-300 inline-block" /> reserved, unused</span>
          </div>
        </div>
      ),
    },
    // -------------------- 5. Prefix Caching --------------------
    {
      section: "5. Prefix Caching",
      title: "Many Requests Start the Same Way",
      body: (
        <div className="space-y-2">
          <p>Two common cases:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>A shared system prompt</strong> — Southwear&rsquo;s support assistant might
              start every request the same way, something like &ldquo;You are Southwear&rsquo;s
              support assistant. Be concise and polite. Only answer questions about
              Southwear&rsquo;s products.&rdquo; Every customer&rsquo;s request begins with those
              exact same words.
            </li>
            <li>
              <strong>A growing conversation</strong> — LLM API&rsquo;s Conversations &amp; Memory
              Section showed that every new turn resends the whole history so far, so each
              turn&rsquo;s request shares an identical, ever-growing beginning with the one right
              before it.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-md mx-auto space-y-1">
          <div className="text-neutral-700">
            System prompt: &ldquo;You are Southwear&rsquo;s support assistant. Be concise and
            polite. Only answer questions about Southwear&rsquo;s products.&rdquo;
          </div>
          <div className="text-neutral-500 text-sm">Identical at the start of every customer&rsquo;s request.</div>
        </div>
      ),
    },
    {
      section: "5. Prefix Caching",
      title: "Blocks Make Sharing Possible",
      body: (
        <p>
          Because PagedAttention already stores the KV cache as small blocks — separate rooms,
          not 32 reserved upfront — a block holding an identical shared beginning can simply
          be shared by more than one request, instead of every request computing and storing its
          own separate copy. vLLM calls this prefix caching.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "5. Prefix Caching",
      title: "What Reuse Buys You",
      body: (
        <p>
          For the second and later requests that share a prefix, the model skips recomputing that
          shared part entirely and starts from where it ends — cutting the work down to exactly
          the part of the request that was actually new.
        </p>
      ),
      visual: <StatCard label="500-token shared system prompt" value="computed once, reused after" tone="good" />,
    },
    // -------------------- 6. Speculative Decoding --------------------
    {
      section: "6. Speculative Decoding",
      title: "One Word, One Full Run",
      body: (
        <p>
          Generating text one word at a time means running the whole model once per word — a
          20-word answer means 20 separate full runs. Each run only predicts one word, so most of
          the GPU&rsquo;s parallel capacity goes unused every time.
        </p>
      ),
      visual: (
        <div className="space-y-3">
          <div className="text-center font-mono text-lg text-neutral-800">
            The Eiffel Tower is <span className="text-amber-600">?</span>
          </div>
          <StatCard label="20-word answer" value="20 separate full runs, one word each" tone="warn" />
        </div>
      ),
    },
    {
      section: "6. Speculative Decoding",
      title: "A Small Model Guesses Ahead",
      body: (
        <p>
          Speculative decoding adds a small, fast draft model that guesses several words ahead on
          its own — for &ldquo;The Eiffel Tower is ___,&rdquo; maybe &ldquo;in&rdquo;,
          &ldquo;Paris&rdquo;, &ldquo;France&rdquo;. The large model then checks all three guesses
          at once, instead of generating them one at a time.
        </p>
      ),
      visual: (
        <div className="space-y-3">
          <div className="text-center font-mono text-lg text-neutral-800">
            The Eiffel Tower is <span className="text-cyan-600">?</span>{" "}
            <span className="text-cyan-600">?</span> <span className="text-cyan-600">?</span>
          </div>
          <StatCard label="Draft model guesses" value={'"in", "Paris", "France"'} />
        </div>
      ),
    },
    {
      section: "6. Speculative Decoding",
      title: "Checking Guesses Costs About the Same as Making One",
      body: (
        <p>
          The large model checks all three guesses in one run, not three — using the same spare
          GPU capacity from the previous Step. Checking whether a guess is right is far cheaper
          than generating a word from nothing, which is where the speedup comes from.
        </p>
      ),
      visual: (
        <div className="space-y-3">
          <div className="text-center space-y-1.5">
            <div className="font-mono text-lg text-neutral-800">
              The Eiffel Tower is{" "}
              <span className="text-emerald-700">in</span>{" "}
              <span className="text-emerald-700">Paris</span>{" "}
              <span className="text-red-500 line-through">France</span>
            </div>
            <div className="flex justify-center gap-6 text-base">
              <span className="text-emerald-700">✓</span>
              <span className="text-emerald-700">✓</span>
              <span className="text-red-500">✗</span>
            </div>
            <div className="text-sm text-neutral-500">
              Correct word instead of &ldquo;France&rdquo;: <span className="font-mono text-neutral-800">&ldquo;.&rdquo;</span>
            </div>
          </div>
          <StatCard label="3 guesses, 1 run" value="≈ same cost as checking 1" tone="good" />
        </div>
      ),
    },
    {
      section: "6. Speculative Decoding",
      title: "Accept or Reject: The Same Output, Faster",
      body: (
        <p>
          The large model checks each guess in order — say it accepts &ldquo;in&rdquo; and
          &ldquo;Paris&rdquo; but rejects &ldquo;France,&rdquo; generating the correct word itself
          instead. Either way, the output is exactly what the large model alone would have
          produced, just faster, since multiple words got confirmed in one pass.
        </p>
      ),
      visual: <StatCard label="Typical speedup, when guesses are good" value="~2–3×" tone="good" />,
    },
    // -------------------- 7. Wrap-up --------------------
    {
      section: "7. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Serving one request at a time wastes the GPU&rsquo;s parallel power — published benchmarks show vLLM reaching up to 24× the throughput of that naive baseline.</li>
            <li>vLLM combines continuous batching (its own Unit) with PagedAttention, prefix caching, and speculative decoding.</li>
            <li>The KV cache saves every earlier word&rsquo;s Key and Value so generating a new word never needs to recompute them from scratch — but it grows with both context length and how many requests run at once.</li>
            <li>Naive KV cache reservation wastes 60&ndash;80% of memory to internal and external fragmentation; PagedAttention&rsquo;s fixed-size blocks — the same idea as OS virtual memory paging — cut that to under 4%.</li>
            <li>Prefix caching shares a block holding an identical beginning (like a system prompt) across requests, instead of recomputing it every time.</li>
            <li>Speculative decoding uses a small draft model to guess several words ahead, which the large model verifies in one pass — producing the exact same output, just faster.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "7. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>
            Continuous batching — the one piece of vLLM this chapter only mapped — is next,
            followed by quantization, performance metrics (and the hosted-vs-self-hosted decision
            they feed), and GPU hardware itself.
          </p>
          <Link
            href="/inference/continuous-batching"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to Continuous Batching →
          </Link>
        </div>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const [step, setStep] = useState(() => {
    if (initialStep === undefined) return 0;
    return initialStep < 0 ? total - 1 : Math.min(initialStep, total - 1);
  });
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          {isFirst ? (
            <a
              href="/inference/gpu"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to GPU
            </a>
          ) : (
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              Back
            </button>
          )}
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-sm text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar sections={steps.map((s) => s.section)} currentStep={step} onSelectStep={setStep} />

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-neutral-900">{current.title}</h3>
        <div className="text-base text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button onClick={current.resetAction} className="text-sm text-neutral-500 hover:text-neutral-800">
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
