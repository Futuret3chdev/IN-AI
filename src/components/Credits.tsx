export function Credits({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-5 text-muted ${className}`}>
      Part of the <span className="text-brass">$MT ECO SYSTEM</span>
      <br />
      Developed by Futuret3ch, T3x and MemeTorrent
    </p>
  );
}
