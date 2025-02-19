import React from "react";
import moment from "moment"

export default function CurrentPeriodControl({ startDate, onPeriodControlChange }) {
  const calculatePeriodDayNumber = (startDate) => {
    // Calculate the number of days since today
    const now = moment();
    const start = moment(startDate);
    // Round up to include the start day
    return now.diff(start, 'days') + 1;
  };

  if (startDate) {
    return <div className="flex justify-center period-control ongoing-period-control">
      <div className="flex flex-col justify-center current-period-info">
        <p className="text-xl">Period: </p>
        <p className="text-2xl">Day {calculatePeriodDayNumber(startDate)}</p><br/>
        <div className="flex justify-center">
          <button className="btn btn-primary" onClick={() => onPeriodControlChange(null)}>My period ended</button>
        </div>
      </div>
    </div>
  }

  return (
    <div className="flex justify-center period-control">
      <button className="btn btn-primary" onClick={() => onPeriodControlChange(new Date())}>My period started</button>
    </div>
  );
}
