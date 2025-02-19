import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import { useEffect, useState } from "react";
import CurrentPeriodControl from "@/components/current-period-control"
import { PeriodDialog } from "@/components/period-dialog"
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from "@/lib/utils";
import { configureProtocol, createPeriodEntry } from '@/lib/dwn-actions';
import { Web5 } from '@web5/api';

// TODO: Read events from DWN
const dummyPeriodStart = '2024-06-11';
const dummyPeriodEnd = '2024-06-15';

const formatDateForCalendar = (date) => date.toISOString().split('T')[0]

export function CalendarPage() {
  const [periodStartDate, setPeriodStartDate] = useState(null);
  const [dialogTitle, setDialogTitle] = useState('Dialog');
  const [isOpen, setIsOpen] = useState(false);
  const [dialogPeriod, setDialogPeriod] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [web5, setWeb5] = useState(null);
  const [userDid, setUserDid] = useState(null);

  /**
   * Initialize the period and event data.
   */
  const dummyPeriodId = uuidv4();
  const [periods, setPeriods] = useState({
    [dummyPeriodId]: {
      id: dummyPeriodId,
      startDate: dummyPeriodStart,
      endDate: dummyPeriodEnd,
    }
  });
  const dummyPeriodDates = calculatePeriodDays(dummyPeriodStart, dummyPeriodEnd || formatDate(new Date()));
  const dummyPeriodEvents = dummyPeriodDates.map((dummyPeriodDate) => {
    return {
      date: dummyPeriodDate,
      title: `day-${uuidv4()}`,
      periodId: dummyPeriodId,
    }
  });
  const [events, setEvents] = useState([
    {
      date: dummyPeriodStart,
      title: "start",
      periodId: dummyPeriodId,
    },
  ].concat(dummyPeriodEvents));

  useEffect(() => {
    const connectWeb5 = async () => {
      const { web5, did: userDid } = await Web5.connect({});
      setWeb5(web5);
      setUserDid(userDid);
      console.log(web5, userDid)
      if (web5 && userDid) {
        configureProtocol(web5, userDid);
      }
    };

    connectWeb5();
  }, [setWeb5, setUserDid]);

  useEffect(() => {
    const newCurrentPeriod = findCurrentPeriod();
    setCurrentPeriod(findCurrentPeriod());
    setPeriodStartDate(newCurrentPeriod?.startDate);
  }, [periods]);
  /**** END INITIALIZATION ****/

  /**
   * Returns the periodId of the new period.
   * @param {String} startDate String formatted as 'YYYY-MM-DD'
   */
  function startNewPeriod(startDate) {
    console.log("Starting a new period", periods, startDate);
    const periodId = uuidv4();
    setPeriods({
      ...periods,
      [periodId]: {
        id: periodId,
        startDate: startDate,
        endDate: null,
      }
    });
    console.log("periods: ", periods);
    addEvent("start", startDate, periodId);
    return periodId;
  }

  /**
   * Return the dates (as strings) between the start and end dates.
   * @param {String} startDate excluded from the response
   * @param {String} endDate included in the response
   */
  function calculatePeriodDays(startDate, endDate) {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    let start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const days = [];
    start.setDate(start.getDate() + 1);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      days.push(formatDate(d));
    }
    return days;
  }

  /**
   * Adds new events to the calendar for each day between the start and end dates.
   * @param {String} periodId UUID identifying the period
   * @param {String} endDate String formatted as 'YYYY-MM-DD'
   */
  function endExistingPeriod(periodId, endDate) {
    console.log("Ending a period");
    setPeriods({
      ...periods,
      [periodId]: {
        ...periods[periodId],
        endDate: endDate,
      }
    });
    console.log("periods: ", periods);
    // Calculate the days in the period in between
    const days = calculatePeriodDays(periods[periodId].startDate, endDate);
    console.log("Period days: ", days);
    addEvents(days, periodId);
  }

  function findCurrentPeriod() {
    for (const periodId in periods) {
      const period = periods[periodId];
      if (!period.endDate) {
        return period;
      }
    }
  }

  /**
   * @param {String} periodId UUID identifying the period
   * @returns Period Javascript object
   */
  function findPeriodById(periodId) {
    return periods[periodId];
  }

  /**
   * This should not be called directly. It should ONLY be called indirectly from 
   * startNewPeriod() or endExistingPeriod().
   * @param {String} title 
   * @param {String} date 
   * @param {String} periodId 
   */
  // TODO: Replace with data from the modal submission

  function addEvent(title, date, periodId) {
    const newEvent = {
      date: date,
      title: title,
      periodId: periodId,
    };

    setEvents([
      ...events,
      newEvent
    ]);

    const periodEntryData = {
      startDate: date,
      endDate: date,
      duration: 1,
      dailyEntries: [
        {
          date: date,
        }
      ],
      id: periodId
    };

    createPeriodEntry(web5, userDid, periodEntryData);
  }

  function addEvents(dates, periodId) {
    const newEvents = dates.map((date) => {
      return {
        date: date,
        title: `day-${uuidv4()}`,
        periodId: periodId,
      }
    });

    setEvents([
      ...events,
      ...newEvents,
    ]);

    const periodEntryData = {
      startDate: periods[periodId].startDate,
      endDate: dates[dates.length - 1],
      duration: dates.length,
      dailyEntries: dates.map(date => ({
        date: date,
      })),
      id: periodId
    };

    createPeriodEntry(web5, userDid, periodEntryData);
  }

  const EventItem = ({ info }) => {
    // TODO: Customize how the event is displayed on the calendar
    const { event } = info;
    return (
      <div>
        <span className="dot"></span>
      </div>
    );
  };

  function onDialogClose(localStartDate, localEndDate) {
    console.log("onDialogClose");
    setIsOpen(false);
    // TODO: Update the event if the localStartDate changed

    // TODO: Add events between localStartDate and localEndDate
    endExistingPeriod(dialogPeriod.id, localEndDate);
  }

  const onPeriodControlChange = (date) => {
    if (date) {
      startNewPeriod(formatDate(date));
    } else {
      openModalFromButton(currentPeriod.id);
    }
  }

  // const openModal = () => {document.getElementById('my_modal_1').showModal()}
  console.log("rendering calendar page")

  const openModal = (eventTitle, periodId) => {
    const period = findPeriodById(periodId);
    setDialogPeriod(period);
    setDialogTitle(eventTitle);
    setIsOpen(true);
  }

  const openModalFromCalendar = (newContent) => {
    const event = newContent.event;
    const periodId = event.extendedProps?.periodId;

    openModal(event.title, periodId);
  }

  const openModalFromButton = (periodId) => {
    openModal("end period", periodId);
  }

  return (
    <div className="flex flex-col calendar-page">
      <FullCalendar
        selectable={true}
        plugins={[dayGridPlugin]}
        eventClick={openModalFromCalendar}
        eventContent={(info) => <EventItem info={info} />}
        initialView="dayGridMonth"
        events={events}
        aspectRatio={1}
      />
      {/* <button className="btn" onClick={openModal}>open modal</button> */}
      {/* <Modal> */}

      {/* <div className="modal-box">
        <h3 className="font-bold text-lg">Hello Tal!</h3>
        <p className="py-4">Press ESC key or click the button below to close</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
          </form>
        </div>
      </div> */}
      {/* </Modal> */}
      <CurrentPeriodControl startDate={periodStartDate} onPeriodControlChange={onPeriodControlChange} />
      {isOpen && <PeriodDialog title={dialogTitle} period={dialogPeriod} onClose={onDialogClose} />}
    </div>
  )
};