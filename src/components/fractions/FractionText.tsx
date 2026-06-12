import React from "react";

/**
 * Renders text containing fraction notation ("3/4", mixed "1 2/5", lists
 * "1/8, 1/4") with properly stacked numerators/denominators. Used everywhere
 * a question prompt, option or explanation is shown.
 */

function Stacked({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-0.5 leading-none" translate="no">
      <span className="text-[0.78em] font-bold">{num}</span>
      <span className="border-t-2 border-current w-full text-[0.78em] font-bold">{den}</span>
    </span>
  );
}

const FRACTION_RE = /(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)/g;

export default function FractionText({ text, className = "" }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(FRACTION_RE.source, "g");
  let k = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(
        <span key={k++} className="inline-flex items-center align-middle whitespace-nowrap">
          <span className="font-bold">{match[1]}</span>
          <Stacked num={match[2]} den={match[3]} />
        </span>
      );
    } else {
      parts.push(<Stacked key={k++} num={match[4]} den={match[5]} />);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span className={className}>{parts}</span>;
}
