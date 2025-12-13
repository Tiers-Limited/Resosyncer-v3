import { Popover } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import * as flags from 'country-flag-icons/react/3x2';

const regularIcons = [
  { emoji: '👤', category: 'people', name: 'Person' },
  { emoji: '😊', category: 'people', name: 'Smile' },
  { emoji: '👍', category: 'people', name: 'Thumbs Up' },
  { emoji: '📊', category: 'business', name: 'Chart' },
  { emoji: '💼', category: 'business', name: 'Briefcase' },
  { emoji: '🏢', category: 'business', name: 'Building' },
  { emoji: '🏭', category: 'business', name: 'Factory' },
  { emoji: '🏬', category: 'business', name: 'Store' },
  { emoji: '🏪', category: 'business', name: 'Shop' },
  { emoji: '💻', category: 'tech', name: 'Laptop' },
  { emoji: '🖥️', category: 'tech', name: 'Desktop' },
  { emoji: '📱', category: 'tech', name: 'Phone' },
  { emoji: '⌨️', category: 'tech', name: 'Keyboard' },
  { emoji: '🖱️', category: 'tech', name: 'Mouse' },
  { emoji: '🖨️', category: 'tech', name: 'Printer' },
  { emoji: '📈', category: 'business', name: 'Growth' },
  { emoji: '📉', category: 'business', name: 'Decline' },
  { emoji: '💰', category: 'business', name: 'Money Bag' },
  { emoji: '💵', category: 'business', name: 'Dollar' },
  { emoji: '🌍', category: 'world', name: 'Globe' },
  { emoji: '🌎', category: 'world', name: 'Americas' },
  { emoji: '🌏', category: 'world', name: 'Asia' },
  { emoji: '🏠', category: 'places', name: 'House' },
  { emoji: '🎯', category: 'symbols', name: 'Target' },
  { emoji: '🎨', category: 'creative', name: 'Art' },
  { emoji: '📷', category: 'creative', name: 'Camera' },
  { emoji: '🎬', category: 'creative', name: 'Movie' },
  { emoji: '🎭', category: 'creative', name: 'Theater' },
  { emoji: '📝', category: 'office', name: 'Note' },
  { emoji: '📄', category: 'office', name: 'Document' },
  { emoji: '📁', category: 'office', name: 'Folder' },
  { emoji: '📂', category: 'office', name: 'Open Folder' },
  { emoji: '🔔', category: 'symbols', name: 'Bell' },
  { emoji: '🎁', category: 'celebration', name: 'Gift' },
  { emoji: '🎉', category: 'celebration', name: 'Party' },
  { emoji: '💡', category: 'symbols', name: 'Bulb' },
  { emoji: '⭐', category: 'symbols', name: 'Star' },
  { emoji: '🌟', category: 'symbols', name: 'Glowing Star' },
  { emoji: '🔥', category: 'symbols', name: 'Fire' },
  { emoji: '✨', category: 'symbols', name: 'Sparkles' },
  { emoji: '🚀', category: 'travel', name: 'Rocket' },
  { emoji: '✈️', category: 'travel', name: 'Airplane' },
  { emoji: '🎓', category: 'education', name: 'Graduate' },
  { emoji: '🏆', category: 'symbols', name: 'Trophy' },
  { emoji: '🎪', category: 'entertainment', name: 'Circus' },
];

const countryFlags = [
  { code: 'AF', name: 'Afghanistan', FlagComponent: flags.AF },
  { code: 'AL', name: 'Albania', FlagComponent: flags.AL },
  { code: 'DZ', name: 'Algeria', FlagComponent: flags.DZ },
  { code: 'AD', name: 'Andorra', FlagComponent: flags.AD },
  { code: 'AO', name: 'Angola', FlagComponent: flags.AO },
  { code: 'AG', name: 'Antigua and Barbuda', FlagComponent: flags.AG },
  { code: 'AR', name: 'Argentina', FlagComponent: flags.AR },
  { code: 'AM', name: 'Armenia', FlagComponent: flags.AM },
  { code: 'AU', name: 'Australia', FlagComponent: flags.AU },
  { code: 'AT', name: 'Austria', FlagComponent: flags.AT },
  { code: 'AZ', name: 'Azerbaijan', FlagComponent: flags.AZ },
  { code: 'BS', name: 'Bahamas', FlagComponent: flags.BS },
  { code: 'BH', name: 'Bahrain', FlagComponent: flags.BH },
  { code: 'BD', name: 'Bangladesh', FlagComponent: flags.BD },
  { code: 'BB', name: 'Barbados', FlagComponent: flags.BB },
  { code: 'BY', name: 'Belarus', FlagComponent: flags.BY },
  { code: 'BE', name: 'Belgium', FlagComponent: flags.BE },
  { code: 'BZ', name: 'Belize', FlagComponent: flags.BZ },
  { code: 'BJ', name: 'Benin', FlagComponent: flags.BJ },
  { code: 'BT', name: 'Bhutan', FlagComponent: flags.BT },
  { code: 'BO', name: 'Bolivia', FlagComponent: flags.BO },
  { code: 'BA', name: 'Bosnia and Herzegovina', FlagComponent: flags.BA },
  { code: 'BW', name: 'Botswana', FlagComponent: flags.BW },
  { code: 'BR', name: 'Brazil', FlagComponent: flags.BR },
  { code: 'BN', name: 'Brunei', FlagComponent: flags.BN },
  { code: 'BG', name: 'Bulgaria', FlagComponent: flags.BG },
  { code: 'BF', name: 'Burkina Faso', FlagComponent: flags.BF },
  { code: 'BI', name: 'Burundi', FlagComponent: flags.BI },
  { code: 'KH', name: 'Cambodia', FlagComponent: flags.KH },
  { code: 'CM', name: 'Cameroon', FlagComponent: flags.CM },
  { code: 'CA', name: 'Canada', FlagComponent: flags.CA },
  { code: 'CV', name: 'Cape Verde', FlagComponent: flags.CV },
  { code: 'CF', name: 'Central African Republic', FlagComponent: flags.CF },
  { code: 'TD', name: 'Chad', FlagComponent: flags.TD },
  { code: 'CL', name: 'Chile', FlagComponent: flags.CL },
  { code: 'CN', name: 'China', FlagComponent: flags.CN },
  { code: 'CO', name: 'Colombia', FlagComponent: flags.CO },
  { code: 'KM', name: 'Comoros', FlagComponent: flags.KM },
  { code: 'CG', name: 'Congo', FlagComponent: flags.CG },
  { code: 'CD', name: 'Congo (DRC)', FlagComponent: flags.CD },
  { code: 'CR', name: 'Costa Rica', FlagComponent: flags.CR },
  { code: 'HR', name: 'Croatia', FlagComponent: flags.HR },
  { code: 'CU', name: 'Cuba', FlagComponent: flags.CU },
  { code: 'CY', name: 'Cyprus', FlagComponent: flags.CY },
  { code: 'CZ', name: 'Czech Republic', FlagComponent: flags.CZ },
  { code: 'DK', name: 'Denmark', FlagComponent: flags.DK },
  { code: 'DJ', name: 'Djibouti', FlagComponent: flags.DJ },
  { code: 'DM', name: 'Dominica', FlagComponent: flags.DM },
  { code: 'DO', name: 'Dominican Republic', FlagComponent: flags.DO },
  { code: 'EC', name: 'Ecuador', FlagComponent: flags.EC },
  { code: 'EG', name: 'Egypt', FlagComponent: flags.EG },
  { code: 'SV', name: 'El Salvador', FlagComponent: flags.SV },
  { code: 'GQ', name: 'Equatorial Guinea', FlagComponent: flags.GQ },
  { code: 'ER', name: 'Eritrea', FlagComponent: flags.ER },
  { code: 'EE', name: 'Estonia', FlagComponent: flags.EE },
  { code: 'ET', name: 'Ethiopia', FlagComponent: flags.ET },
  { code: 'FJ', name: 'Fiji', FlagComponent: flags.FJ },
  { code: 'FI', name: 'Finland', FlagComponent: flags.FI },
  { code: 'FR', name: 'France', FlagComponent: flags.FR },
  { code: 'GA', name: 'Gabon', FlagComponent: flags.GA },
  { code: 'GM', name: 'Gambia', FlagComponent: flags.GM },
  { code: 'GE', name: 'Georgia', FlagComponent: flags.GE },
  { code: 'DE', name: 'Germany', FlagComponent: flags.DE },
  { code: 'GH', name: 'Ghana', FlagComponent: flags.GH },
  { code: 'GR', name: 'Greece', FlagComponent: flags.GR },
  { code: 'GD', name: 'Grenada', FlagComponent: flags.GD },
  { code: 'GT', name: 'Guatemala', FlagComponent: flags.GT },
  { code: 'GN', name: 'Guinea', FlagComponent: flags.GN },
  { code: 'GW', name: 'Guinea-Bissau', FlagComponent: flags.GW },
  { code: 'GY', name: 'Guyana', FlagComponent: flags.GY },
  { code: 'HT', name: 'Haiti', FlagComponent: flags.HT },
  { code: 'HN', name: 'Honduras', FlagComponent: flags.HN },
  { code: 'HK', name: 'Hong Kong', FlagComponent: flags.HK },
  { code: 'HU', name: 'Hungary', FlagComponent: flags.HU },
  { code: 'IS', name: 'Iceland', FlagComponent: flags.IS },
  { code: 'IN', name: 'India', FlagComponent: flags.IN },
  { code: 'ID', name: 'Indonesia', FlagComponent: flags.ID },
  { code: 'IR', name: 'Iran', FlagComponent: flags.IR },
  { code: 'IQ', name: 'Iraq', FlagComponent: flags.IQ },
  { code: 'IE', name: 'Ireland', FlagComponent: flags.IE },
  { code: 'IL', name: 'Israel', FlagComponent: flags.IL },
  { code: 'IT', name: 'Italy', FlagComponent: flags.IT },
  { code: 'CI', name: 'Ivory Coast', FlagComponent: flags.CI },
  { code: 'JM', name: 'Jamaica', FlagComponent: flags.JM },
  { code: 'JP', name: 'Japan', FlagComponent: flags.JP },
  { code: 'JO', name: 'Jordan', FlagComponent: flags.JO },
  { code: 'KZ', name: 'Kazakhstan', FlagComponent: flags.KZ },
  { code: 'KE', name: 'Kenya', FlagComponent: flags.KE },
  { code: 'KI', name: 'Kiribati', FlagComponent: flags.KI },
  { code: 'KW', name: 'Kuwait', FlagComponent: flags.KW },
  { code: 'KG', name: 'Kyrgyzstan', FlagComponent: flags.KG },
  { code: 'LA', name: 'Laos', FlagComponent: flags.LA },
  { code: 'LV', name: 'Latvia', FlagComponent: flags.LV },
  { code: 'LB', name: 'Lebanon', FlagComponent: flags.LB },
  { code: 'LS', name: 'Lesotho', FlagComponent: flags.LS },
  { code: 'LR', name: 'Liberia', FlagComponent: flags.LR },
  { code: 'LY', name: 'Libya', FlagComponent: flags.LY },
  { code: 'LI', name: 'Liechtenstein', FlagComponent: flags.LI },
  { code: 'LT', name: 'Lithuania', FlagComponent: flags.LT },
  { code: 'LU', name: 'Luxembourg', FlagComponent: flags.LU },
  { code: 'MO', name: 'Macau', FlagComponent: flags.MO },
  { code: 'MK', name: 'Macedonia', FlagComponent: flags.MK },
  { code: 'MG', name: 'Madagascar', FlagComponent: flags.MG },
  { code: 'MW', name: 'Malawi', FlagComponent: flags.MW },
  { code: 'MY', name: 'Malaysia', FlagComponent: flags.MY },
  { code: 'MV', name: 'Maldives', FlagComponent: flags.MV },
  { code: 'ML', name: 'Mali', FlagComponent: flags.ML },
  { code: 'MT', name: 'Malta', FlagComponent: flags.MT },
  { code: 'MH', name: 'Marshall Islands', FlagComponent: flags.MH },
  { code: 'MR', name: 'Mauritania', FlagComponent: flags.MR },
  { code: 'MU', name: 'Mauritius', FlagComponent: flags.MU },
  { code: 'MX', name: 'Mexico', FlagComponent: flags.MX },
  { code: 'FM', name: 'Micronesia', FlagComponent: flags.FM },
  { code: 'MD', name: 'Moldova', FlagComponent: flags.MD },
  { code: 'MC', name: 'Monaco', FlagComponent: flags.MC },
  { code: 'MN', name: 'Mongolia', FlagComponent: flags.MN },
  { code: 'ME', name: 'Montenegro', FlagComponent: flags.ME },
  { code: 'MA', name: 'Morocco', FlagComponent: flags.MA },
  { code: 'MZ', name: 'Mozambique', FlagComponent: flags.MZ },
  { code: 'MM', name: 'Myanmar', FlagComponent: flags.MM },
  { code: 'NA', name: 'Namibia', FlagComponent: flags.NA },
  { code: 'NR', name: 'Nauru', FlagComponent: flags.NR },
  { code: 'NP', name: 'Nepal', FlagComponent: flags.NP },
  { code: 'NL', name: 'Netherlands', FlagComponent: flags.NL },
  { code: 'NZ', name: 'New Zealand', FlagComponent: flags.NZ },
  { code: 'NI', name: 'Nicaragua', FlagComponent: flags.NI },
  { code: 'NE', name: 'Niger', FlagComponent: flags.NE },
  { code: 'NG', name: 'Nigeria', FlagComponent: flags.NG },
  { code: 'KP', name: 'North Korea', FlagComponent: flags.KP },
  { code: 'NO', name: 'Norway', FlagComponent: flags.NO },
  { code: 'OM', name: 'Oman', FlagComponent: flags.OM },
  { code: 'PK', name: 'Pakistan', FlagComponent: flags.PK },
  { code: 'PW', name: 'Palau', FlagComponent: flags.PW },
  { code: 'PS', name: 'Palestine', FlagComponent: flags.PS },
  { code: 'PA', name: 'Panama', FlagComponent: flags.PA },
  { code: 'PG', name: 'Papua New Guinea', FlagComponent: flags.PG },
  { code: 'PY', name: 'Paraguay', FlagComponent: flags.PY },
  { code: 'PE', name: 'Peru', FlagComponent: flags.PE },
  { code: 'PH', name: 'Philippines', FlagComponent: flags.PH },
  { code: 'PL', name: 'Poland', FlagComponent: flags.PL },
  { code: 'PT', name: 'Portugal', FlagComponent: flags.PT },
  { code: 'QA', name: 'Qatar', FlagComponent: flags.QA },
  { code: 'RO', name: 'Romania', FlagComponent: flags.RO },
  { code: 'RU', name: 'Russia', FlagComponent: flags.RU },
  { code: 'RW', name: 'Rwanda', FlagComponent: flags.RW },
  { code: 'KN', name: 'Saint Kitts and Nevis', FlagComponent: flags.KN },
  { code: 'LC', name: 'Saint Lucia', FlagComponent: flags.LC },
  { code: 'VC', name: 'Saint Vincent', FlagComponent: flags.VC },
  { code: 'WS', name: 'Samoa', FlagComponent: flags.WS },
  { code: 'SM', name: 'San Marino', FlagComponent: flags.SM },
  { code: 'ST', name: 'Sao Tome and Principe', FlagComponent: flags.ST },
  { code: 'SA', name: 'Saudi Arabia', FlagComponent: flags.SA },
  { code: 'SN', name: 'Senegal', FlagComponent: flags.SN },
  { code: 'RS', name: 'Serbia', FlagComponent: flags.RS },
  { code: 'SC', name: 'Seychelles', FlagComponent: flags.SC },
  { code: 'SL', name: 'Sierra Leone', FlagComponent: flags.SL },
  { code: 'SG', name: 'Singapore', FlagComponent: flags.SG },
  { code: 'SK', name: 'Slovakia', FlagComponent: flags.SK },
  { code: 'SI', name: 'Slovenia', FlagComponent: flags.SI },
  { code: 'SB', name: 'Solomon Islands', FlagComponent: flags.SB },
  { code: 'SO', name: 'Somalia', FlagComponent: flags.SO },
  { code: 'ZA', name: 'South Africa', FlagComponent: flags.ZA },
  { code: 'KR', name: 'South Korea', FlagComponent: flags.KR },
  { code: 'SS', name: 'South Sudan', FlagComponent: flags.SS },
  { code: 'ES', name: 'Spain', FlagComponent: flags.ES },
  { code: 'LK', name: 'Sri Lanka', FlagComponent: flags.LK },
  { code: 'SD', name: 'Sudan', FlagComponent: flags.SD },
  { code: 'SR', name: 'Suriname', FlagComponent: flags.SR },
  { code: 'SZ', name: 'Swaziland', FlagComponent: flags.SZ },
  { code: 'SE', name: 'Sweden', FlagComponent: flags.SE },
  { code: 'CH', name: 'Switzerland', FlagComponent: flags.CH },
  { code: 'SY', name: 'Syria', FlagComponent: flags.SY },
  { code: 'TW', name: 'Taiwan', FlagComponent: flags.TW },
  { code: 'TJ', name: 'Tajikistan', FlagComponent: flags.TJ },
  { code: 'TZ', name: 'Tanzania', FlagComponent: flags.TZ },
  { code: 'TH', name: 'Thailand', FlagComponent: flags.TH },
  { code: 'TL', name: 'Timor-Leste', FlagComponent: flags.TL },
  { code: 'TG', name: 'Togo', FlagComponent: flags.TG },
  { code: 'TO', name: 'Tonga', FlagComponent: flags.TO },
  { code: 'TT', name: 'Trinidad and Tobago', FlagComponent: flags.TT },
  { code: 'TN', name: 'Tunisia', FlagComponent: flags.TN },
  { code: 'TR', name: 'Turkey', FlagComponent: flags.TR },
  { code: 'TM', name: 'Turkmenistan', FlagComponent: flags.TM },
  { code: 'TV', name: 'Tuvalu', FlagComponent: flags.TV },
  { code: 'UG', name: 'Uganda', FlagComponent: flags.UG },
  { code: 'UA', name: 'Ukraine', FlagComponent: flags.UA },
  { code: 'AE', name: 'United Arab Emirates', FlagComponent: flags.AE },
  { code: 'GB', name: 'United Kingdom', FlagComponent: flags.GB },
  { code: 'US', name: 'United States', FlagComponent: flags.US },
  { code: 'UY', name: 'Uruguay', FlagComponent: flags.UY },
  { code: 'UZ', name: 'Uzbekistan', FlagComponent: flags.UZ },
  { code: 'VU', name: 'Vanuatu', FlagComponent: flags.VU },
  { code: 'VA', name: 'Vatican City', FlagComponent: flags.VA },
  { code: 'VE', name: 'Venezuela', FlagComponent: flags.VE },
  { code: 'VN', name: 'Vietnam', FlagComponent: flags.VN },
  { code: 'YE', name: 'Yemen', FlagComponent: flags.YE },
  { code: 'ZM', name: 'Zambia', FlagComponent: flags.ZM },
  { code: 'ZW', name: 'Zimbabwe', FlagComponent: flags.ZW },
];

const IconPicker = ({ value, onChange, onRemove, showRemove = true }) => {
  const handleIconSelect = (icon) => {
    onChange(icon);
  };

  const isFlag = value && value.startsWith('FLAG:');
  const flagCode = isFlag ? value.replace('FLAG:', '') : null;
  const selectedFlag = flagCode ? countryFlags.find(f => f.code === flagCode) : null;

  const content = (
    <div style={{ width: 340, maxHeight: 400, overflowY: 'auto' }}>
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 mb-2">Country Flags</div>
        <div className="grid grid-cols-8 gap-2 mb-4">
          {countryFlags.map((country) => {
            const FlagComponent = country.FlagComponent;
            return (
              <button
                key={country.code}
                onClick={() => handleIconSelect(`FLAG:${country.code}`)}
                className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer border border-gray-200 bg-white"
                title={country.name}
                style={{ width: 32, height: 24 }}
              >
                <FlagComponent style={{ width: '100%', height: '100%', display: 'block' }} />
              </button>
            );
          })}
        </div>
        <div className="text-xs font-semibold text-gray-500 mb-2">Icons</div>
        <div className="grid grid-cols-8 gap-2">
          {regularIcons.map((icon, index) => (
            <button
              key={index}
              onClick={() => handleIconSelect(icon.emoji)}
              className="emoji-font text-2xl hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer border-0 bg-white"
              title={icon.name}
              style={{ fontSize: '20px', lineHeight: 1 }}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>
      {showRemove && value && (
        <div className="border-t mt-2 pt-2 px-2">
          <button
            className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300 transition-colors"
            onClick={onRemove}
          >
            Remove Icon
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="Select Icon"
      trigger="click"
      placement="bottomLeft"
    >
      <button
        className="hover:bg-gray-200 p-1 rounded transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
        style={{ width: 32, height: 32 }}
        type="button"
      >
        {isFlag && selectedFlag ? (
          <selectedFlag.FlagComponent style={{ width: 24, height: 18, display: 'block' }} />
        ) : value ? (
          <span className="emoji-font" style={{ fontSize: '20px', lineHeight: 1 }}>{value}</span>
        ) : null}
      </button>
    </Popover>
  );
};

export default IconPicker;
