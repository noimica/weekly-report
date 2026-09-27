import { useEffect, useState } from 'react';
import './style.css';

type WorkRecord = {
  date: string;
  leavingTime: string;
};

type DateFormat = 'M/D' | 'YYYY/MM/DD' | 'M月D日' | 'M/D(曜)';
type TimeFormat = 'HH:mm' | 'H:mm' | 'HH時mm分' | 'H時mm分';

type ReportSettings = {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  intro: string;
  outro: string;
  template: string;
  emptyText: string;
  perDateEmptyText?: Record<string, string>;
};

const STORAGE_KEY = 'weekly-report-records';
const STORAGE_KEY_SETTINGS = 'weekly-report-settings';
const DEFAULT_TEMPLATE = '{{date}}({{day}})：{{time}}';

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

function loadSettings(): ReportSettings {
  const value = localStorage.getItem(STORAGE_KEY_SETTINGS);

  if (!value) {
    return {
      dateFormat: 'M/D(曜)',
      timeFormat: 'HH:mm',
      intro: 'お疲れ様です。',
      outro: '今週もありがとうございました。',
      template: DEFAULT_TEMPLATE,
      emptyText: '未設定',
      perDateEmptyText: {},
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<ReportSettings>;

    return {
      dateFormat: parsed.dateFormat ?? 'M/D(曜)',
      timeFormat: parsed.timeFormat ?? 'HH:mm',
      intro: parsed.intro ?? 'お疲れ様です。',
      outro: parsed.outro ?? '今週もありがとうございました。',
      template: parsed.template ?? DEFAULT_TEMPLATE,
      emptyText: parsed.emptyText ?? '未設定',
      perDateEmptyText: parsed.perDateEmptyText ?? {},
    };
  } catch {
    return {
      dateFormat: 'M/D(曜)',
      timeFormat: 'HH:mm',
      intro: 'お疲れ様です。',
      outro: '今週もありがとうございました。',
      template: DEFAULT_TEMPLATE,
      emptyText: '未設定',
      perDateEmptyText: {},
    };
  }
}

function formatDateForDisplay(
  date: Date,
  dateFormat: DateFormat,
  dayLabel: string,
): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  switch (dateFormat) {
    case 'M/D':
      return `${month}/${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    case 'M月D日':
      return `${month}月${day}日`;
    case 'M/D(曜)':
      return `${month}/${day}(${dayLabel})`;
    default:
      return `${month}/${day}`;
  }
}

function formatTimeForDisplay(time: string, timeFormat: TimeFormat): string {
  if (!time) {
    return '未記録';
  }

  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  switch (timeFormat) {
    case 'HH:mm':
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    case 'H:mm':
      return `${hour}:${String(minute).padStart(2, '0')}`;
    case 'HH時mm分':
      return `${String(hour).padStart(2, '0')}時${String(minute).padStart(2, '0')}分`;
    case 'H時mm分':
      return `${hour}時${String(minute).padStart(2, '0')}分`;
    default:
      return time;
  }
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*(date|day|time)\s*\}\}/g, (_, key: string) => {
    return values[key] ?? '';
  });
}

function App() {
  const [records, setRecords] = useState<WorkRecord[]>(loadRecords);
  const [settings, setSettings] = useState<ReportSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

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
    const lines = weekDays.map((date, index) => {
      const dateString = formatDate(date);
      const record = records.find(
        (record) => record.date === dateString,
      );

      const dateEmptyText = settings.perDateEmptyText?.[dateString] ?? settings.emptyText;

      const values = {
        date: formatDateForDisplay(date, settings.dateFormat, dayNames[index]),
        day: dayNames[index],
        time: record
          ? formatTimeForDisplay(record.leavingTime, settings.timeFormat)
          : dateEmptyText,
      };

      return applyTemplate(settings.template, values);
    });

    const body = lines.join('\n');
    const intro = settings.intro.trim();
    const outro = settings.outro.trim();

    if (!intro && !outro) {
      return body;
    }

    return [intro, body, outro].filter(Boolean).join('\n\n');
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

      <section className="card settings-card">
        <h2>週報テンプレート設定</h2>

        <label className="field">
          <span>日付の表示</span>
          <select
            value={settings.dateFormat}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                dateFormat: event.target.value as DateFormat,
              }))
            }
          >
            <option value="M/D">M/D</option>
            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
            <option value="M月D日">M月D日</option>
            <option value="M/D(曜)">M/D(曜)</option>
          </select>
        </label>

        <label className="field">
          <span>時刻の表示</span>
          <select
            value={settings.timeFormat}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                timeFormat: event.target.value as TimeFormat,
              }))
            }
          >
            <option value="HH:mm">HH:mm</option>
            <option value="H:mm">H:mm</option>
            <option value="HH時mm分">HH時mm分</option>
            <option value="H時mm分">H時mm分</option>
          </select>
        </label>

        <label className="field">
          <span>前の文</span>
          <textarea
            rows={2}
            value={settings.intro}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                intro: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>週報テンプレート</span>
          <textarea
            rows={3}
            value={settings.template}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                template: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>未入力時の文言</span>
          <input
            type="text"
            value={settings.emptyText}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                emptyText: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>後の文</span>
          <textarea
            rows={2}
            value={settings.outro}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                outro: event.target.value,
              }))
            }
          />
        </label>

        <div className="day-settings">
          {weekDays.map((date, index) => {
            const dateString = formatDate(date);
            const dayEmptyText = settings.perDateEmptyText?.[dateString] ?? settings.emptyText;
            const [isOpen, setIsOpen] = useState(false);

            return (
              <div className="day-settings-item" key={dateString}>
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => setIsOpen((current) => !current)}
                  aria-expanded={isOpen}
                >
                  <span>{formatDisplayDate(date)}({dayNames[index]})</span>
                  <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen ? (
                  <div className="accordion-body">
                    <label className="field field-compact">
                      <span>この日の未入力時の文言</span>
                      <input
                        type="text"
                        value={dayEmptyText}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            perDateEmptyText: {
                              ...(current.perDateEmptyText ?? {}),
                              [dateString]: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="template-help">
          使える埋め込み変数: {'{{date}}'}、{'{{day}}'}、{'{{time}}'}
        </p>
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