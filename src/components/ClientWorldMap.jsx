import { useState, useMemo } from 'react';
import { Card, theme } from 'antd';
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
  
  // Get theme token from Ant Design
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgContainer === '#1f2937' || token.colorBgLayout === '#111827';

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
    if (!count) return isDarkMode ? '#374151' : '#E5E7EB';
    const intensity = count / maxCount;

    if (isDarkMode) {
      // Dark mode colors - lighter shades
      if (intensity > 0.7) return '#60a5fa';
      if (intensity > 0.5) return '#3b82f6';
      if (intensity > 0.3) return '#2563eb';
      if (intensity > 0.1) return '#1e40af';
      return '#1e3a8a';
    } else {
      // Light mode colors - darker shades
      if (intensity > 0.7) return '#1e3a8a';
      if (intensity > 0.5) return '#2563eb';
      if (intensity > 0.3) return '#3b82f6';
      if (intensity > 0.1) return '#60a5fa';
      return '#93c5fd';
    }
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

  const themeColors = {
    mapBackground: isDarkMode ? '#1f2937' : '#f8fafc',
    countryStroke: isDarkMode ? '#4b5563' : '#FFFFFF',
    hoverFill: isDarkMode ? '#f59e0b' : '#dc2626',
    hoverDefault: isDarkMode ? '#4b5563' : '#D1D5DB',
    markerFill: isDarkMode ? '#f59e0b' : '#ef4444',
    markerCore: isDarkMode ? '#f97316' : '#dc2626',
    markerCenter: isDarkMode ? '#fed7aa' : '#fca5a5',
    markerStroke: isDarkMode ? '#1f2937' : '#ffffff',
    legendText: isDarkMode ? '#d1d5db' : '#374151',
    legendBorder: isDarkMode ? '#4b5563' : '#d1d5db',
    cardBg: isDarkMode ? '#374151' : '#f9fafb',
    cardBorder: isDarkMode ? '#4b5563' : '#e5e7eb',
    cardHoverBorder: isDarkMode ? '#60a5fa' : '#93c5fd',
    tooltipBg: isDarkMode ? '#1f2937' : '#111827',
    tooltipText: isDarkMode ? '#f9fafb' : '#ffffff',
    emptyText: isDarkMode ? '#9ca3af' : '#6b7280',
  };

  return (
    <Card 
      title="Client Distribution Map" 
      className="h-full"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorder,
      }}
    >
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
      <div className="w-full" style={{ background: themeColors.mapBackground, borderRadius: '8px', padding: '16px' }}>
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
                      stroke={themeColors.countryStroke}
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: 'none',
                        },
                        hover: {
                          fill: clientCount ? themeColors.hoverFill : themeColors.hoverDefault,
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
                      fill={themeColors.markerFill}
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '0s',
                      }}
                    />
                    <circle
                      r={5}
                      fill={themeColors.markerFill}
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '0.5s',
                      }}
                    />
                    <circle
                      r={5}
                      fill={themeColors.markerFill}
                      opacity={0.3}
                      className="pulse-ring"
                      style={{
                        animationDelay: '1s',
                      }}
                    />
                    <circle
                      r={4}
                      fill={themeColors.markerCore}
                      stroke={themeColors.markerStroke}
                      strokeWidth={1}
                    />
                    <circle
                      r={2}
                      fill={themeColors.markerCenter}
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
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y + 10}px`,
            background: themeColors.tooltipBg,
            color: themeColors.tooltipText,
            padding: '8px 12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            zIndex: 50,
            pointerEvents: 'none',
            border: `1px solid ${token.colorBorder}`,
          }}
        >
          {tooltipContent}
        </div>
      )}

      {Object.keys(countryData).length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px' 
          }}>
            <h4 style={{ 
              fontWeight: '600', 
              color: token.colorText,
              margin: 0,
            }}>
              Countries with Clients
            </h4>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '12px', 
              color: token.colorTextSecondary 
            }}>
              <span>Less</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {isDarkMode ? (
                  <>
                    <div style={{ width: '16px', height: '16px', background: '#1e3a8a', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#1e40af', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#2563eb', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#3b82f6', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#60a5fa', border: `1px solid ${themeColors.legendBorder}` }}></div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '16px', height: '16px', background: '#93c5fd', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#60a5fa', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#3b82f6', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#2563eb', border: `1px solid ${themeColors.legendBorder}` }}></div>
                    <div style={{ width: '16px', height: '16px', background: '#1e3a8a', border: `1px solid ${themeColors.legendBorder}` }}></div>
                  </>
                )}
              </div>
              <span>More</span>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px' 
          }}>
            {Object.entries(countryData)
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div
                  key={country}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: themeColors.cardBg,
                    borderRadius: '8px',
                    border: `1px solid ${themeColors.cardBorder}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeColors.cardHoverBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = themeColors.cardBorder;
                  }}
                >
                  <span style={{ 
                    fontWeight: '500', 
                    color: token.colorText,
                    fontSize: '14px' 
                  }}>
                    {country}
                  </span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffffff',
                      backgroundColor: getCountryColor(count),
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {Object.keys(countryData).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: themeColors.emptyText,
          padding: '32px 0' 
        }}>
          No client data available
        </div>
      )}
    </Card>
  );
};

export default ClientWorldMap;