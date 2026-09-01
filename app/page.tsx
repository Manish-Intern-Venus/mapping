'use client';

import { type ChangeEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Download,
  FileImage,
  FileSpreadsheet,
  Gauge,
  ImageUp,
  LogIn,
  LogOut,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Table2,
  Upload,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

type Role = 'User' | 'Admin';
type View =
  | 'unitSelect'
  | 'daily'
  | 'saved'
  | 'adminReports'
  | 'adminUsers'
  | 'adminAnalytics';
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
    area: 'Boiler room and autoclave bay',
  },
  {
    id: 'unit-2',
    name: 'Unit 02',
    area: 'Packing utility room',
  },
  {
    id: 'unit-3',
    name: 'Unit 03',
    area: 'Maintenance utility room',
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
  { view: 'daily', label: 'Entry', icon: ImageUp },
  { view: 'adminReports', label: 'Reports', icon: Table2 },
  { view: 'adminUsers', label: 'Users', icon: UsersRound },
  { view: 'adminAnalytics', label: 'Analytics', icon: BarChart3 },
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
  unitId: 'all',
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
  const rows = sortRecords(records).flatMap((record) => [
    `${record.srNo}. ${formatDate(record.date)} | Sign: ${record.sign}`,
    `Boiler: ${formatNumber(record.boilerReading)} | Consumption: ${formatNumber(
      record.boilerConsumption,
    )}`,
    `Autoclave: ${formatNumber(
      record.autoclaveReading,
    )} | Consumption: ${formatNumber(record.autoclaveConsumption)}`,
    '',
  ]);
  const lines = [
    title,
    'NAJAR Digital Logbook',
    'sr. no. | date | boiler reading | boiler consumption | autoclave reading | autoclave consumption | sign',
    '',
    ...rows,
  ].slice(0, 39);
  const stream = [
    'q 0.985 0.982 0.965 rg 0 0 595 842 re f Q',
    'q 0.14 0.18 0.17 RG 52 762 491 0.8 re S Q',
    '0.12 0.15 0.14 rg',
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

function AccessScreen({
  users,
  onLogin,
}: {
  users: User[];
  onLogin: (userId: string) => void;
}) {
  return (
    <main className="logbook-shell min-h-screen px-4 py-6 text-foreground sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gauge className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              NAJAR Digital Logbook
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Daily boiler and autoclave readings from meter photos.
            </p>
            <div className="mt-6 grid gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <FileImage className="size-5 text-primary" aria-hidden="true" />
                <span className="font-medium">Upload meter photo</span>
              </div>
              <div className="flex items-center gap-3">
                <Table2 className="size-5 text-primary" aria-hidden="true" />
                <span className="font-medium">Save one signed daily row</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <span className="font-medium">Work only on assigned units</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <LogIn className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Access
                </p>
                <h2 className="text-2xl font-semibold">Choose profile</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onLogin(user.id)}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
                      <UserRound className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{user.name}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {user.role} - {user.email}
                      </span>
                    </span>
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-card group-hover:border-primary/60"
                  >
                    {user.role}
                  </Badge>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function UnitSelectionScreen({
  user,
  units,
  onSelect,
  onLogout,
}: {
  user: User;
  units: Unit[];
  onSelect: (unitId: string) => void;
  onLogout: () => void;
}) {
  return (
    <main className="logbook-shell min-h-screen px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {user.name}
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Select unit
            </h1>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </header>

        {units.length === 0 ? (
          <section className="mt-6 rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <CircleAlert className="mx-auto size-10 text-amber-700" />
            <h2 className="mt-4 text-xl font-semibold">No unit assigned</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask admin to assign a unit before daily readings can be saved.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelect(unit.id)}
                className="rounded-lg border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
              >
                <Building2 className="size-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-semibold">{unit.name}</h2>
                <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">
                  {unit.area}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 font-medium text-primary">
                  Open daily entry
                  <Check className="size-4" aria-hidden="true" />
                </span>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function AppShell({
  user,
  view,
  currentUnit,
  authorizedUnits,
  children,
  onNavigate,
  onChangeUnit,
  onSelectUnit,
  onLogout,
}: {
  user: User;
  view: View;
  currentUnit: Unit | null;
  authorizedUnits: Unit[];
  children: React.ReactNode;
  onNavigate: (view: View) => void;
  onChangeUnit: () => void;
  onSelectUnit: (unitId: string) => void;
  onLogout: () => void;
}) {
  const isAdmin = user.role === 'Admin';

  return (
    <main className="logbook-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gauge className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                NAJAR
              </p>
              <h1 className="truncate text-lg font-semibold">
                Digital Logbook
              </h1>
            </div>
          </div>

          {isAdmin && (
            <nav
              className="flex gap-2 overflow-x-auto pb-1 lg:pb-0"
              aria-label="Admin navigation"
            >
              {adminNav.map((item) => {
                const Icon = item.icon;

                return (
                  <Button
                    key={item.view}
                    variant={view === item.view ? 'default' : 'ghost'}
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => onNavigate(item.view)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {currentUnit && (
              <>
                {isAdmin ? (
                  <NativeSelect
                    className="w-full sm:w-40"
                    value={currentUnit.id}
                    onChange={(event) => onSelectUnit(event.target.value)}
                    aria-label="Current unit"
                  >
                    {authorizedUnits.map((unit) => (
                      <NativeSelectOption key={unit.id} value={unit.id}>
                        {unit.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : (
                  authorizedUnits.length > 1 && (
                    <Button variant="outline" onClick={onChangeUnit}>
                      <Building2 className="size-4" aria-hidden="true" />
                      {currentUnit.name}
                    </Button>
                  )
                )}
              </>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <UserRound className="size-4 text-muted-foreground" />
              <span className="max-w-36 truncate">{user.name}</span>
              <Badge variant="outline" className="rounded-full">
                {user.role}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        {children}
      </div>
    </main>
  );
}

function UploadPanel({
  kind,
  title,
  upload,
  previousReading,
  currentReading,
  consumption,
  onUpload,
  onReadingChange,
  onClear,
}: {
  kind: MeterKind;
  title: string;
  upload: UploadState;
  previousReading: number | null;
  currentReading: number | null;
  consumption: number | null;
  onUpload: (kind: MeterKind, event: ChangeEvent<HTMLInputElement>) => void;
  onReadingChange: (kind: MeterKind, value: string) => void;
  onClear: (kind: MeterKind) => void;
}) {
  const inputId = `${kind}-photo`;
  const hasWarning = consumption !== null && consumption < 0;

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Meter photo
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Camera className="size-5" aria-hidden="true" />
        </span>
      </div>

      <label
        htmlFor={inputId}
        className="mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-4 text-center transition hover:border-primary/60 hover:bg-primary/5"
      >
        {upload.previewUrl ? (
          <Image
            src={upload.previewUrl}
            alt={`${title} uploaded meter preview`}
            width={640}
            height={360}
            unoptimized
            className="max-h-44 w-full rounded-md object-contain"
          />
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
              <Upload className="size-6" aria-hidden="true" />
            </span>
            <span className="mt-3 block font-medium">
              Upload {title.toLowerCase()} photo
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              JPG or PNG meter display
            </span>
          </>
        )}
      </label>
      <Input
        id={inputId}
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={(event) => onUpload(kind, event)}
      />

      {upload.fileName && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">
            {upload.fileName}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onClear(kind)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label
          className="space-y-1.5 sm:col-span-1"
          htmlFor={`${kind}-reading`}
        >
          <span className="text-sm font-medium">Reading</span>
          <Input
            id={`${kind}-reading`}
            inputMode="decimal"
            value={upload.extracted}
            placeholder="Number"
            onChange={(event) => onReadingChange(kind, event.target.value)}
            aria-invalid={upload.extracted !== '' && currentReading === null}
          />
        </label>
        <div className="rounded-lg border border-border bg-background p-3">
          <span className="block text-xs text-muted-foreground">Previous</span>
          <span className="mt-1 block text-xl font-semibold">
            {formatNumber(previousReading)}
          </span>
        </div>
        <div
          className={`rounded-lg border p-3 ${
            hasWarning
              ? 'border-amber-200 bg-amber-50 text-amber-950'
              : 'border-border bg-background'
          }`}
        >
          <span className="block text-xs text-muted-foreground">
            Consumption
          </span>
          <span className="mt-1 block text-xl font-semibold">
            {formatNumber(consumption)}
          </span>
        </div>
      </div>

      {upload.message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            upload.status === 'error'
              ? 'bg-red-50 text-red-800'
              : upload.status === 'manual'
                ? 'bg-amber-50 text-amber-900'
                : 'bg-emerald-50 text-emerald-800'
          }`}
          aria-live="polite"
        >
          {upload.message}
        </p>
      )}
    </section>
  );
}

function SavedRow({ record }: { record: ReadingRecord }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Saved row</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {getUnit(record.unitId).name} - {formatDate(record.date)}
          </h2>
        </div>
        <Badge
          variant="outline"
          className="h-7 rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Signed
        </Badge>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-3 pr-4 font-medium">sr. no.</th>
              <th className="py-3 pr-4 font-medium">date</th>
              <th className="py-3 pr-4 font-medium">boiler reading</th>
              <th className="py-3 pr-4 font-medium">boiler consumption</th>
              <th className="py-3 pr-4 font-medium">autoclave reading</th>
              <th className="py-3 pr-4 font-medium">autoclave consumption</th>
              <th className="py-3 font-medium">sign</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/70">
              <td className="py-3 pr-4 font-medium">{record.srNo}</td>
              <td className="py-3 pr-4">{formatDate(record.date)}</td>
              <td className="py-3 pr-4 font-semibold">
                {formatNumber(record.boilerReading)}
              </td>
              <td className="py-3 pr-4">
                {formatNumber(record.boilerConsumption)}
              </td>
              <td className="py-3 pr-4 font-semibold">
                {formatNumber(record.autoclaveReading)}
              </td>
              <td className="py-3 pr-4">
                {formatNumber(record.autoclaveConsumption)}
              </td>
              <td className="py-3 font-medium">{record.sign}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DailyEntryView({
  user,
  unit,
  records,
  form,
  message,
  lastSaved,
  onDateChange,
  onUpload,
  onReadingChange,
  onClearUpload,
  onSave,
  onReset,
  onChangeUnit,
}: {
  user: User;
  unit: Unit | null;
  records: ReadingRecord[];
  form: DailyForm;
  message: string;
  lastSaved: ReadingRecord | null;
  onDateChange: (date: string) => void;
  onUpload: (kind: MeterKind, event: ChangeEvent<HTMLInputElement>) => void;
  onReadingChange: (kind: MeterKind, value: string) => void;
  onClearUpload: (kind: MeterKind) => void;
  onSave: () => void;
  onReset: () => void;
  onChangeUnit: () => void;
}) {
  if (!unit) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <CircleAlert className="mx-auto size-10 text-amber-700" />
        <h2 className="mt-4 text-xl font-semibold">No unit assigned</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask admin to assign a unit before daily readings can be saved.
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

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="h-7 rounded-full bg-background"
              >
                {unit.name}
              </Badge>
              <Badge
                variant="outline"
                className="h-7 rounded-full bg-background"
              >
                <PenLine className="size-4" aria-hidden="true" />
                Sign: {user.name}
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Daily meter entry
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Upload boiler and autoclave meter photos, check the numbers, then
              save today row.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_auto] lg:min-w-[360px]">
            <label className="space-y-1.5" htmlFor="reading-date">
              <span className="text-sm font-medium">Date</span>
              <Input
                id="reading-date"
                type="date"
                value={form.date}
                onChange={(event) => onDateChange(event.target.value)}
              />
            </label>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="h-8" onClick={onReset}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </Button>
              <Button
                className="h-8"
                onClick={onChangeUnit}
                disabled={
                  user.role !== 'Admin' && user.assignedUnitIds.length < 2
                }
              >
                <Building2 className="size-4" aria-hidden="true" />
                Unit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UploadPanel
          kind="boiler"
          title="Boiler"
          upload={form.boiler}
          previousReading={previous?.boilerReading ?? null}
          currentReading={boilerReading}
          consumption={boilerConsumption}
          onUpload={onUpload}
          onReadingChange={onReadingChange}
          onClear={onClearUpload}
        />
        <UploadPanel
          kind="autoclave"
          title="Autoclave"
          upload={form.autoclave}
          previousReading={previous?.autoclaveReading ?? null}
          currentReading={autoclaveReading}
          consumption={autoclaveConsumption}
          onUpload={onUpload}
          onReadingChange={onReadingChange}
          onClear={onClearUpload}
        />
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Boiler reading</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(boilerReading)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Boiler consumption</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(boilerConsumption)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Autoclave reading</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(autoclaveReading)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Sign</p>
            <p className="mt-1 truncate text-2xl font-semibold">{user.name}</p>
          </div>
        </div>
        <Button
          className="h-11 px-5 text-base"
          disabled={!canSave}
          onClick={onSave}
        >
          <ClipboardList className="size-5" aria-hidden="true" />
          Save row
        </Button>
      </section>

      {message && (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {lastSaved && <SavedRow record={lastSaved} />}
    </section>
  );
}

function RecordsTable({ records }: { records: ReadingRecord[] }) {
  if (records.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <ClipboardList className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No rows found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Change filters or save a daily reading row.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/70 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">sr. no.</th>
              <th className="px-4 py-3 font-medium">date</th>
              <th className="px-4 py-3 font-medium">boiler reading</th>
              <th className="px-4 py-3 font-medium">boiler consumption</th>
              <th className="px-4 py-3 font-medium">autoclave reading</th>
              <th className="px-4 py-3 font-medium">autoclave consumption</th>
              <th className="px-4 py-3 font-medium">sign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortRecords(records).map((record) => (
              <tr key={record.id} className="bg-card">
                <td className="px-4 py-3 font-medium">{record.srNo}</td>
                <td className="px-4 py-3">{formatDate(record.date)}</td>
                <td className="px-4 py-3 font-semibold">
                  {formatNumber(record.boilerReading)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(record.boilerConsumption)}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatNumber(record.autoclaveReading)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(record.autoclaveConsumption)}
                </td>
                <td className="px-4 py-3 font-medium">{record.sign}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminReportsView({
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
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin reports
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
              Daily logbook rows
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {filters.unitId === 'all'
                ? 'Showing all units'
                : `Showing ${getUnit(filters.unitId).name}`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onExportCsv}>
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Excel CSV
            </Button>
            <Button variant="outline" onClick={onExportPdf}>
              <Download className="size-4" aria-hidden="true" />
              PDF
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Unit</span>
            <NativeSelect
              className="w-full"
              value={filters.unitId}
              onChange={(event) =>
                onFilter({ ...filters, unitId: event.target.value })
              }
            >
              <NativeSelectOption value="all">All units</NativeSelectOption>
              {units.map((unit) => (
                <NativeSelectOption key={unit.id} value={unit.id}>
                  {unit.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1.5" htmlFor="from-date">
            <span className="text-sm font-medium">From</span>
            <Input
              id="from-date"
              type="date"
              value={filters.from}
              onChange={(event) =>
                onFilter({ ...filters, from: event.target.value })
              }
            />
          </label>
          <label className="space-y-1.5" htmlFor="to-date">
            <span className="text-sm font-medium">To</span>
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
      </div>

      <RecordsTable records={records} />
    </section>
  );
}

function AdminUsersView({
  users,
  onToggleAssignment,
}: {
  users: User[];
  onToggleAssignment: (userId: string, unitId: string) => void;
}) {
  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-sm font-medium text-muted-foreground">Admin users</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
          Unit assignment
        </h1>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                {units.map((unit) => (
                  <th key={unit.id} className="px-4 py-3 font-medium">
                    {unit.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((managedUser) => (
                <tr key={managedUser.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{managedUser.name}</p>
                    <p className="text-muted-foreground">{managedUser.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="rounded-full">
                      {managedUser.role}
                    </Badge>
                  </td>
                  {units.map((unit) => {
                    const assigned =
                      managedUser.role === 'Admin' ||
                      managedUser.assignedUnitIds.includes(unit.id);

                    return (
                      <td key={unit.id} className="px-4 py-3">
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
                            <CircleAlert
                              className="size-4"
                              aria-hidden="true"
                            />
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
    </section>
  );
}

function AdminAnalyticsView({ records }: { records: ReadingRecord[] }) {
  const unitSummaries = units.map((unit) => {
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

    return {
      unit,
      latest,
      boilerTotal,
      autoclaveTotal,
    };
  });
  const maxTotal = Math.max(
    1,
    ...unitSummaries.flatMap((item) => [item.boilerTotal, item.autoclaveTotal]),
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-sm font-medium text-muted-foreground">
          Admin analytics
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
          Consumption by unit
        </h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {unitSummaries.map((item) => (
          <article
            key={item.unit.id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{item.unit.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.latest
                    ? `Latest: ${formatDate(item.latest.date)}`
                    : 'No record yet'}
                </p>
              </div>
              <Building2 className="size-6 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Boiler consumption</span>
                  <span>{formatNumber(item.boilerTotal)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.boilerTotal / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Autoclave consumption</span>
                  <span>{formatNumber(item.autoclaveTotal)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${(item.autoclaveTotal / maxTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
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
        (filters.unitId === 'all' || record.unitId === filters.unitId) &&
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

    if (user.role === 'Admin') {
      setView('adminReports');
      return;
    }

    setView(userUnits.length > 1 ? 'unitSelect' : 'daily');
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
          message: 'Upload an image file.',
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
        message: 'Reading photo...',
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
              ? 'Reading filled. Check it before saving.'
              : 'Number not found. Enter the reading after checking photo.',
          },
        }));
      }, 350);
    } catch {
      setForm((current) => ({
        ...current,
        [kind]: {
          ...emptyUpload,
          fileName: file.name,
          status: 'error',
          message: 'Photo could not be read.',
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
          ? 'Reading ready. Check it before saving.'
          : current[kind].message,
      },
    }));
  }

  function clearUpload(kind: MeterKind) {
    setForm((current) => ({
      ...current,
      [kind]: { ...emptyUpload },
    }));
  }

  function saveRecord() {
    if (!sessionUser || !currentUnit) {
      return;
    }

    const boilerReading = parseReading(form.boiler.extracted);
    const autoclaveReading = parseReading(form.autoclave.extracted);

    if (boilerReading === null || autoclaveReading === null) {
      setMessage('Enter both readings before saving.');
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
    setMessage(
      existing
        ? 'Today row updated with your name.'
        : 'Today row saved with your name.',
    );
    setView('saved');
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
      setMessage('Excel CSV exported.');
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
      setMessage('PDF exported.');
    }
  }

  if (!sessionUser) {
    return <AccessScreen users={users} onLogin={login} />;
  }

  if (view === 'unitSelect') {
    return (
      <UnitSelectionScreen
        user={sessionUser}
        units={authorizedUnits}
        onSelect={(unitId) => {
          setSelectedUnitId(unitId);
          setView('daily');
        }}
        onLogout={logout}
      />
    );
  }

  return (
    <AppShell
      user={sessionUser}
      view={view}
      currentUnit={currentUnit}
      authorizedUnits={authorizedUnits}
      onNavigate={(nextView) => {
        setMessage('');
        setView(nextView);
      }}
      onChangeUnit={() => setView('unitSelect')}
      onSelectUnit={(unitId) => setSelectedUnitId(unitId)}
      onLogout={logout}
    >
      {sessionUser.role === 'Admin' && message && (
        <p
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {sessionUser.role === 'User' && view === 'saved' && lastSaved && (
        <div className="mb-4">
          <Button variant="outline" onClick={() => setView('daily')}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            New entry
          </Button>
        </div>
      )}

      {(view === 'daily' || view === 'saved') && (
        <DailyEntryView
          user={sessionUser}
          unit={currentUnit}
          records={records}
          form={form}
          message={message}
          lastSaved={lastSaved}
          onDateChange={(date) => setForm((current) => ({ ...current, date }))}
          onUpload={handleUpload}
          onReadingChange={changeReading}
          onClearUpload={clearUpload}
          onSave={saveRecord}
          onReset={resetForm}
          onChangeUnit={() => setView('unitSelect')}
        />
      )}

      {sessionUser.role === 'Admin' && view === 'adminReports' && (
        <AdminReportsView
          records={filteredRecords}
          filters={filters}
          onFilter={setFilters}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
        />
      )}

      {sessionUser.role === 'Admin' && view === 'adminUsers' && (
        <AdminUsersView users={users} onToggleAssignment={toggleAssignment} />
      )}

      {sessionUser.role === 'Admin' && view === 'adminAnalytics' && (
        <AdminAnalyticsView records={records} />
      )}
    </AppShell>
  );
}
