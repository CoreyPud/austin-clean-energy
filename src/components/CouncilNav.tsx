import { NavLink } from "react-router-dom";

const PAGES = [
  { to: "/council",           label: "Overview" },
  { to: "/council-members",   label: "Campaign Contribution" },
  { to: "/council-decisions", label: "Decisions" },
  { to: "/council-vote",      label: "Vote" },
];

// Cross-links to the other council accountability pages -- plain text, not a tab bar, since
// these are meant to read as separate pages, not tabs of one page.
export default function CouncilNav() {
  return (
    <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {PAGES.map((p, i) => (
        <span key={p.to} className="flex items-center gap-3">
          {i > 0 && <span className="text-muted-foreground/50">·</span>}
          <NavLink
            to={p.to}
            end
            className={({ isActive }) =>
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {p.label}
          </NavLink>
        </span>
      ))}
    </nav>
  );
}
