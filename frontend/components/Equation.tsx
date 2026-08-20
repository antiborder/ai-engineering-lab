import katex from "katex";

/** Renders a LaTeX string via KaTeX. No "use client" needed — rendering is
 * pure and deterministic (same string always produces the same HTML), so
 * it's safe as a server component and safe to hydrate. */
export function Equation({ tex, display = true }: { tex: string; display?: boolean }) {
  if (process.env.NODE_ENV !== "production" && /\\\\[a-zA-Z]/.test(tex)) {
    // Almost always means `tex="\\eta"` was written as a plain JSX string
    // attribute instead of `tex={"\\eta"}` — JSX doesn't process escape
    // sequences outside `{}`, so it becomes a literal double backslash,
    // which KaTeX then renders as a line break followed by inert text
    // instead of the intended symbol. Bit us twice before this guard existed.
    console.warn(
      `Equation: tex="${tex}" contains a literal "\\\\" before a letter — ` +
        `did you mean to write tex={"..."} instead of a plain string attribute?`
    );
  }
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
  });
  return (
    <span
      className={display ? "block overflow-x-auto py-1" : "inline-block"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
