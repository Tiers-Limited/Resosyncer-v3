import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { getName, getCode, getNames } from "country-list";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const SEED_COORDS = {
  US: [-95.71, 37.09],
  GB: [-3.44, 55.38],
  CA: [-96.8, 60.2],
  AU: [133.77, -25.27],
  DE: [10.45, 51.17],
  FR: [2.21, 46.23],
  IN: [78.96, 20.59],
  CN: [104.19, 35.86],
  BR: [-51.93, -14.24],
  JP: [138.25, 36.2],
  MX: [-102.55, 23.63],
  IT: [12.57, 41.87],
  ES: [-3.75, 40.46],
  RU: [105.32, 61.52],
  KR: [127.77, 35.91],
  NL: [5.29, 52.13],
  SE: [18.64, 60.13],
  NO: [8.47, 60.47],
  CH: [8.23, 46.82],
  PK: [69.35, 30.38],
  AE: [53.85, 23.42],
  SA: [45.08, 23.89],
  ZA: [22.94, -30.56],
  EG: [30.8, 26.82],
  NG: [8.68, 9.08],
  SG: [103.82, 1.36],
  MY: [101.97, 4.21],
  ID: [113.92, -0.79],
  TH: [100.99, 15.87],
  TR: [35.24, 38.96],
  NZ: [174.89, -40.9],
  AR: [-63.62, -38.42],
  CL: [-71.54, -35.67],
  CO: [-74.3, 4.57],
  PE: [-75.02, -9.19],
  PL: [19.15, 51.92],
  AT: [14.55, 47.52],
  BE: [4.47, 50.5],
  DK: [9.5, 56.26],
  IE: [-8.24, 53.41],
};

/* â”€â”€â”€ Flag image component using flagcdn.com (works on all OS incl. Windows) */
const FlagImg = ({ code, size = 20 }) => {
  if (!code || code.length !== 2) {
    return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>ðŸŒ</span>;
  }
  const lower = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${lower}.png`}
      srcSet={`https://flagcdn.com/w80/${lower}.png 2x`}
      alt={code}
      width={size * 1.4}
      height={size}
      style={{
        borderRadius: 3,
        objectFit: "cover",
        display: "inline-block",
        flexShrink: 0,
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
};

/* â”€â”€â”€ Normalise any country string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const normaliseCountry = (() => {
  const allNames = getNames();
  const index = {};
  allNames.forEach((name) => {
    index[name.toLowerCase()] = { code: getCode(name), name };
  });

  const ALIASES = {
    usa: "US",
    "united states": "US",
    "u.s.a": "US",
    "u.s": "US",
    uk: "GB",
    "great britain": "GB",
    england: "GB",
    uae: "AE",
    emirates: "AE",
    "south korea": "KR",
    dprk: "KP",
    "north korea": "KP",
    russia: "RU",
    "czech republic": "CZ",
    czechia: "CZ",
    taiwan: "TW",
    "hong kong": "HK",
    macau: "MO",
    iran: "IR",
    syria: "SY",
    vietnam: "VN",
    bolivia: "BO",
    venezuela: "VE",
    ecuador: "EC",
    "ivory coast": "CI",
    "cote d'ivoire": "CI",
    tanzania: "TZ",
    kenya: "KE",
    ethiopia: "ET",
    ghana: "GH",
    morocco: "MA",
    algeria: "DZ",
    myanmar: "MM",
    burma: "MM",
    cambodia: "KH",
    laos: "LA",
    nepal: "NP",
    bangladesh: "BD",
    "sri lanka": "LK",
    afghanistan: "AF",
    iraq: "IQ",
    jordan: "JO",
    lebanon: "LB",
    israel: "IL",
    kuwait: "KW",
    qatar: "QA",
    bahrain: "BH",
    oman: "OM",
    yemen: "YE",
  };

  return (raw) => {
    if (!raw || typeof raw !== "string") return null;
    const key = raw.trim().toLowerCase();
    if (index[key]) return index[key];
    if (ALIASES[key]) {
      const code = ALIASES[key];
      const name = getName(code);
      return name ? { code, name } : null;
    }
    const partial = Object.keys(index).find(
      (k) => k.startsWith(key) || key.startsWith(k),
    );
    if (partial) return index[partial];
    return null;
  };
})();

const geoNameToCode = (geoName) => {
  const r = normaliseCountry(geoName);
  return r?.code ?? null;
};

const ClientWorldMap = ({ countries }) => {
  const [tooltip, setTooltip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [coordCache, setCoordCache] = useState({ ...SEED_COORDS });

  const dark = (() => {
    try {
      const root = document.documentElement;
      const mode = localStorage.getItem("themeMode") || "light";
      if (mode === "dark") return true;
      if (mode === "light") return false;
      const bg = getComputedStyle(root)
        .getPropertyValue("--d-bg")
        .trim();
      if (bg) return bg === "#141416" || bg.includes("20, 20, 22");
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  })();

  /* Build { isoCode â†’ count } */
  const countryData = useMemo(() => {
    if (!countries?.length) return {};
    const map = {};
    countries.forEach(({ country, count }) => {
      const r = normaliseCountry(country);
      if (r?.code) map[r.code] = (map[r.code] || 0) + count;
    });
    return map;
  }, [countries]);

  /* Build display list */
  const displayList = useMemo(() => {
    return Object.entries(countryData)
      .map(([code, count]) => ({
        code,
        name: getName(code) || code,
        count,
        coords: coordCache[code] || null,
      }))
      .sort((a, b) => b.count - a.count);
  }, [countryData, coordCache]);

  const maxCount = useMemo(
    () => Math.max(...Object.values(countryData), 1),
    [countryData],
  );

  /* Fetch missing coordinates */
  useMemo(() => {
    const missing = Object.keys(countryData).filter(
      (code) => !coordCache[code],
    );
    if (!missing.length) return;
    fetch(
      `https://restcountries.com/v3.1/alpha?codes=${missing.join(",")}&fields=cca2,latlng`,
    )
      .then((r) => r.json())
      .then((data) => {
        const newCoords = {};
        data.forEach((c) => {
          if (c.cca2 && c.latlng?.length === 2) {
            newCoords[c.cca2] = [c.latlng[1], c.latlng[0]];
          }
        });
        if (Object.keys(newCoords).length) {
          setCoordCache((prev) => ({ ...prev, ...newCoords }));
        }
      })
      .catch(() => {});
  }, [countryData]);

  /* Color scale */
  const getColor = (code) => {
    const count = countryData[code];
    if (!count) return dark ? "#202127" : "#e8ecf4";
    const t = count / maxCount;
    if (dark) {
      if (t > 0.75) return "#60a5fa";
      if (t > 0.5) return "#3b82f6";
      if (t > 0.25) return "#2563eb";
      return "#1d4ed8";
    } else {
      if (t > 0.75) return "#1d4ed8";
      if (t > 0.5) return "#2563eb";
      if (t > 0.25) return "#3b82f6";
      return "#93c5fd";
    }
  };

  const accentColor = dark ? "#93c5fd" : "#3b82f6";
  const markerColor = dark ? "#f59e0b" : "#ef4444";
  const strokeColor = dark ? "#2a2b31" : "#ffffff";
  const hoverEmpty = dark ? "#2a2b31" : "#d1d5db";

  const total = displayList.reduce((s, c) => s + c.count, 0);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* â”€â”€ Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: dark ? "#17181c" : "#f0f4f8",
          border: "1px solid var(--d-border)",
          position: "relative",
        }}
      >
        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[
            // { label: "+", action: () => setZoom((z) => Math.min(z * 1.5, 8)) },
            // { label: "âˆ’", action: () => setZoom((z) => Math.max(z / 1.5, 1)) },
            // { label: "âŒ‚", action: () => setZoom(1) },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: dark ? "#202127" : "#ffffff",
                border: "1px solid var(--d-border)",
                color: "var(--d-sub)",
                fontSize: label === "âŒ‚" ? 13 : 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = accentColor + "22")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = dark
                  ? "#202127"
                  : "#ffffff")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <ComposableMap
          projectionConfig={{ scale: 147, center: [0, 20] }}
          width={800}
          height={380}
          zoom={zoom}
          center={[0, 20]}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const code = geoNameToCode(geo.properties.name);
                  const count = code ? countryData[code] : 0;
                  const fill = getColor(code);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: count ? accentColor + "cc" : hoverEmpty,
                          outline: "none",
                          cursor: count ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => {
                        if (!count) return;
                        setTooltip({
                          code,
                          name: geo.properties.name,
                          count,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        if (tooltip)
                          setTooltip((t) => ({
                            ...t,
                            x: e.clientX,
                            y: e.clientY,
                          }));
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>

            {/* Pulse markers */}
            {displayList
              .filter((c) => c.coords)
              .map(({ code, name, count, coords }) => (
                <Marker key={code} coordinates={coords}>
                  <g>
                    {[0, 0.6, 1.2].map((delay) => (
                      <circle
                        key={delay}
                        r={6}
                        fill={markerColor}
                        opacity={0}
                        style={{
                          animation: `mapPulse 2s ${delay}s ease-out infinite`,
                        }}
                      />
                    ))}
                    <circle
                      r={4}
                      fill={markerColor}
                      stroke={strokeColor}
                      strokeWidth={1}
                    />
                    <circle r={2} fill="#fff" opacity={0.8} />
                  </g>
                </Marker>
              ))}
        </ComposableMap>

        <style>{`
          @keyframes mapPulse {
            0%   { r: 4;  opacity: 0.6; }
            100% { r: 14; opacity: 0; }
          }
        `}</style>
      </div>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: dark ? "#1a1b1f" : "#0f172a",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FlagImg code={tooltip.code} size={16} />
          <span>
            {tooltip.name}: {tooltip.count} project
            {tooltip.count > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {displayList.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {/* Legend + summary row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--d-text)",
                }}
              >
                {displayList.length}{" "}
                {displayList.length === 1 ? "country" : "countries"}
              </span>
              <span style={{ fontSize: 12, color: "var(--d-muted)" }}>
                 {total} project{total !== 1 ? "s" : ""} total
              </span>
            </div>

            {/* Color legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--d-muted)",
              }}
            >
              <span>Few</span>
              <div style={{ display: "flex", gap: 2 }}>
                {(dark
                  ? ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6"]
                  : ["#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8"]
                ).map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: c,
                      border: "1px solid var(--d-border)",
                    }}
                  />
                ))}
              </div>
              <span>Many</span>
            </div>
          </div>

          {/* Country grid â€” flag replaces the ISO code badge */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 8,
            }}
          >
            {displayList.map(({ code, name, count }, i) => {
              const bar = Math.round((count / maxCount) * 100);
              return (
                <div
                  key={code}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--d-card2)",
                    border: "1px solid var(--d-border)",
                    transition: "border-color 0.15s",
                    animationDelay: `${i * 30}ms`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = accentColor + "60")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--d-border)")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <FlagImg code={code} size={18} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--d-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 100,
                        }}
                      >
                        {name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: getColor(code),
                      }}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div
                    style={{
                      height: 3,
                      borderRadius: 2,
                      background: dark ? "#202127" : "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${bar}%`,
                        background: getColor(code),
                        borderRadius: 2,
                        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {displayList.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "var(--d-muted)",
            fontSize: 13,
          }}
        >
          No client location data available
        </div>
      )}
    </div>
  );
};

export default ClientWorldMap;

