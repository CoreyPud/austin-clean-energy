import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/council-climate-record", label: "Climate record" },
  { to: "/council-members",        label: "Who funds council" },
  { to: "/council-lobbying",       label: "Who lobbies" },
];

// Shared sub-nav across the council accountability pages.
export default function CouncilNav() {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            `px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
