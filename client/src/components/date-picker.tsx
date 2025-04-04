import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { addWeeks, addMonths, addYears } from "date-fns";

interface DatePickerProps {
  onDateSelect: (date: Date) => void;
}

enum DatePickerMode {
  Duration = "duration",
  CustomDate = "customDate",
}

export function DatePicker({ onDateSelect }: DatePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>("1 week");
  const [mode, setMode] = useState<DatePickerMode>(DatePickerMode.Duration);

  const presets = [
    { label: "1 week", value: addWeeks(new Date(), 1) },
    { label: "1 month", value: addMonths(new Date(), 1) },
    { label: "6 months", value: addMonths(new Date(), 6) },
    { label: "1 year", value: addYears(new Date(), 1) },
    { label: "5 years", value: addYears(new Date(), 5) },
  ];

  const [date, setDate] = useState<Date>(presets[0].value);

  // Set default selection on mount
  useEffect(() => {
    const defaultPreset = presets[0];
    setSelectedPreset(defaultPreset.label);
    onDateSelect(defaultPreset.value);
    setDate(defaultPreset.value);
  }, [mode]);

  const handlePresetSelect = (label: string, date: Date) => {
    setSelectedPreset(label);
    setMode(DatePickerMode.Duration);
    onDateSelect(date);
    setDate(date);
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return date.toLocaleString("default", { month: "long" });
  });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() + i
  );

  const defaultMonth = date.toLocaleString("default", { month: "long" });
  const defaultDay = date.getDate();
  const defaultYear = date.getFullYear();

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Choose Delivery Time
        </CardTitle>
        <CardDescription>
          Select when you want to receive your voice note (at least one day in
          the future)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Deliver in</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode(
                  mode === DatePickerMode.Duration
                    ? DatePickerMode.CustomDate
                    : DatePickerMode.Duration
                );
                setSelectedPreset(null);
              }}
              className="h-8"
            >
              or choose a{" "}
              {mode === DatePickerMode.Duration ? "date" : "duration"}
            </Button>
          </div>

          <div className="min-h-[120px]">
            {mode === DatePickerMode.Duration && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presets.map(({ label, value }) => (
                  <Button
                    key={label}
                    variant={selectedPreset === label ? "default" : "outline"}
                    onClick={() => handlePresetSelect(label, value)}
                    className="w-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            {mode === DatePickerMode.CustomDate && (
              <div className="flex gap-2">
                <Select>
                  <select
                    defaultValue={defaultMonth}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => {
                      const newMonth = months.indexOf(e.target.value); // Get the index of the selected month
                      const newDate = new Date(
                        defaultYear,
                        newMonth,
                        defaultDay
                      ); // Create a new date object
                      setDate(newDate); // Update the date state
                      onDateSelect(newDate); // Call the onDateSelect with the new date
                    }}
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </Select>
                <Select>
                  <select
                    defaultValue={defaultDay}
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => {
                      const newDay = parseInt(e.target.value, 10); // Get the selected day
                      const newDate = new Date(
                        defaultYear,
                        monthIndexMap[defaultMonth],
                        newDay
                      ); // Create a new date object
                      setDate(newDate); // Update the date state
                      onDateSelect(newDate); // Call the onDateSelect with the new date
                    }}
                  >
                    {Array.from(
                      { length: getDaysInMonth(defaultMonth, defaultYear) },
                      (_, i) => i + 1
                    ).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </Select>
                <Select>
                  <select
                    defaultValue={defaultYear}
                    className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value, 10); // Get the selected year
                      const newDate = new Date(
                        newYear,
                        monthIndexMap[defaultMonth],
                        defaultDay
                      ); // Create a new date object
                      setDate(newDate); // Update the date state
                      onDateSelect(newDate); // Call the onDateSelect with the new date
                    }}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
}

const getDaysInMonth = (month: string, year: number): number => {
  const monthIndex = monthIndexMap[month];
  const daysMap: { [key: number]: number } = {
    0: 31, // January
    1: 28, // February (ignoring leap years for simplicity)
    2: 31, // March
    3: 30, // April
    4: 31, // May
    5: 30, // June
    6: 31, // July
    7: 31, // August
    8: 30, // September
    9: 31, // October
    10: 30, // November
    11: 31, // December
  };
  return daysMap[monthIndex];
};

const monthIndexMap: { [key: string]: number } = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};
