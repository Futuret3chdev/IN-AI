import type { ReactNode } from "react";

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  const re = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] && match[3]) {
      parts.push(
        <a key={i++} href={match[3]} target="_blank" rel="noreferrer">
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      parts.push(<code key={i++}>{match[4]}</code>);
    } else if (match[5]) {
      parts.push(<strong key={i++}>{match[5]}</strong>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/);
  return (
    <div className="prose-adept text-[15px] leading-7">
      {blocks.map((block, i) => {
        if (i % 2 === 1) {
          const nl = block.indexOf("\n");
          const code = nl === -1 ? block : block.slice(nl + 1);
          return (
            <pre key={i}>
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        return block.split("\n").map((line, j) => {
          const key = `${i}-${j}`;
          if (!line.trim()) return <div key={key} className="h-2" />;
          if (line.startsWith("### "))
            return <h3 key={key}>{renderInline(line.slice(4))}</h3>;
          if (line.startsWith("## "))
            return <h2 key={key}>{renderInline(line.slice(3))}</h2>;
          if (line.startsWith("# "))
            return <h1 key={key}>{renderInline(line.slice(2))}</h1>;
          if (line.startsWith("- "))
            return <li key={key}>{renderInline(line.slice(2))}</li>;
          return <p key={key}>{renderInline(line)}</p>;
        });
      })}
    </div>
  );
}
