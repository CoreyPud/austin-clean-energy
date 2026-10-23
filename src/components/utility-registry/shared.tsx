import { NavLink, Link } from "react-router-dom";
import { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";
import "./utility-registry.css";

export const BASE = "/us-utility-innovation-registry";

const NAV = [
  { to: BASE, label: "Registry", end: true },
  { to: `${BASE}/states`, label: "State profiles" },
  { to: `${BASE}/solar`, label: "Solar adoption" },
  { to: `${BASE}/efficiency`, label: "Efficiency and funding" },
  { to: `${BASE}/about`, label: "About" },
];

export const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-secondary">
    {children}
  </a>
);

export const statusClass = (s: string) => "uir-pill uir-s-" + s.toLowerCase().replace(/[^a-z]+/g, "-");

export const ConfDot = ({ c }: { c: string }) => (
  <span className="inline-flex items-center gap-1 uir-mono text-xs text-muted-foreground" title={`${c} confidence`}>
    <span className={`uir-dot uir-c-${c.toLowerCase()}`} aria-hidden />
    {c}
  </span>
);

export const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10 rounded-xl border bg-muted/40 p-5">
    <h2 className="text-lg font-bold mb-2">{title}</h2>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </section>
);

export const RegistryShell = ({ title, subtitle, seoDesc, children }: { title: string; subtitle: string; seoDesc: string; children: ReactNode }) => {
  useSeo({ title: `${title} | US Utility Innovation Registry`, description: seoDesc });
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={title} subtitle={subtitle} backTo="/austin-at-a-glance" backLabel="Back to Austin at a Glance" contentClassName="max-w-[1120px] mx-auto px-4" />
      <div className="max-w-[1120px] mx-auto px-4">
        <nav aria-label="Registry sections" className="flex gap-2 overflow-x-auto py-4 border-b">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${isActive ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/50"}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          Seed data compiled Oct 20, 2026. Many figures come from trade press and commercial guides. Verify before relying on them. Send corrections through the <Link to="/contact" className="underline">contact page</Link>.
        </p>
        <div className="py-6 pb-16">{children}</div>
      </div>
    </div>
  );
};

export const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
    className="h-10 w-full sm:w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
);

export const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | [string, string])[] }) => (
  <label className="flex flex-col gap-1">
    <span className="uir-label">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
    </select>
  </label>
);
