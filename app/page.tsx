'use client';

import { type ChangeEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  BarChart3,
  Camera,
  Check,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Gauge,
  LogOut,
  RotateCcw,
  Save,
  Table2,
  Upload,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

type Role = 'User' | 'Admin';
type View = 'daily' | 'reports' | 'users' | 'analytics';
type MeterKind = 'boiler' | 'autoclave';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedUnitIds: string[];
};

type Unit = {
  id: string;
  name: string;
  area: string;
};

type ReadingRecord = {
  id: string;
  srNo: number;
  date: string;
  unitId: string;
  boilerReading: number;
  boilerConsumption: number | null;
  autoclaveReading: number;
  autoclaveConsumption: number | null;
  sign: string;
  createdBy: string;
};

type UploadState = {
  fileName: string;
  previewUrl: string;
  extracted: string;
  status: 'idle' | 'reading' | 'ready' | 'manual' | 'error';
  message: string;
};

type DailyForm = {
  date: string;
  boiler: UploadState;
  autoclave: UploadState;
};

type ReportFilters = {
  unitId: string;
  from: string;
  to: string;
};

const today = '2026-09-01';

const usersSeed: User[] = [
  {
    id: 'user-1',
    name: 'Amit Sharma',
    email: 'amit@najar.example',
    role: 'User',
    assignedUnitIds: ['unit-1'],
  },
  {
    id: 'user-2',
    name: 'Neha Verma',
    email: 'neha@najar.example',
    role: 'User',
    assignedUnitIds: ['unit-1', 'unit-2'],
  },
  {
    id: 'admin-1',
    name: 'Mira Kapoor',
    email: 'mira@najar.example',
    role: 'Admin',
    assignedUnitIds: ['unit-1', 'unit-2', 'unit-3'],
  },
];

const units: Unit[] = [
  {
    id: 'unit-1',
    name: 'Unit 01',
    area: 'Boiler room',
  },
  {
    id: 'unit-2',
    name: 'Unit 02',
    area: 'Utility room',
  },
  {
    id: 'unit-3',
    name: 'Unit 03',
    area: 'Maintenance room',
  },
];

const recordsSeed: ReadingRecord[] = [
  {
    id: 'rec-1',
    srNo: 1,
    date: '2026-08-30',
    unitId: 'unit-1',
    boilerReading: 132,
    boilerConsumption: null,
    autoclaveReading: 91,
    autoclaveConsumption: null,
    sign: 'Amit Sharma',
    createdBy: 'user-1',
  },
  {
    id: 'rec-2',
    srNo: 2,
    date: '2026-08-31',
    unitId: 'unit-1',
    boilerReading: 100,
    boilerConsumption: 32,
    autoclaveReading: 70,
    autoclaveConsumption: 21,
    sign: 'Amit Sharma',
    createdBy: 'user-1',
  },
  {
    id: 'rec-3',
    srNo: 3,
    date: '2026-08-31',
    unitId: 'unit-2',
    boilerReading: 124,
    boilerConsumption: null,
    autoclaveReading: 83,
    autoclaveConsumption: null,
    sign: 'Neha Verma',
    createdBy: 'user-2',
  },
];

const adminNav: Array<{ view: View; label: string; icon: LucideIcon }> = [
  { view: 'daily', label: 'Entry', icon: Camera },
  { view: 'reports', label: 'Reports', icon: Table2 },
  { view: 'users', label: 'Users', icon: UsersRound },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const emptyUpload: UploadState = {
  fileName: '',
  previewUrl: '',
  extracted: '',
  status: 'idle',
  message: '',
};

const emptyForm = (): DailyForm => ({
  date: today,
  boiler: { ...emptyUpload },
  autoclave: { ...emptyUpload },
});

const emptyFilters: ReportFilters = {
  unitId: 'unit-1',
  from: '2026-08-30',
  to: today,
};

function getUnit(unitId: string) {
  return units.find((unit) => unit.id === unitId) ?? units[0];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value: number | null) {
  if (value === null) {
    return '-';
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function sortRecords(records: ReadingRecord[]) {
  return records
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.srNo - a.srNo);
}

function getPreviousRecord(
  records: ReadingRecord[],
  unitId: string,
  date: string,
) {
  return (
    sortRecords(
      records.filter(
        (record) => record.unitId === unitId && record.date < date,
      ),
    )[0] ?? null
  );
}

function parseReading(value: string) {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function getConsumption(previous: number | null, current: number | null) {
  if (previous === null || current === null) {
    return null;
  }

  return previous - current;
}

function extractNumberFromFilename(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
  const matches = baseName.match(/\d+(?:[.,]\d+)?/g);

  return matches?.at(-1)?.replace(',', '.') ?? '';
}

function readImagePreview(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Image preview could not be read.'));
    };
    reader.onerror = () =>
      reject(new Error('Image preview could not be read.'));
    reader.readAsDataURL(file);
  });
}

function csvValue(value: string | number | null) {
  const stringValue = value === null ? '' : String(value);

  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}

function downloadFile(filename: string, type: string, content: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 250);

  return true;
}

function buildCsv(records: ReadingRecord[]) {
  const rows = [
    [
      'sr. no.',
      'date',
      'boiler reading',
      'boiler consumption',
      'autoclave reading',
      'autoclave consumption',
      'sign',
    ],
    ...sortRecords(records).map((record) => [
      record.srNo,
      record.date,
      record.boilerReading,
      record.boilerConsumption,
      record.autoclaveReading,
      record.autoclaveConsumption,
      record.sign,
    ]),
  ];

  return rows.map((row) => row.map(csvValue).join(',')).join('\n');
}

function escapePdf(value: string) {
  return value.replace(/[\\()]/g, '\\$&');
}

function pdfText(value: string, x: number, y: number, size = 10, bold = false) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(
    value,
  )}) Tj ET`;
}

function buildPdf(records: ReadingRecord[], title: string) {
  const lines = [
    title,
    'NAJAR Digital Logbook',
    'sr. no. | date | boiler reading | boiler consumption | autoclave reading | autoclave consumption | sign',
    '',
    ...sortRecords(records).flatMap((record) => [
      `${record.srNo}. ${formatDate(record.date)} | Sign: ${record.sign}`,
      `Boiler: ${formatNumber(record.boilerReading)} | Consumption: ${formatNumber(
        record.boilerConsumption,
      )}`,
      `Autoclave: ${formatNumber(
        record.autoclaveReading,
      )} | Consumption: ${formatNumber(record.autoclaveConsumption)}`,
      '',
    ]),
  ].slice(0, 39);
  const stream = [
    'q 0.985 0.982 0.965 rg 0 0 595 842 re f Q',
    '0.10 0.12 0.12 rg',
    ...lines.map((line, index) =>
      pdfText(line, 52, 794 - index * 18, index === 0 ? 18 : 10, index < 2),
    ),
    pdfText('Page 1 of 1', 486, 38, 9),
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets[index] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function roleLabel(role: Role) {
  return role === 'Admin' ? 'Admin' : 'User';
}

function AccessScreen({
  users,
  onLogin,
}: {
  users: User[];
  onLogin: (userId: string) => void;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-3xl content-center gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Gauge className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">NAJAR Digital Logbook</h1>
              <p className="text-sm text-muted-foreground">
                Boiler aur autoclave daily reading
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="login-title">
          <h2 id="login-title" className="text-base font-semibold">
            Login profile
          </h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onLogin(user.id)}
                className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{user.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {roleLabel(user.role)} - {user.email}
                  </span>
                </span>
                <span className="rounded border border-border bg-background px-2 py-1 text-xs font-medium">
                  {roleLabel(user.role)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function AppShell({
  user,
  view,
  children,
  onNavigate,
  onLogout,
}: {
  user: User;
  view: View;
  children: React.ReactNode;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}) {
  const isAdmin = user.role === 'Admin';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Gauge className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">NAJAR Digital Logbook</p>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <nav className="flex flex-wrap gap-1" aria-label="Admin">
                {adminNav.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.view}
                      variant={view === item.view ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onNavigate(item.view)}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            )}
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        {children}
      </div>
    </main>
  );
}

function MeterRow({
  kind,
  label,
  upload,
  previousReading,
  currentReading,
  consumption,
  onUpload,
  onReadingChange,
}: {
  kind: MeterKind;
  label: string;
  upload: UploadState;
  previousReading: number | null;
  currentReading: number | null;
  consumption: number | null;
  onUpload: (kind: MeterKind, event: ChangeEvent<HTMLInputElement>) => void;
  onReadingChange: (kind: MeterKind, value: string) => void;
}) {
  const inputId = `${kind}-photo`;
  const readingId = `${kind}-reading`;
  const hasNegativeConsumption = consumption !== null && consumption < 0;

  return (
    <div className="grid gap-3 border-b border-border px-3 py-4 last:border-b-0 md:grid-cols-[150px_1.4fr_150px_120px_150px] md:items-center">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">Meter display photo</p>
      </div>

      <div>
        <label
          htmlFor={inputId}
          className="flex min-h-28 cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-background p-3 transition hover:border-primary focus-within:ring-2 focus-within:ring-ring"
        >
          <Input
            id={inputId}
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={(event) => onUpload(kind, event)}
          />
          {upload.previewUrl ? (
            <Image
              src={upload.previewUrl}
              alt={`${label} meter photo preview`}
              width={160}
              height={100}
              unoptimized
              className="h-20 w-28 rounded border border-border object-contain"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
              <Upload className="size-5" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {upload.fileName || 'Upload photo'}
            </span>
            <span className="block text-xs text-muted-foreground">
              JPG/PNG meter image
            </span>
          </span>
        </label>
        {upload.message && (
          <p
            className={`mt-2 text-sm ${
              upload.status === 'error'
                ? 'text-destructive'
                : upload.status === 'manual'
                  ? 'text-amber-800'
                  : 'text-primary'
            }`}
            aria-live="polite"
          >
            {upload.message}
          </p>
        )}
      </div>

      <label className="block" htmlFor={readingId}>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Reading
        </span>
        <Input
          id={readingId}
          inputMode="decimal"
          value={upload.extracted}
          placeholder="Number"
          onChange={(event) => onReadingChange(kind, event.target.value)}
          aria-invalid={upload.extracted !== '' && currentReading === null}
        />
      </label>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Yesterday</p>
        <p className="mt-1 text-lg font-semibold">
          {formatNumber(previousReading)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Consumption</p>
        <p
          className={`mt-1 text-lg font-semibold ${
            hasNegativeConsumption ? 'text-amber-800' : ''
          }`}
        >
          {formatNumber(consumption)}
        </p>
      </div>
    </div>
  );
}

function RecordsTable({ records }: { records: ReadingRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-5 text-center">
        <CircleAlert className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-3 font-medium">No rows found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save a daily row or change the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">sr. no.</th>
            <th className="px-3 py-2 font-medium">date</th>
            <th className="px-3 py-2 font-medium">boiler reading</th>
            <th className="px-3 py-2 font-medium">boiler consumption</th>
            <th className="px-3 py-2 font-medium">autoclave reading</th>
            <th className="px-3 py-2 font-medium">autoclave consumption</th>
            <th className="px-3 py-2 font-medium">sign</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortRecords(records).map((record) => (
            <tr key={record.id}>
              <td className="px-3 py-2 font-medium">{record.srNo}</td>
              <td className="px-3 py-2">{formatDate(record.date)}</td>
              <td className="px-3 py-2 font-semibold">
                {formatNumber(record.boilerReading)}
              </td>
              <td className="px-3 py-2">
                {formatNumber(record.boilerConsumption)}
              </td>
              <td className="px-3 py-2 font-semibold">
                {formatNumber(record.autoclaveReading)}
              </td>
              <td className="px-3 py-2">
                {formatNumber(record.autoclaveConsumption)}
              </td>
              <td className="px-3 py-2 font-medium">{record.sign}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DailyEntryView({
  user,
  authorizedUnits,
  unit,
  records,
  form,
  message,
  lastSaved,
  onUnitChange,
  onDateChange,
  onUpload,
  onReadingChange,
  onSave,
  onReset,
}: {
  user: User;
  authorizedUnits: Unit[];
  unit: Unit | null;
  records: ReadingRecord[];
  form: DailyForm;
  message: string;
  lastSaved: ReadingRecord | null;
  onUnitChange: (unitId: string) => void;
  onDateChange: (date: string) => void;
  onUpload: (kind: MeterKind, event: ChangeEvent<HTMLInputElement>) => void;
  onReadingChange: (kind: MeterKind, value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  if (!unit) {
    return (
      <section className="rounded-md border border-border bg-card p-5 text-center">
        <CircleAlert className="mx-auto size-8 text-amber-700" />
        <h1 className="mt-3 text-lg font-semibold">No unit assigned</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin se unit assign karwana hoga.
        </p>
      </section>
    );
  }

  const previous = getPreviousRecord(records, unit.id, form.date);
  const boilerReading = parseReading(form.boiler.extracted);
  const autoclaveReading = parseReading(form.autoclave.extracted);
  const boilerConsumption = getConsumption(
    previous?.boilerReading ?? null,
    boilerReading,
  );
  const autoclaveConsumption = getConsumption(
    previous?.autoclaveReading ?? null,
    autoclaveReading,
  );
  const canSave = boilerReading !== null && autoclaveReading !== null;
  const savedRows = lastSaved ? [lastSaved] : [];

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aaj ki reading</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photo upload karo, number check karo, row save karo.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[160px_160px_auto] sm:items-end">
          <label className="block" htmlFor="unit-select">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Unit
            </span>
            <NativeSelect
              id="unit-select"
              value={unit.id}
              onChange={(event) => onUnitChange(event.target.value)}
              disabled={authorizedUnits.length < 2 && user.role !== 'Admin'}
            >
              {authorizedUnits.map((assignedUnit) => (
                <NativeSelectOption
                  key={assignedUnit.id}
                  value={assignedUnit.id}
                >
                  {assignedUnit.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <label className="block" htmlFor="reading-date">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Date
            </span>
            <Input
              id="reading-date"
              type="date"
              value={form.date}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </label>

          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      <section
        className="overflow-hidden rounded-md border border-border bg-card"
        aria-label="Daily meter readings"
      >
        <div className="hidden border-b border-border bg-secondary px-3 py-2 text-xs font-medium uppercase text-muted-foreground md:grid md:grid-cols-[150px_1.4fr_150px_120px_150px]">
          <span>Meter</span>
          <span>Photo</span>
          <span>Reading</span>
          <span>Yesterday</span>
          <span>Consumption</span>
        </div>
        <MeterRow
          kind="boiler"
          label="Boiler"
          upload={form.boiler}
          previousReading={previous?.boilerReading ?? null}
          currentReading={boilerReading}
          consumption={boilerConsumption}
          onUpload={onUpload}
          onReadingChange={onReadingChange}
        />
        <MeterRow
          kind="autoclave"
          label="Autoclave"
          upload={form.autoclave}
          previousReading={previous?.autoclaveReading ?? null}
          currentReading={autoclaveReading}
          consumption={autoclaveConsumption}
          onUpload={onUpload}
          onReadingChange={onReadingChange}
        />
      </section>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Sign: <span className="font-semibold">{user.name}</span>
        </p>
        <Button className="sm:min-w-36" disabled={!canSave} onClick={onSave}>
          <Save className="size-4" aria-hidden="true" />
          Save row
        </Button>
      </div>

      {message && (
        <p
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-primary"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {lastSaved && (
        <section className="grid gap-2">
          <h2 className="text-base font-semibold">Saved row</h2>
          <RecordsTable records={savedRows} />
        </section>
      )}
    </section>
  );
}

function ReportsView({
  records,
  filters,
  onFilter,
  onExportCsv,
  onExportPdf,
}: {
  records: ReadingRecord[];
  filters: ReportFilters;
  onFilter: (filters: ReportFilters) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getUnit(filters.unitId).name} saved rows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExportCsv}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            CSV
          </Button>
          <Button variant="outline" onClick={onExportPdf}>
            <Download className="size-4" aria-hidden="true" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-card p-3 md:grid-cols-3">
        <label className="block" htmlFor="report-unit">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Unit
          </span>
          <NativeSelect
            id="report-unit"
            value={filters.unitId}
            onChange={(event) =>
              onFilter({ ...filters, unitId: event.target.value })
            }
          >
            {units.map((unit) => (
              <NativeSelectOption key={unit.id} value={unit.id}>
                {unit.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>

        <label className="block" htmlFor="from-date">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            From
          </span>
          <Input
            id="from-date"
            type="date"
            value={filters.from}
            onChange={(event) =>
              onFilter({ ...filters, from: event.target.value })
            }
          />
        </label>

        <label className="block" htmlFor="to-date">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            To
          </span>
          <Input
            id="to-date"
            type="date"
            value={filters.to}
            onChange={(event) =>
              onFilter({ ...filters, to: event.target.value })
            }
          />
        </label>
      </div>

      <RecordsTable records={records} />
    </section>
  );
}

function UsersView({
  users,
  onToggleAssignment,
}: {
  users: User[];
  onToggleAssignment: (userId: string, unitId: string) => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User ko unit assign karo.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Role</th>
              {units.map((unit) => (
                <th key={unit.id} className="px-3 py-2 font-medium">
                  {unit.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((managedUser) => (
              <tr key={managedUser.id}>
                <td className="px-3 py-2">
                  <p className="font-semibold">{managedUser.name}</p>
                  <p className="text-muted-foreground">{managedUser.email}</p>
                </td>
                <td className="px-3 py-2">{roleLabel(managedUser.role)}</td>
                {units.map((unit) => {
                  const assigned =
                    managedUser.role === 'Admin' ||
                    managedUser.assignedUnitIds.includes(unit.id);

                  return (
                    <td key={unit.id} className="px-3 py-2">
                      <Button
                        variant={assigned ? 'default' : 'outline'}
                        size="sm"
                        disabled={managedUser.role === 'Admin'}
                        onClick={() =>
                          onToggleAssignment(managedUser.id, unit.id)
                        }
                      >
                        {assigned ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <CircleAlert className="size-4" aria-hidden="true" />
                        )}
                        {assigned ? 'Assigned' : 'No access'}
                      </Button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnalyticsView({ records }: { records: ReadingRecord[] }) {
  const rows = units.map((unit) => {
    const unitRecords = sortRecords(
      records.filter((record) => record.unitId === unit.id),
    );
    const latest = unitRecords[0] ?? null;
    const boilerTotal = unitRecords.reduce(
      (sum, record) => sum + Math.max(0, record.boilerConsumption ?? 0),
      0,
    );
    const autoclaveTotal = unitRecords.reduce(
      (sum, record) => sum + Math.max(0, record.autoclaveConsumption ?? 0),
      0,
    );

    return { unit, latest, boilerTotal, autoclaveTotal };
  });

  return (
    <section className="grid gap-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unit wise consumption summary.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Latest date</th>
              <th className="px-3 py-2 font-medium">Boiler consumption</th>
              <th className="px-3 py-2 font-medium">Autoclave consumption</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.unit.id}>
                <td className="px-3 py-2 font-semibold">{row.unit.name}</td>
                <td className="px-3 py-2">
                  {row.latest ? formatDate(row.latest.date) : '-'}
                </td>
                <td className="px-3 py-2">{formatNumber(row.boilerTotal)}</td>
                <td className="px-3 py-2">
                  {formatNumber(row.autoclaveTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Home() {
  const [users, setUsers] = useState(usersSeed);
  const [records, setRecords] = useState(recordsSeed);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('daily');
  const [selectedUnitId, setSelectedUnitId] = useState('unit-1');
  const [form, setForm] = useState<DailyForm>(emptyForm);
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [message, setMessage] = useState('');
  const [lastSaved, setLastSaved] = useState<ReadingRecord | null>(null);

  const sessionUser =
    users.find((candidate) => candidate.id === sessionUserId) ?? null;
  const authorizedUnits = useMemo(() => {
    if (!sessionUser) {
      return [];
    }

    if (sessionUser.role === 'Admin') {
      return units;
    }

    return units.filter((unit) =>
      sessionUser.assignedUnitIds.includes(unit.id),
    );
  }, [sessionUser]);
  const currentUnit =
    authorizedUnits.find((unit) => unit.id === selectedUnitId) ??
    authorizedUnits[0] ??
    null;
  const filteredRecords = sortRecords(
    records.filter((record) => {
      return (
        record.unitId === filters.unitId &&
        record.date >= filters.from &&
        record.date <= filters.to
      );
    }),
  );

  function login(userId: string) {
    const user = users.find((candidate) => candidate.id === userId);

    if (!user) {
      return;
    }

    const userUnits =
      user.role === 'Admin'
        ? units
        : units.filter((unit) => user.assignedUnitIds.includes(unit.id));

    setSessionUserId(user.id);
    setSelectedUnitId(userUnits[0]?.id ?? '');
    setForm(emptyForm());
    setMessage('');
    setLastSaved(null);
    setView(user.role === 'Admin' ? 'reports' : 'daily');
  }

  function logout() {
    setSessionUserId(null);
    setMessage('');
    setLastSaved(null);
    setView('daily');
  }

  async function handleUpload(
    kind: MeterKind,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setForm((current) => ({
        ...current,
        [kind]: {
          ...emptyUpload,
          fileName: file.name,
          status: 'error',
          message: 'Image file upload karo.',
        },
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [kind]: {
        ...emptyUpload,
        fileName: file.name,
        status: 'reading',
        message: 'Photo read ho rahi hai...',
      },
    }));

    try {
      const previewUrl = await readImagePreview(file);
      const extracted = extractNumberFromFilename(file.name);

      window.setTimeout(() => {
        setForm((current) => ({
          ...current,
          [kind]: {
            fileName: file.name,
            previewUrl,
            extracted,
            status: extracted ? 'ready' : 'manual',
            message: extracted
              ? 'Number filled. Save se pehle check karo.'
              : 'Number nahi mila. Photo dekhkar reading enter karo.',
          },
        }));
      }, 250);
    } catch {
      setForm((current) => ({
        ...current,
        [kind]: {
          ...emptyUpload,
          fileName: file.name,
          status: 'error',
          message: 'Photo read nahi ho payi.',
        },
      }));
    }
  }

  function changeReading(kind: MeterKind, value: string) {
    const cleanedValue = value.replace(/[^\d.]/g, '');

    setForm((current) => ({
      ...current,
      [kind]: {
        ...current[kind],
        extracted: cleanedValue,
        status: cleanedValue ? 'ready' : current[kind].status,
        message: cleanedValue
          ? 'Reading ready. Save se pehle check karo.'
          : current[kind].message,
      },
    }));
  }

  function saveRecord() {
    if (!sessionUser || !currentUnit) {
      return;
    }

    const boilerReading = parseReading(form.boiler.extracted);
    const autoclaveReading = parseReading(form.autoclave.extracted);

    if (boilerReading === null || autoclaveReading === null) {
      setMessage('Boiler aur autoclave dono reading enter karo.');
      return;
    }

    const previous = getPreviousRecord(records, currentUnit.id, form.date);
    const existing = records.find(
      (record) => record.unitId === currentUnit.id && record.date === form.date,
    );
    const nextRecord: ReadingRecord = {
      id: existing?.id ?? `rec-${Date.now()}`,
      srNo:
        existing?.srNo ??
        Math.max(0, ...records.map((record) => record.srNo)) + 1,
      date: form.date,
      unitId: currentUnit.id,
      boilerReading,
      boilerConsumption: getConsumption(
        previous?.boilerReading ?? null,
        boilerReading,
      ),
      autoclaveReading,
      autoclaveConsumption: getConsumption(
        previous?.autoclaveReading ?? null,
        autoclaveReading,
      ),
      sign: sessionUser.name,
      createdBy: sessionUser.id,
    };

    setRecords((current) =>
      existing
        ? current.map((record) =>
            record.id === existing.id ? nextRecord : record,
          )
        : [nextRecord, ...current],
    );
    setLastSaved(nextRecord);
    setMessage(existing ? 'Row update ho gayi.' : 'Row save ho gayi.');
  }

  function resetForm() {
    setForm(emptyForm());
    setMessage('');
    setLastSaved(null);
  }

  function toggleAssignment(userId: string, unitId: string) {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== userId || user.role === 'Admin') {
          return user;
        }

        const assigned = user.assignedUnitIds.includes(unitId);

        return {
          ...user,
          assignedUnitIds: assigned
            ? user.assignedUnitIds.filter((id) => id !== unitId)
            : [...user.assignedUnitIds, unitId],
        };
      }),
    );
  }

  function exportCsv() {
    if (
      downloadFile(
        'najar-digital-logbook.csv',
        'text/csv;charset=utf-8',
        buildCsv(filteredRecords),
      )
    ) {
      setMessage('CSV export ho gaya.');
    }
  }

  function exportPdf() {
    if (
      downloadFile(
        'najar-digital-logbook.pdf',
        'application/pdf',
        buildPdf(filteredRecords, 'Daily Reading Report'),
      )
    ) {
      setMessage('PDF export ho gaya.');
    }
  }

  if (!sessionUser) {
    return <AccessScreen users={users} onLogin={login} />;
  }

  return (
    <AppShell
      user={sessionUser}
      view={view}
      onNavigate={(nextView) => {
        setMessage('');
        setView(nextView);
      }}
      onLogout={logout}
    >
      {sessionUser.role === 'Admin' && message && (
        <p
          className="mb-4 rounded-md border border-border bg-card px-3 py-2 text-sm text-primary"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {view === 'daily' && (
        <DailyEntryView
          user={sessionUser}
          authorizedUnits={authorizedUnits}
          unit={currentUnit}
          records={records}
          form={form}
          message={message}
          lastSaved={lastSaved}
          onUnitChange={setSelectedUnitId}
          onDateChange={(date) => setForm((current) => ({ ...current, date }))}
          onUpload={handleUpload}
          onReadingChange={changeReading}
          onSave={saveRecord}
          onReset={resetForm}
        />
      )}

      {sessionUser.role === 'Admin' && view === 'reports' && (
        <ReportsView
          records={filteredRecords}
          filters={filters}
          onFilter={setFilters}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
        />
      )}

      {sessionUser.role === 'Admin' && view === 'users' && (
        <UsersView users={users} onToggleAssignment={toggleAssignment} />
      )}

      {sessionUser.role === 'Admin' && view === 'analytics' && (
        <AnalyticsView records={records} />
      )}
    </AppShell>
  );
}
