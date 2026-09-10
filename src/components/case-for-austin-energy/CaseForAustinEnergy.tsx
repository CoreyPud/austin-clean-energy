import "./case-for-austin-energy.css";
import {
  PRICE_ROWS,
  RELIABILITY_ROWS,
  MIX_ROWS,
  MONEY_TILES,
  STANCE_CARDS,
  SOURCES,
  type BarRow,
} from "./case-for-austin-energy-data";

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function BarChart({ rows }: { rows: BarRow[] }) {
  return (
    <div className="cae-chartbox">
      {rows.map((r) => (
        <div className="cae-bar-row" key={r.label}>
          <div className="cae-bar-label">
            {r.label}
            <small>{r.sub}</small>
          </div>
          <div className="cae-bar-track">
            <div
              className={`cae-bar-fill cae-${r.color}`}
              style={{ width: `${r.pct}%` }}
            />
          </div>
          <div className="cae-bar-val">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: "muni" | "dereg" }[] }) {
  return (
    <div className="cae-legend">
      {items.map((it) => (
        <span key={it.label}>
          <span className={`cae-swatch cae-${it.color}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function MixStack() {
  return (
    <>
      {MIX_ROWS.map((row) => (
        <div className="cae-mixrow" key={row.title}>
          <div className="cae-mlabel">
            <b>{row.title}</b> &mdash; {row.sourceNote}
            <span>{row.badge}</span>
          </div>
          <div className="cae-stack">
            {row.segments.map((seg) => (
              <div
                key={seg.label}
                className={`cae-seg cae-${seg.color}`}
                style={{ width: `${seg.pct}%` }}
              >
                {seg.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CaseForAustinEnergy({ className = "" }: { className?: string }) {
  return (
    <div className={`case-for-austin-energy ${className}`}>
      <div className="cae-page">
        <div className="cae-kicker">Secret Vote &middot; Explainer</div>
        <h1>The Case for Austin Energy</h1>
        <p className="cae-dek">
          Gov. Greg Abbott wants to end Austin Energy&rsquo;s status as the city&rsquo;s only power provider and
          open Austin to the same competitive retail market Houston and Dallas already have. He says it would
          cut bills more than 10%. Here&rsquo;s what the actual price, reliability, and emissions data say
          &mdash; and what Austin stands to lose.
        </p>

        <div className="cae-status">
          <span className="cae-dot" />
          <p>
            <strong>NOT LAW YET</strong> &mdash; Abbott announced this as a legislative push in August 2026; it
            would require the Texas Legislature to act. Austin Energy and CPS Energy (San Antonio) remain
            municipally owned monopolies today. This page compares how that model is actually performing
            against the deregulated market Abbott wants to move Austin into.
          </p>
        </div>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">01</span>
            <h2>What Abbott is proposing</h2>
          </div>
          <p className="cae-intro">
            In August 2026, Abbott announced a plan to dismantle the municipal-utility model in Texas cities
            that still run their own power company &mdash; Austin Energy and CPS Energy in San Antonio are the
            two big ones. Instead of one city-owned utility that both delivers and effectively sells power,
            Austin would move to the same <b>retail-choice market</b> that Houston and Dallas already use: a
            regulated wires company (like Oncor or CenterPoint) delivers the electricity, and residents shop
            among competing retail brands for a plan. Abbott&rsquo;s team says this competition would save
            customers <b>more than 10%</b> on their bills, with even bigger savings for small businesses. It
            would take an act of the Texas Legislature to force the change &mdash; it is not something
            Austin&rsquo;s own city council could block on its own, and it is not current law.
          </p>
        </section>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">02</span>
            <h2>Do Austinites actually pay more?</h2>
          </div>
          <p className="cae-intro">
            No &mdash; on the numbers available right now, Austin Energy customers pay <b>less</b> than the
            typical Texas bill, not more. Sierra Club&rsquo;s Cyrus Reed put it plainly to reporters:
            &ldquo;the average bills in Austin Energy are actually the lowest in ERCOT.&rdquo; The Austin
            Chronicle reports Austin Energy bills run roughly <b>$60 a month below the statewide average</b>.
          </p>
          <Legend
            items={[
              { label: "Austin Energy (muni)", color: "muni" },
              { label: "Deregulated market", color: "dereg" },
            ]}
          />
          <BarChart rows={PRICE_ROWS} />
          <p className="cae-fine">
            Deregulated markets do advertise cheaper <em>teaser</em> plans &mdash; as low as 6.7&ndash;7.2&cent;/kWh
            in Dallas and Houston &mdash; but Public Citizen&rsquo;s Kaiba White has pointed out those
            introductory rates tend to climb once the promotional period ends, so keeping ahead of a muni rate
            means constantly watching the market and switching plans, something few households actually keep
            up with. The averages above reflect what customers actually pay across the plans on offer, not the
            lowest advertised rate. Nationally, the American Public Power Association finds municipal-utility
            customers pay about <b>14% less</b> than customers of other utility types &mdash; $100&ndash;$320
            less per year on average.
          </p>
        </section>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">03</span>
            <h2>Is the muni model less reliable?</h2>
          </div>
          <p className="cae-intro">
            The opposite, at least nationally. Sierra Club&rsquo;s Reed also warned that letting individual
            customers opt out could undermine the system-wide reliability investments munis make on
            everyone&rsquo;s behalf, since that spending benefits the whole local grid, not just the customers
            who stay. EIA data compiled by the American Public Power Association across 2013&ndash;2023 backs
            that up: publicly owned utilities post shorter and less frequent outages than investor-owned
            utilities, the kind that dominate deregulated markets.
          </p>
          <Legend
            items={[
              { label: "Public power (like Austin Energy)", color: "muni" },
              { label: "Investor-owned utility", color: "dereg" },
            ]}
          />
          <BarChart rows={RELIABILITY_ROWS} />
          <p className="cae-fine" style={{ marginTop: 12 }}>
            Public power utilities were also the <b>only</b> ownership type to consistently average fewer than
            one outage per customer per year (0.845), and during major events like storms, public power
            customers were back on in roughly 2.5 hours &mdash; about 3 hours faster than investor-owned
            utility customers. Source: EIA data via the American Public Power Association, published March
            2025. This is a national comparison across ownership types, not an Austin-specific measurement
            &mdash; but it&rsquo;s the same structural distinction Abbott&rsquo;s plan would move Austin across.
          </p>
        </section>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">04</span>
            <h2>What about the air?</h2>
          </div>
          <p className="cae-intro">
            Austin Energy&rsquo;s own numbers, presented to the city&rsquo;s Electric Utility Commission in May
            2026, show <b>73% carbon-free</b> generation for the quarter &mdash; 46% renewable (wind, solar,
            biomass) plus 27% nuclear. That&rsquo;s well above the statewide ERCOT mix, which leaned on natural
            gas for 43% of generation over the first nine months of 2025, with wind and solar together
            supplying 36%.
          </p>
          <MixStack />
          <p className="cae-fine">
            These two figures aren&rsquo;t measured quite the same way &mdash; Austin&rsquo;s is one
            utility&rsquo;s own reported generation mix for a single quarter, ERCOT&rsquo;s is the whole
            grid&rsquo;s fuel mix averaged over three quarters, and the statewide &ldquo;other&rdquo; category
            bundles nuclear with hydro, biomass, and battery discharge, so the true statewide carbon-free share
            is somewhere below that 57% ceiling. Even accounting for that, Austin Energy&rsquo;s own portfolio
            is running meaningfully cleaner than the state as a whole &mdash; and Austin Energy staff have
            argued the new gas peakers themselves would free up money currently spent on grid congestion to
            invest in more renewables, since peakers &ldquo;don&rsquo;t displace renewables,&rdquo; per staff
            comments at that same May 2026 meeting.
          </p>
        </section>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">05</span>
            <h2>The money question</h2>
          </div>
          <p className="cae-intro">
            Austin Energy isn&rsquo;t just a power company &mdash; it&rsquo;s a major line item in the city
            budget. Breaking it up doesn&rsquo;t just change your electric bill; it changes what the city can
            afford.
          </p>
          <div className="cae-tiles">
            {MONEY_TILES.map((t) => (
              <div className="cae-tile" key={t.label}>
                <div className="cae-tl">{t.label}</div>
                <div className="cae-tv">{t.value}</div>
                <div className="cae-ts">{t.sub}</div>
              </div>
            ))}
          </div>
          <p className="cae-fine" style={{ marginTop: 16 }}>
            San Antonio&rsquo;s CPS Energy, facing the same proposal, budgeted <b>$559.7 million</b> in
            transfers to that city for fiscal year 2027. Mayor Kirk Watson has described the transition as a
            technically difficult process that would take years and end up costing customers well over a
            billion dollars in its own right. Former Austin Energy general manager Roger Duncan argues the real
            winners of deregulation would be large industrial customers, not residents. And Austin&rsquo;s 2035
            climate plan is built around Austin Energy&rsquo;s own resource planning &mdash; breaking up the
            utility puts that plan&rsquo;s authority in question too.
          </p>
        </section>

        <section>
          <div className="cae-shead">
            <span className="cae-snum">06</span>
            <h2>Where things stand</h2>
          </div>
          <div className="cae-quotegrid">
            {STANCE_CARDS.map((c) => (
              <div className="cae-qcard" key={c.cite}>
                <p>{c.text}</p>
                <cite>{c.cite}</cite>
              </div>
            ))}
          </div>
        </section>

        <footer className="cae-sources">
          <h3>Sources</h3>
          <ul>
            {SOURCES.map((s) => (
              <li key={s.title}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
          <p className="cae-tag">
            Secret Vote documentary project &middot; explainer, not a Secret Vote scene &middot; last checked
            September 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
