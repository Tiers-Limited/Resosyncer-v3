import { Select } from 'antd';
import countryList from 'react-select-country-list';
import ReactCountryFlag from 'country-flag-icons/react/3x2';

const CountrySelect = ({ value, onChange, placeholder = 'Select a country', ...props }) => {
  const countries = countryList().getData();

  return (
    <Select
      showSearch
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      filterOption={(input, option) =>
        (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={countries.map(country => {
        const FlagComponent = ReactCountryFlag[country.value];
        return {
          value: country.label, // Use the full country name as value
          label: (
            <div className="flex items-center gap-2">
              {FlagComponent && <FlagComponent style={{ width: '20px', height: '15px' }} />}
              <span>{country.label}</span>
            </div>
          ),
          searchLabel: country.label,
        };
      })}
      {...props}
    />
  );
};

export default CountrySelect;
