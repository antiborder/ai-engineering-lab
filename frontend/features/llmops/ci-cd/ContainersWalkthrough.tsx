"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import type { CiCdChapterId } from "./CiCdLab";

const chapterLinkBtn = "text-cyan-700 hover:text-cyan-800 underline underline-offset-2 font-medium";

/** Every Step pairs its technical term(s) with the movie-set metaphor in
 * this same table shape, after a user question noted the metaphor wasn't
 * being used effectively without one — the running prose used it, but
 * nothing made the term↔metaphor correspondence itself explicit and
 * consistent, Step by Step. */
function metaphorTable(rows: { term: string; metaphor: string }[]) {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-500 bg-neutral-50">
            <th className="py-1.5 px-3 font-medium">Technical term</th>
            <th className="py-1.5 px-3 font-medium">Movie-set metaphor</th>
          </tr>
        </thead>
        <tbody className="text-neutral-800">
          {rows.map((r) => (
            <tr key={r.term} className="border-t border-neutral-200">
              <td className="py-1.5 px-3 font-medium">{r.term}</td>
              <td className="py-1.5 px-3">{r.metaphor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Module 5 (LLMOps), Unit "CI/CD & Deployment", Chapter 1 of 2 —
 * Containers. Split out of what was originally one combined Section in a
 * single-Chapter Walkthrough, after a user question noted that packaging
 * (a technology/format topic) and the pipeline-and-promotion workflow
 * that follows it share only one connecting thread (the pipeline's Deploy
 * step happens to use a container), not a throughline worth forcing into
 * one Chapter. Same multi-Chapter-Unit pattern Fundamentals' Transformers
 * Unit already uses (Tokens & Embeddings / Attention / Block / Generating
 * Text as four Chapters on one page, switched by tab, not by route).
 *
 * Rebuilt around one running metaphor (a 3D-printed movie set), after a
 * user question flagged the plain version as hard to follow, and supplied
 * docs/product/containers-3d-print-metaphor.md — a metaphor reference
 * document verified technically accurate before use (no errors found: it
 * correctly keeps EXPOSE and VOLUME as declarations rather than actions,
 * correctly separates multi-stage builds' "remove build tools" concern
 * from where model weights live, and correctly ties isolation to
 * Namespace). Mapping used throughout, translated to English for this
 * app's house style: Dockerfile → build instructions, Image → the
 * finished 3D data package, Container → a printed set. The metaphor supports
 * the technical term (bolded, stated first or alongside), never replaces
 * it — self-contained by the same standard the rest of this module's
 * chapters follow, no dependency on any other module.
 *
 * Extended with Namespace, the remaining Dockerfile instructions
 * (WORKDIR/EXPOSE/VOLUME/USER/ENTRYPOINT), and a new "Connecting
 * Containers" Section (Port Mapping / Docker network / Docker Compose),
 * after a user question asked what else from the reference doc was still
 * missing. Step titles use the real term, never the metaphor alone (e.g.
 * "Secrets Don't Go in the Image", not "...in the 3D Data Package"); each
 * Step's body opens with "<term> is like <metaphor>," then explains. */
export function ContainersWalkthrough({
  onNavigateToChapter,
}: {
  onNavigateToChapter?: (chapter: CiCdChapterId) => void;
}) {
  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
  }

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            A version has been chosen. Before it can run anywhere else, it has to be packaged.
            This chapter uses one running comparison throughout: building and running a container
            is like designing, then 3D-printing, a movie set.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>What Containers Solve</strong> — bundling code with the exact environment it needs, and how that isolation actually works.</li>
            <li><strong>Building an Image</strong> — what goes into that bundle, and why AI images get big.</li>
            <li><strong>Connecting Containers</strong> — reaching a sealed-off container from outside, and connecting containers to each other.</li>
            <li><strong>Sharing Images Safely</strong> — moving an image around, without moving secrets with it.</li>
          </ol>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          {metaphorTable([{ term: "Docker (this whole chapter)", metaphor: "Designing, then 3D-printing, a movie set" }])}
          <p className="text-sm text-neutral-500">
            Every Step from here uses this same table, pairing one technical term with its set-building equivalent.
          </p>
        </div>
      ),
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      body: (
        <div className="space-y-2">
          <p>
            Building and running a container is like designing, then 3D-printing, a movie set.
            It&rsquo;s the same three steps, in the same order:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Dockerfile</strong> is like the build instructions: what to build.</li>
            <li><strong>Image</strong> is like the finished 3D data package: a complete, unchangeable design.</li>
            <li><strong>Container</strong> is like the printed, standing set: the actual thing someone can walk into and use.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Dockerfile
              <br />
              <span className="text-neutral-500">Build instructions</span>
            </div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Image
              <br />
              <span className="text-neutral-500">Finished 3D data package</span>
            </div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
              Container
              <br />
              <span className="text-neutral-500">Printed, standing set</span>
            </div>
          </div>
          {metaphorTable([
            { term: "Dockerfile", metaphor: "Build instructions — what to build" },
            { term: "Image", metaphor: "Finished 3D data package — a complete, unchangeable design" },
            { term: "Container", metaphor: "Printed, standing set — the actual thing to walk into" },
          ])}
        </div>
      ),
    },
    // -------------------- 1. What Containers Solve --------------------
    {
      section: "1. What Containers Solve",
      title: "What a Container Is",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>container</strong> packages one app together with everything that app needs
            to run — its own binaries and libraries. Several containers can run side by side on
            the same machine.
          </p>
          <p>
            All of those containers share one <strong>Container Engine</strong>, one{" "}
            <strong>Operating System</strong>, and the same underlying{" "}
            <strong>Infrastructure</strong>. That infrastructure might be a laptop, a rack of
            servers, or the cloud.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-3">
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { app: "App 1", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
                { app: "App 2", tone: "border-orange-300 bg-orange-50 text-orange-800" },
                { app: "App 3", tone: "border-red-300 bg-red-50 text-red-800" },
              ].map((c) => (
                <div key={c.app} className="space-y-1">
                  <div className={`rounded-md border px-2 py-1.5 text-center text-sm font-medium ${c.tone}`}>
                    {c.app}
                  </div>
                  <div className={`rounded-md border px-2 py-1 text-center text-xs ${c.tone}`}>Bins/Libs</div>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-800">
              Container Engine
            </div>
            <div className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-center text-sm font-medium text-neutral-700">
              Operating System
            </div>
            <div className="rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-center text-sm font-medium text-white">
              Infrastructure
              <div className="text-xs font-normal text-neutral-300 mt-0.5">laptop · servers · cloud</div>
            </div>
          </div>
          {metaphorTable([
            { term: "Container Engine", metaphor: "The shared printer every set gets printed on" },
            { term: "Operating System", metaphor: "The building's own foundation, shared by every set inside it" },
            { term: "Infrastructure", metaphor: "The lot the building sits on — a laptop, a rack of servers, or the cloud" },
          ])}
        </div>
      ),
    },
    {
      section: "1. What Containers Solve",
      title: "\"Works on My Machine\"",
      body: (
        <p>
          A <strong>container</strong> is like a freshly printed, dedicated movie set, built and
          fitted exactly for one app. Without it, every app&rsquo;s parts would sit scattered on
          the floor of one shared room instead. One app&rsquo;s cabling gets tangled with
          another&rsquo;s. Something that worked one way the room was arranged breaks when
          it&rsquo;s rearranged. A container keeps nothing from one set ever tangled with
          another&rsquo;s.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <StatCard label="The problem" value="every app's parts sharing one messy room" tone="warn" />
          {metaphorTable([{ term: "Container", metaphor: "A freshly printed, dedicated set, built and fitted for one app" }])}
          <p className="text-sm text-neutral-500">
            Instead of every app&rsquo;s parts sharing one messy room, each app gets its own printed set —
            nothing from one ever gets tangled with another&rsquo;s.
          </p>
        </div>
      ),
    },
    {
      section: "1. What Containers Solve",
      title: "Image vs. Container",
      body: (
        <div className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Image</strong> is like the finished 3D data package itself: code, dependencies, and settings. It&rsquo;s saved as one complete design that never changes once finished.</li>
            <li><strong>Container</strong> is like one actual set, printed from that data package.</li>
          </ul>
          <p>
            Print the same 3D data package several times. Each print is an independent, identical
            copy — same design, separate physical sets.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          {metaphorTable([
            { term: "Image", metaphor: "One finished 3D data package — never changes once finished" },
            { term: "Container", metaphor: "One printed set — as many independent copies as you print" },
          ])}
          <div className="flex items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              One 3D data package
              <br />
              <span className="text-neutral-500">(image)</span>
            </div>
            <span className="text-neutral-400">→</span>
            <div className="flex gap-1.5">
              <div className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-2">Printed set</div>
              <div className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-2">Printed set</div>
              <div className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-2">Printed set</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      section: "1. What Containers Solve",
      title: "What's Actually Inside the Image",
      body: (
        <div className="space-y-2">
          <p>
            The <strong>image</strong> is like a finished 3D data package: permanent, static data,
            nothing moving yet. Three things are baked into it:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>OS layer</strong> is like the set&rsquo;s basic walls and floor — a minimal
              base.
            </li>
            <li>
              <strong>Libraries and dependencies</strong> are like the fixtures built into those
              walls — what the code needs:
              <ul className="list-[circle] list-inside space-y-1 ml-5 mt-1">
                <li>the language runtime itself (for example, the Python interpreter)</li>
                <li>every package installed on top of it</li>
              </ul>
            </li>
            <li>
              <strong>Application code</strong> is like the items brought in for this particular
              set.
            </li>
          </ul>
          <p>
            That is the entire image: a saved, unchanging file. None of it is running — it is just
            data, waiting to be printed.
          </p>
        </div>
      ),
      visual: metaphorTable([
        { term: "OS layer", metaphor: "The set's basic walls and floor" },
        { term: "Libraries & dependencies", metaphor: "Fixtures built into those walls (the language runtime + installed packages)" },
        { term: "Application code", metaphor: "The items brought in for this set" },
      ]),
    },
    {
      section: "1. What Containers Solve",
      title: "What's Actually Inside a Running Container",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>container</strong> is like that same data package, printed out and switched
            on. Everything from the image is now standing there unchanged — the walls, the
            fixtures, the items. But three more things appear that were never part of the image at
            all:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              The <strong>running process</strong> is like an automaton actually moving inside it
              right now. It&rsquo;s a wind-up figure driven by its own inner workings, not a
              static prop. It
              only exists once the set is printed and switched on; it is not part of the data
              package.
            </li>
            <li>
              <strong>Memory</strong> is like a workbench the automaton uses to lay out parts and
              data while it works. It empties out completely the moment the container stops.
            </li>
            <li>
              <strong>Storage</strong> is like a built-in shelf on the set&rsquo;s own wall — a
              writable space inside the container itself. It can hold data while the container is
              running. But the shelf is destroyed along with the set. Once the container is
              removed, whatever was on it is gone too.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Image&rsquo;s static content
              <br />
              <span className="text-neutral-500">(walls + fixtures + items)</span>
            </div>
            <span className="text-neutral-400">+</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Process, memory &amp; storage
              <br />
              <span className="text-neutral-500">(once printed &amp; switched on)</span>
            </div>
            <span className="text-neutral-400">=</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Container</div>
          </div>
          {metaphorTable([
            { term: "Container", metaphor: "The image's static content, printed out and standing" },
            { term: "Running process", metaphor: "An automaton moving inside it, once printed and switched on" },
            { term: "Memory", metaphor: "A workbench for laying out parts and data while it works" },
            { term: "Storage", metaphor: "A built-in shelf on the set's own wall — destroyed along with the set" },
          ])}
        </div>
      ),
    },
    {
      section: "1. What Containers Solve",
      title: "Namespace: How Isolation Actually Works",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>namespace</strong> is the mechanism, just like walls. It isolates one
            printed set from every other set, and from the host&rsquo;s open floor.
          </p>
          <p>
            This chapter describes deliberate holes in the wall, like a volume mount or GPU
            access. Each
            is a narrow, purpose-built exception carved through this same shell. None of
            them
            remove the isolation; they just cross it in one specific, controlled place.
          </p>
          <p className="text-sm text-neutral-500">
            Concretely: the OS keeps one shared table of what exists on the machine — running
            processes, network interfaces, mounted directories. A namespace gives a container its
            own private copy of one such table. That way, it only ever sees its own
            set&rsquo;s entries,
            never another&rsquo;s.
          </p>
        </div>
      ),
      visual: metaphorTable([
        { term: "Namespace", metaphor: "The set's own exterior shell — the walls that seal it off" },
        { term: "Process namespace", metaphor: "Its own private list of who's moving inside" },
        { term: "Network namespace", metaphor: "Its own private wiring, not shared with the host" },
        { term: "Mount namespace", metaphor: "Its own private floor plan of what's connected where" },
      ]),
    },
    // -------------------- 2. Building an Image --------------------
    {
      section: "2. Building an Image",
      title: "Anatomy of a Dockerfile",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>Dockerfile</strong> is like a set&rsquo;s build instructions — a simple,
            ordered recipe:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Start from an existing base set.</li>
            <li>Install the fixtures the items will need.</li>
            <li>Bring the items in.</li>
            <li>Note which switch to flip once it&rsquo;s printed and standing.</li>
          </ul>
          <p>
            The illustrative example below is not a real file from this app — just the shape every
            recipe like it follows.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <pre className="whitespace-pre-wrap text-base text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
            {"FROM python:3.12                     # start from an existing base set\n" +
              "RUN pip install -r requirements.txt  # install the fixtures the items need\n" +
              "COPY . /app                          # bring the items in\n" +
              "CMD [\"python\", \"serve.py\"]           # the switch to flip once it's printed"}
          </pre>
          {metaphorTable([
            { term: "FROM", metaphor: "Start from an existing base set" },
            { term: "RUN", metaphor: "Install the fixtures the items need" },
            { term: "COPY", metaphor: "Bring the items in" },
            { term: "CMD", metaphor: "Note which switch to flip once it's printed" },
          ])}
        </div>
      ),
    },
    {
      section: "2. Building an Image",
      title: "More Dockerfile Instructions",
      body: (
        <div className="space-y-2">
          <p>A few more instructions round out a typical build recipe:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>WORKDIR</strong> is like writing &ldquo;from here on, work inside this
              room&rdquo; — it sets which directory later instructions run in.
            </li>
            <li>
              <strong>EXPOSE</strong> is like marking a spot on the wall — &ldquo;turn this into
              an intercom later.&rdquo; It documents which port the container listens on, but
              does
              not connect anything by itself.
            </li>
            <li>
              <strong>VOLUME</strong> is like marking a spot on the wall — &ldquo;turn this into a
              vault connection later.&rdquo; It declares a mount point, but does not connect it
              to anything by itself either.
            </li>
            <li>
              <strong>USER</strong> is like deciding who is allowed to operate the automaton once
              it is running. That&rsquo;s which user account the process runs as, instead of the
              most
              powerful one by default.
            </li>
            <li>
              <strong>ENTRYPOINT</strong> is like a switch that is welded on, not just flipped.
              It&rsquo;s
              the main command that always runs when the container starts, harder to override
              than <code>CMD</code>.
            </li>
          </ul>
        </div>
      ),
      visual: metaphorTable([
        { term: "WORKDIR", metaphor: "\"From here on, work inside this room\"" },
        { term: "EXPOSE", metaphor: "Marking a spot for an intercom, not installing one" },
        { term: "VOLUME", metaphor: "Marking a spot for a vault connection, not connecting one" },
        { term: "USER", metaphor: "Deciding who's allowed to operate the automaton" },
        { term: "ENTRYPOINT", metaphor: "A switch welded on, not just flipped" },
      ]),
    },
    {
      section: "2. Building an Image",
      title: "Where Do Model Weights Live?",
      body: (
        <p>
          A model&rsquo;s own <strong>weights</strong> are like one massive, heavy item — far
          bigger than everything else in the set. Printing an entirely new set just because a small
          item changed, every time, would be wasteful. The common practice is to keep that heavy
          item outside the set entirely. It connects through a hole in the wall to a giant vault.
          That&rsquo;s rather than printing it as a permanent fixture of the set itself.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Code image" value="tens of MB" tone="good" />
            <StatCard label="Model weights (kept in the vault)" value="multiple GB, connected through the wall" />
          </div>
          {metaphorTable([
            { term: "Model weights", metaphor: "One massive, heavy item" },
            { term: "External storage / model registry", metaphor: "A giant vault, kept outside the set" },
            { term: "Loading weights at startup (a volume mount)", metaphor: "A hole in the wall, connecting straight to that vault" },
          ])}
        </div>
      ),
    },
    {
      section: "2. Building an Image",
      title: "Multi-Stage Builds: Excluding Build Tools from the Final Image",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>multi-stage build</strong> is like building a set in a workshop full of
            scaffolding, cranes, and tools. The finished set itself never needs those tools once
            it&rsquo;s standing. You carry only the finished result into the final printed
            set, leaving the scaffolding behind.
          </p>
          <p>
            A Dockerfile can have more than one <code>FROM</code> line, each starting a fresh
            working area (a <strong>stage</strong>). Only the last stage in the file becomes the
            final image. Whatever is left behind in an earlier stage is simply never shipped.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <pre className="whitespace-pre-wrap text-base text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
            {"FROM python:3.12 AS builder                   # stage 1: the workshop, full build tools\n" +
              "RUN pip install --user -r requirements.txt    # do the heavy building work here\n" +
              "\n" +
              "FROM python:3.12-slim                         # stage 2: a fresh, bare set\n" +
              "COPY --from=builder /root/.local /root/.local # carry over only the finished result\n" +
              "COPY . /app                                   # bring the items in\n" +
              "CMD [\"python\", \"serve.py\"]                    # the switch to flip once it's printed"}
          </pre>
          <p className="text-sm text-neutral-600">
            Stage 1 (<code>builder</code>) starts from a full base image with everything needed to
            build the packages. Stage 2 starts over from a smaller, bare base — none of stage
            1&rsquo;s files carry over automatically. <code>COPY --from=builder</code> reaches back
            into stage 1 and pulls across only the already-built result. That leaves every
            compiler and
            build tool behind. Because stage 2 is the last one in the file, it — and only it —
            becomes the final image.
          </p>
          <div className="flex items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Workshop: scaffolding &amp; tools</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Finished set: scaffolding removed</div>
          </div>
          {metaphorTable([
            { term: "Build stage (FROM ... AS builder)", metaphor: "A workshop, full of scaffolding and tools" },
            { term: "COPY --from=builder", metaphor: "Carrying only the finished result out of the workshop" },
            { term: "Final image (the last stage in the file)", metaphor: "The finished set, with the scaffolding removed" },
          ])}
        </div>
      ),
    },
    {
      section: "2. Building an Image",
      title: "GPU Inside a Container",
      body: (
        <div className="space-y-2">
          <p>
            <strong>GPU access</strong> is like giving a set a specialized power line, not just
            ordinary power. Those are two different jobs, not two ends of the same wire:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Software</strong>: CUDA, a library baked into the image — outlets and a
              control panel already built into the set.
            </li>
            <li>
              <strong>Hardware</strong>: the container runtime
              opens a matching hole in the wall at startup. That lines those outlets up with the
              host&rsquo;s real GPU.
            </li>
          </ul>
          <p>Outlets with no hole in the wall draw nothing; a hole with no outlets has nothing to plug into.</p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Outlets &amp; control panel
              <br />
              <span className="text-neutral-500">(CUDA, from the image)</span>
            </div>
            <span className="text-neutral-400">+</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
              Hole to the real GPU
              <br />
              <span className="text-neutral-500">(opened by the runtime)</span>
            </div>
            <span className="text-neutral-400">=</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">GPU usable inside</div>
          </div>
          {metaphorTable([
            { term: "GPU-enabled base image", metaphor: "Software — outlets & control panel, built into the set" },
            { term: "GPU-aware container runtime", metaphor: "Hardware — opens a matching hole in the wall to the real GPU" },
            { term: "Host's physical GPU", metaphor: "The host's real power source, outside the set entirely" },
          ])}
        </div>
      ),
    },
    // -------------------- 3. Connecting Containers --------------------
    {
      section: "3. Connecting Containers",
      title: "Port Mapping: Reaching a Sealed-Off Container",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Port mapping</strong> is like installing a dedicated intercom through the wall
            of a sealed set. The set is otherwise soundproofed from the outside (its own network
            namespace). So without one, nobody outside can reach whatever is running inside.
          </p>
          <p>
            Port mapping connects a port on the host machine straight through to a port inside the
            container. That way, traffic from outside can reach the process listening there.
          </p>
        </div>
      ),
      visual: metaphorTable([
        { term: "Port mapping", metaphor: "A dedicated intercom installed through the wall" },
        { term: "Host port", metaphor: "The button on the outside of the wall" },
        { term: "Container port", metaphor: "The speaker inside, where the process is listening" },
      ]),
    },
    {
      section: "3. Connecting Containers",
      title: "Container Networks: Talking Between Containers",
      body: (
        <p>
          A <strong>network</strong> is like a private tin-can telephone line strung directly
          between two sets. There&rsquo;s no need to go through an intercom at all. Containers on
          the same
          Docker network can reach each other directly, by name. They do this without exposing a
          port to the
          outside world, the way port mapping does. That&rsquo;s how an app container and its
          database
          container usually talk to each other privately.
        </p>
      ),
      visual: metaphorTable([
        { term: "Docker network", metaphor: "A private tin-can telephone line between sets" },
      ]),
    },
    {
      section: "3. Connecting Containers",
      title: "Docker Compose: Starting Multiple Containers Together",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Docker Compose</strong> is like a single master plan for an entire theme park
            of sets. One file lists every set to print, every telephone line and intercom to wire
            between them, and every vault to connect. Then one command builds and starts all of
            it together.
          </p>
          <p>
            Real apps are rarely one container alone. An app container, a database container, and
            a cache container, for example, all need to start together. They&rsquo;re wired to
            each other the
            same way every time. Docker Compose describes that whole multi-container setup in one
            file. That&rsquo;s instead of starting each container by hand with matching flags
            every time.
          </p>
        </div>
      ),
      visual: metaphorTable([
        { term: "Docker Compose", metaphor: "A one-shot master plan for a whole theme park of sets" },
        { term: "docker-compose.yml", metaphor: "The written plan itself: every set, connection, and vault it needs" },
      ]),
    },
    // -------------------- 4. Sharing Images Safely --------------------
    {
      section: "4. Sharing Images Safely",
      title: "Registry: Where Images Live",
      body: (
        <p>
          A <strong>registry</strong> is like a shared 3D data website. A finished 3D data package
          gets uploaded (&ldquo;pushed&rdquo;) to it. It&rsquo;s later downloaded
          (&ldquo;pulled&rdquo;)
          by whoever needs to print it. This is how the exact same data package reaches a laptop, a
          test server, and a production server alike.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Finished 3D data package</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Registry</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Pulled &amp; printed</div>
          </div>
          {metaphorTable([
            { term: "Registry", metaphor: "A shared 3D data website" },
            { term: "Push", metaphor: "Upload a data package to the website" },
            { term: "Pull", metaphor: "Download a data package from the website, ready to print" },
          ])}
        </div>
      ),
    },
    {
      section: "4. Sharing Images Safely",
      title: "Secrets Don't Go in the Image",
      body: (
        <p>
          A <strong>secret</strong> (a password, an API key) is like a note. That note must never
          be
          carved into the permanent 3D data package. A password baked into the data package gets
          copied to every set ever printed from it. It also gets copied to everyone who can reach
          that data
          package. Secrets instead go on a{" "}
          <strong>today&rsquo;s operating instructions</strong> board. That board is posted on the
          wall only once
          a set is actually standing and running. It&rsquo;s never carved into the permanent data.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <StatCard label="Secrets and config" value="a board posted when the set opens, never carved into the data package" tone="warn" />
          {metaphorTable([
            { term: "Secrets / environment variables", metaphor: "A “today's operating instructions” board, posted on the wall" },
            { term: "Baking a value into the image", metaphor: "Carving it into the 3D data package — never done for secrets" },
          ])}
        </div>
      ),
    },
    {
      section: "4. Sharing Images Safely",
      title: "Try it yourself: what invalidates the build cache?",
      body: (
        <p>
          The <strong>build cache</strong> is like a recipe where each instruction is remembered.
          Rerunning it reuses the previous result, unless that instruction or anything above it
          changed. Put the steps that change least often (installing fixtures) before the ones that
          change most often (bringing in today&rsquo;s items). That way, a small item change
          doesn&rsquo;t force every fixture to be reinstalled.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm">
              <div className="font-medium text-red-800 mb-1">Slower: items brought in first</div>
              <div className="font-mono text-red-700">COPY . /app{"\n"}RUN pip install -r requirements.txt</div>
              <div className="text-red-700 mt-1">Any item change reinstalls every fixture.</div>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-sm">
              <div className="font-medium text-emerald-800 mb-1">Faster: fixtures installed first</div>
              <div className="font-mono text-emerald-700">RUN pip install -r requirements.txt{"\n"}COPY . /app</div>
              <div className="text-emerald-700 mt-1">An item change only re-brings-in the items.</div>
            </div>
          </div>
          {metaphorTable([
            { term: "Build cache", metaphor: "Remembering which recipe steps are already done" },
            { term: "Reordering Dockerfile instructions", metaphor: "Reordering the recipe: fixtures before today's items" },
          ])}
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap, still in terms of the printed-set comparison:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A Dockerfile (build instructions) produces an image (a finished 3D data package). Running that image produces a container (one printed set).</li>
            <li>A namespace is like the set&rsquo;s own exterior shell — the isolation itself, not a separate barrier behind the walls. Every deliberate exception (a volume mount, GPU access, port mapping) crosses it in one narrow, controlled place.</li>
            <li>Three things are baked into a data package: the walls (OS layer), fixtures (libraries and dependencies), and items (application code). Once printed and switched on, three more things appear that are never part of the data package. Those are the running process, a memory workbench, and a writable storage shelf on the set&rsquo;s own wall.</li>
            <li>Model weights are usually kept in a vault outside the set, connected through a hole in the wall. They&rsquo;re not printed into the set itself.</li>
            <li>Multi-stage builds remove the scaffolding used to build the set, leaving only the finished result. That&rsquo;s a separate concern from where weights live.</li>
            <li>Port mapping is like a dedicated intercom through the wall. A network is like a private line strung directly between sets. Docker Compose is like a master plan that builds and wires up a whole group of sets with one command.</li>
            <li>Secrets are posted on a board once a set opens, never carved into the data package itself.</li>
          </ul>
        </div>
      ),
      visual: metaphorTable([
        { term: "Dockerfile", metaphor: "Build instructions" },
        { term: "Image", metaphor: "Finished 3D data package" },
        { term: "Container", metaphor: "One printed set" },
        { term: "Namespace", metaphor: "The set's own exterior shell — the walls that seal it off" },
        { term: "OS layer", metaphor: "Walls and floor" },
        { term: "Libraries & dependencies", metaphor: "Fixtures in the walls" },
        { term: "Application code", metaphor: "Items brought in" },
        { term: "Running process", metaphor: "An automaton moving now — only once printed and switched on" },
        { term: "Memory", metaphor: "A workbench for laying out parts and data while it works" },
        { term: "Storage", metaphor: "A built-in shelf on the set's own wall — destroyed along with the set" },
        { term: "Model weights", metaphor: "A heavy item kept in a vault, connected through the wall" },
        { term: "Multi-stage build", metaphor: "Build in a workshop, remove the scaffolding" },
        { term: "GPU / CUDA", metaphor: "A specialized power line" },
        { term: "Port mapping", metaphor: "A dedicated intercom through the wall" },
        { term: "Docker network", metaphor: "A private tin-can telephone line between sets" },
        { term: "Docker Compose", metaphor: "A one-shot master plan for a whole theme park of sets" },
        { term: "Registry", metaphor: "A shared 3D data website" },
        { term: "Secrets", metaphor: "A \u201ctoday's operating instructions\u201d board, posted on the wall" },
        { term: "Build cache", metaphor: "Remembering which recipe steps are already done" },
      ]),
    },
    {
      section: "5. Wrap-up",
      title: "Closing: The Rest of This Unit",
      body: (
        <p>
          A printed set is only useful once something tests it. It also needs to decide
          it&rsquo;s good enough,
          and get it in front of users.{" "}
          <button type="button" className={chapterLinkBtn} onClick={() => onNavigateToChapter?.("pipeline")}>
            Continue to Pipeline &amp; Deployment →
          </button>
        </p>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => setStep((s) => Math.min(total - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-base text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} disabled={isLast} className={`${nextBtn} disabled:opacity-40`}>
            Next
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
        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
