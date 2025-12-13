import { Select } from 'antd';

const countries = [
  { value: 'Afghanistan', label: 'Afghanistan', flag: '🇦🇫' },
  { value: 'Argentina', label: 'Argentina', flag: '🇦🇷' },
  { value: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { value: 'Austria', label: 'Austria', flag: '🇦🇹' },
  { value: 'Bangladesh', label: 'Bangladesh', flag: '🇧🇩' },
  { value: 'Belgium', label: 'Belgium', flag: '🇧🇪' },
  { value: 'Brazil', label: 'Brazil', flag: '🇧🇷' },
  { value: 'Canada', label: 'Canada', flag: '🇨🇦' },
  { value: 'Chile', label: 'Chile', flag: '🇨🇱' },
  { value: 'China', label: 'China', flag: '🇨🇳' },
  { value: 'Colombia', label: 'Colombia', flag: '🇨🇴' },
  { value: 'Denmark', label: 'Denmark', flag: '🇩🇰' },
  { value: 'Egypt', label: 'Egypt', flag: '🇪🇬' },
  { value: 'Finland', label: 'Finland', flag: '🇫🇮' },
  { value: 'France', label: 'France', flag: '🇫🇷' },
  { value: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { value: 'Greece', label: 'Greece', flag: '🇬🇷' },
  { value: 'Hong Kong', label: 'Hong Kong', flag: '🇭🇰' },
  { value: 'India', label: 'India', flag: '🇮🇳' },
  { value: 'Indonesia', label: 'Indonesia', flag: '🇮🇩' },
  { value: 'Ireland', label: 'Ireland', flag: '🇮🇪' },
  { value: 'Israel', label: 'Israel', flag: '🇮🇱' },
  { value: 'Italy', label: 'Italy', flag: '🇮🇹' },
  { value: 'Japan', label: 'Japan', flag: '🇯🇵' },
  { value: 'Kenya', label: 'Kenya', flag: '🇰🇪' },
  { value: 'Malaysia', label: 'Malaysia', flag: '🇲🇾' },
  { value: 'Mexico', label: 'Mexico', flag: '🇲🇽' },
  { value: 'Netherlands', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'New Zealand', label: 'New Zealand', flag: '🇳🇿' },
  { value: 'Nigeria', label: 'Nigeria', flag: '🇳��' },
  { value: 'Norway', label: 'Norway', flag: '🇳🇴' },
  { value: 'Pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { value: 'Peru', label: 'Peru', flag: '🇵🇪' },
  { value: 'Philippines', label: 'Philippines', flag: '🇵🇭' },
  { value: 'Poland', label: 'Poland', flag: '🇵🇱' },
  { value: 'Portugal', label: 'Portugal', flag: '🇵🇹' },
  { value: 'Russia', label: 'Russia', flag: '🇷🇺' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia', flag: '🇸🇦' },
  { value: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
  { value: 'South Africa', label: 'South Africa', flag: '🇿🇦' },
  { value: 'South Korea', label: 'South Korea', flag: '🇰🇷' },
  { value: 'Spain', label: 'Spain', flag: '🇪🇸' },
  { value: 'Sweden', label: 'Sweden', flag: '🇸🇪' },
  { value: 'Switzerland', label: 'Switzerland', flag: '🇨🇭' },
  { value: 'Thailand', label: 'Thailand', flag: '🇹🇭' },
  { value: 'Turkey', label: 'Turkey', flag: '🇹🇷' },
  { value: 'UAE', label: 'United Arab Emirates', flag: '🇦🇪' },
  { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'USA', label: 'United States', flag: '🇺🇸' },
  { value: 'United States', label: 'United States', flag: '🇺🇸' },
  { value: 'Vietnam', label: 'Vietnam', flag: '🇻🇳' },
];

const CountrySelect = ({ value, onChange, placeholder = 'Select a country', ...props }) => {
  return (
    <Select
      showSearch
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      filterOption={(input, option) =>
        (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={countries.map(country => ({
        value: country.value,
        label: (
          <div className="flex items-center gap-2">
            <span>{country.flag}</span>
            <span>{country.label}</span>
          </div>
        ),
        searchLabel: country.label,
      }))}
      {...props}
    />
  );
};

export default CountrySelect;
