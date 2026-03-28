import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-foreground text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">About</h3>
            <p className="text-white/70 text-sm">
              Empowering Austin's climate action through data-driven clean energy insights
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://austinenergy.com/green-power/solar-solutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Austin Energy Programs
                </a>
              </li>
              <li>
                <a
                  href="https://austinenergy.com/rebates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Austin Energy Rebates
                </a>
              </li>
              <li>
                <a
                  href="https://austinenergy.com/green-power/solar-solutions/participating-solar-contractors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Installation Partners
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Data Sources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/data-sources')}
                  className="text-white/70 hover:text-white transition-colors text-left"
                >
                  Data Sources & Methodology
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/sitemap')}
                  className="text-white/70 hover:text-white transition-colors text-left"
                >
                  Sitemap
                </button>
              </li>
              <li>
                <a
                  href="https://data.austintexas.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  City of Austin Open Data
                </a>
              </li>
              <li>
                <a
                  href="https://data.austintexas.gov/Utilities-and-City-Services/Austin-Energy-Single-Family-Audits/tk9p-m8c7/about_data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Energy Audit Records
                </a>
              </li>
              <li>
                <a
                  href="https://data.austintexas.gov/resource/3syk-w9eu.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Solar Permit Data
                </a>
              </li>
              <li>
                <a
                  href="https://sunroof.withgoogle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Google Project Sunroof
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
