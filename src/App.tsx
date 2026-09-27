import { useEffect, useState } from 'react';
import './style.css';

type WorkRecord = {
  date: string;
  leavingTime: string;
};

const STORAGE_KEY = 'weekly-report-records';

function getMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getWeekDays(): Date[] {
  const monday = getMonday(new Date());

  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

const weekDays = getWeekDays();

const dayNames = ['月', '火', '水', '木', '金'];

function loadRecords(): WorkRecord[] {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function App() {
  const [records, setRecords] = useState<WorkRecord[]>(loadRecords);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  function saveLeavingTime(date: string, leavingTime: string) {
    if (!leavingTime) {
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.date !== date),
      );
      return;
    }

    setRecords((currentRecords) => {
      const existing = currentRecords.some(
        (record) => record.date === date,
      );

      if (existing) {
        return currentRecords.map((record) =>
          record.date === date
            ? { ...record, leavingTime }
            : record,
        );
      }

      return [...currentRecords, { date, leavingTime }];
    });
  }

  function recordToday() {
    const now = new Date();

    const date = formatDate(now);
    const leavingTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    saveLeavingTime(date, leavingTime);
  }

  function generateReport(): string {
    return weekDays
      .map((date, index) => {
        const dateString = formatDate(date);
        const record = records.find(
          (record) => record.date === dateString,
        );

        return `${formatDisplayDate(date)}(${dayNames[index]})：${
          record?.leavingTime ?? '未記録'
        }`;
      })
      .join('\n');
  }

  async function copyReport() {
    const report = generateReport();

    await navigator.clipboard.writeText(report);

    window.alert('週報をコピーしました');
  }

  return (
    <main className="container">
      <h1>週報</h1>

      <section className="card">
        <h2>今週の退勤時間</h2>

        <div className="records">
          {weekDays.map((date, index) => {
            const dateString = formatDate(date);
            const record = records.find(
              (record) => record.date === dateString,
            );

            return (
              <div className="day-row" key={dateString}>
                <span className="day">{dayNames[index]}</span>

                <span className="date">{formatDisplayDate(date)}</span>

                <label className="time-input-wrap">
                  <span className="sr-only">退勤時間</span>
                  <input
                    aria-label="退勤時間"
                    type="time"
                    className="time-input"
                    value={record?.leavingTime ?? ''}
                    onChange={(event) =>
                      saveLeavingTime(dateString, event.target.value)
                    }
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <button
        className="primary-button"
        onClick={recordToday}
      >
        今日の退勤時間を記録
      </button>

      <button
        className="secondary-button"
        onClick={copyReport}
      >
        週報をコピー
      </button>

      <section className="card">
        <h2>プレビュー</h2>

        <pre>{generateReport()}</pre>
      </section>
    </main>
  );
}

export default App;