import React, { useState } from "react";
import { DateRange } from "react-date-range";
import { addDays, subDays, differenceInDays } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const sidebarOptions = [
  { label: "Last 7 days", range: [subDays(new Date(), 6), new Date()] },
  { label: "Last 30 days", range: [subDays(new Date(), 29), new Date()] },
  { label: "Last 90 days", range: [subDays(new Date(), 89), new Date()] },
  { label: "Last 365 days", range: [subDays(new Date(), 364), new Date()] },
  { label: "Last month", range: [subDays(new Date(), 30), new Date()] },
  { label: "Last 12 months", range: [subDays(new Date(), 364), new Date()] },
  { label: "Last year", range: [subDays(new Date(), 365), new Date()] },
];

export default function DateRangeSelector({ onApply }) {
  const maxRangeDays = 10955;

  const [state, setState] = useState([
    {
      startDate: subDays(new Date(), 29),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [selectedLabel, setSelectedLabel] = useState("Last 30 days");

  const handleSidebarClick = (label, range) => {
    setSelectedLabel(label);
    setState([{ startDate: range[0], endDate: range[1], key: "selection" }]);
  };

  const handleDateChange = (item) => {
    const { startDate, endDate } = item.selection;
    const currentDate = new Date();

    // Restrict future dates
    const restrictedEndDate = endDate > currentDate ? currentDate : endDate;

    // Calculate the number of days in the selected range
    const rangeDays = differenceInDays(restrictedEndDate, startDate);

    // Prevent selecting a range greater than 3 years
    if (rangeDays <= maxRangeDays) {
      setState([{ startDate, endDate: restrictedEndDate, key: "selection" }]);
    }
  };

  return (
    <div className="flex bg-white text-black rounded-md shadow-lg p-4 w-full max-w-xl">
      <div className="w-1/4 border-r pr-4 overflow-y-auto">
        {sidebarOptions.map((opt) => (
          <div
            key={opt.label}
            onClick={() => handleSidebarClick(opt.label, opt.range)}
            className={`p-2 cursor-pointer rounded hover:bg-gray-100 ${
              selectedLabel === opt.label ? "bg-gray-100 font-medium" : ""
            }`}
          >
            {opt.label}
          </div>
        ))}
      </div>
      <div className="w-3/4 px-4">
        <DateRange
          editableDateInputs={true}
          onChange={handleDateChange}
          moveRangeOnFirstSelection={false}
          ranges={state}
          rangeColors={["#3b82f6"]}
          maxDate={new Date()}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-black text-sm rounded"
            onClick={() => onApply(state[0])}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}