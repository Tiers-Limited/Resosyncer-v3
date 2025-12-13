import { useState, useMemo } from 'react';
import { Card } from 'antd';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const countryCoordinates = {
  'United States of America': [-95, 37],
  'Canada': [-106, 56],
  'Mexico': [-102, 23],
  'Brazil': [-51, -14],
  'Argentina': [-63, -38],
  'Chile': [-71, -30],
  'Colombia': [-74, 4],
  'Peru': [-75, -9],
  'United Kingdom': [-3, 54],
  'Germany': [10, 51],
  'France': [2, 46],
  'Spain': [-3, 40],
  'Italy': [12, 41],
  'Netherlands': [5, 52],
  'Sweden': [18, 60],
  'Norway': [8, 60],
  'Poland': [19, 51],
  'Switzerland': [8, 46],
  'Austria': [14, 47],
  'Belgium': [4, 50],
  'Denmark': [9, 56],
  'Ireland': [-8, 53],
  'India': [78, 20],
  'China': [104, 35],
  'Japan': [138, 36],
  'Australia': [133, -27],
  'Pakistan': [69, 30],
  'United Arab Emirates': [53, 23],
  'Saudi Arabia': [45, 23],
  'South Africa': [22, -30],
  'Egypt': [30, 26],
  'Nigeria': [8, 9],
  'Russia': [105, 61],
  'Singapore': [103, 1],
  'Malaysia': [101, 4],
  'Indonesia': [113, -0.7],
  'Thailand': [100, 15],
  'Korea': [127, 37],
  'Turkey': [35, 38],
  'New Zealand': [174, -40],
};

const countryNameMap = {
  'United States': 'United States of America',
  'USA': 'United States of America',
  'UK': 'United Kingdom',
  'UAE': 'United Arab Emirates',
  'South Korea': 'Korea',
  'Russia': 'Russia',
};

const ClientWorldMap = ({ countries }) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const countryData = useMemo(() => {
    if (!countries || countries.length === 0) return {};

    const data = {};
    countries.forEach(country => {
      const normalizedName = countryNameMap[country.country] || country.country;
      data[normalizedName] = country.count;
    });
    return data;
  }, [countries]);

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(countryData), 1);
  }, [countryData]);

  const getCountryColor = (count) => {
    if (!count) return '#E5E7EB';
    const intensity = count / maxCount;

    if (intensity > 0.7) return '#1e3a8a';
    if (intensity > 0.5) return '#2563eb';
    if (intensity > 0.3) return '#3b82f6';
    if (intensity > 0.1) return '#60a5fa';
    return '#93c5fd';
  };

  const handleMouseEnter = (geo, clientCount, event) => {
    if (clientCount) {
      setTooltipContent(`${geo.properties.name}: ${clientCount} project${clientCount > 1 ? 's' : ''}`);
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event) => {
    if (tooltipContent) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent('');
  };

  return (
    <Card title="Client Distribution Map" className="h-full">
      <style>{`
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }
        .pulse-ring {
          animation: pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="w-full" style={{ background: '#f8fafc' }}>
        <ComposableMap
          projectionConfig={{
            scale: 147,
          }}
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup center={[0, 20]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const clientCount = countryData[countryName];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(clientCount)}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: 'none',
                        },
                        hover: {
                          fill: clientCount ? '#dc2626' : '#D1D5DB',
                          outline: 'none',
                          cursor: clientCount ? 'pointer' : 'default',
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, clientCount, event)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })
              }
            </Geographies>

            {Object.entries(countryData).map(([countryName, count]) => {
              const coords = countryCoordinates[countryName];
              if (!coords) return null;

              return (
                <Marker key={countryName} coordinates={coords}>
                  <g>
                    <circle
                      r={5}
                      fill="#ef4444"
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '0s',
                      }}
                    />
                    <circle
                      r={5}
                      fill="#ef4444"
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '0.5s',
                      }}
                    />
                    <circle
                      r={5}
                      fill="#ef4444"
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '1s',
                      }}
                    />
                    <circle
                      r={4}
                      fill="#dc2626"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                    <circle
                      r={2}
                      fill="#fca5a5"
                    />
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {tooltipContent && (
        <div
          className="fixed bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm z-50 pointer-events-none"
          style={{
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y + 10}px`,
          }}
        >
          {tooltipContent}
        </div>
      )}

      {Object.keys(countryData).length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700">Countries with Clients</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-[#93c5fd] border border-gray-300"></div>
                <div className="w-4 h-4 bg-[#60a5fa] border border-gray-300"></div>
                <div className="w-4 h-4 bg-[#3b82f6] border border-gray-300"></div>
                <div className="w-4 h-4 bg-[#2563eb] border border-gray-300"></div>
                <div className="w-4 h-4 bg-[#1e3a8a] border border-gray-300"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(countryData)
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div
                  key={country}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <span className="font-medium text-gray-700 text-sm">{country}</span>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getCountryColor(count) }}
                  >
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {Object.keys(countryData).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No client data available
        </div>
      )}
    </Card>
  );
};

export default ClientWorldMap;
