'use client';

import { type ComponentProps, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Download,
  Droplets,
  Factory,
  FileText,
  Flame,
  Gauge,
  LockKeyhole,
  LogIn,
  Plus,
  Settings2,
  ShieldCheck,
  Thermometer,
  UserRound,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

type Status = 'Healthy' | 'Attention' | 'Critical' | 'Pending';
type Role = 'Admin' | 'Supervisor' | 'Operator';
type View =
  | 'landing'
  | 'login'
  | 'unitSelect'
  | 'overview'
  | 'newCheck'
  | 'inspection'
  | 'result'
  | 'reports'
  | 'analytics'
  | 'admin';
type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'thisWeek'
  | 'last30'
  | 'thisMonth'
  | 'custom';
type FieldKey =
  | 'pressure'
  | 'temperature'
  | 'waterQuality'
  | 'holdMinutes'
  | 'cycleCount';

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
  plant: string;
  line: string;
  status: Status;
  lastInspection: string;
  shiftOwner: string;
  signal: string;
};

type InspectionField = {
  key: FieldKey;
  label: string;
  unit: string;
  ideal: string;
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
};

type Equipment = {
  id: string;
  name: string;
  summary: string;
  inspectionContext: string;
  icon: LucideIcon;
  accent: string;
  fields: InspectionField[];
};

type ParameterRecord = {
  label: string;
  value: string;
  condition: Status;
};

type Report = {
  id: string;
  reportNo: string;
  unitId: string;
  equipmentId: string;
  inspectedAt: string;
  status: Status;
  operator: string;
  severity: string;
  summary: string;
  parameters: ParameterRecord[];
  failedChecks: string[];
  warnings: string[];
  recommendations: string[];
};

type InspectionFormState = {
  operator: string;
  pressure: string;
  temperature: string;
  waterQuality: string;
  holdMinutes: string;
  cycleCount: string;
  safetyInterlocks: boolean;
  leakObserved: boolean;
  notes: string;
};

type Filters = {
  unitId: string;
  equipmentId: string;
  status: string;
  operator: string;
  preset: DatePreset;
  from: string;
  to: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

const today = new Date('2026-09-01T10:30:00');

const units: Unit[] = [
  {
    id: 'unit-1',
    name: 'Unit 01',
    plant: 'Sterile Utilities Plant',
    line: 'Boiler house and autoclave bay',
    status: 'Attention',
    lastInspection: '2026-09-01T08:10:00',
    shiftOwner: 'Shift A',
    signal: 'Steam loop stable with one boiler drift under watch.',
  },
  {
    id: 'unit-2',
    name: 'Unit 02',
    plant: 'Packing Utilities Plant',
    line: 'Autoclave and air service corridor',
    status: 'Healthy',
    lastInspection: '2026-08-31T17:40:00',
    shiftOwner: 'Shift B',
    signal: 'No critical exceptions in the active reporting window.',
  },
  {
    id: 'unit-3',
    name: 'Unit 03',
    plant: 'Expansion Utilities Plant',
    line: 'Commissioning equipment room',
    status: 'Pending',
    lastInspection: '2026-08-29T13:20:00',
    shiftOwner: 'Maintenance',
    signal: 'Awaiting first complete production inspection.',
  },
];

const initialUsers: User[] = [
  {
    id: 'operator-1',
    name: 'Asha Mehta',
    email: 'asha@najar.example',
    role: 'Operator',
    assignedUnitIds: ['unit-1'],
  },
  {
    id: 'supervisor-1',
    name: 'Rohan Sen',
    email: 'rohan@najar.example',
    role: 'Supervisor',
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

const equipmentCatalog: Equipment[] = [
  {
    id: 'boiler',
    name: 'Boiler',
    summary: 'Steam generation, water quality, pressure control.',
    inspectionContext: 'Shift utility check',
    icon: Flame,
    accent: 'from-orange-500 to-amber-300',
    fields: [
      {
        key: 'pressure',
        label: 'Steam pressure',
        unit: 'bar',
        ideal: '7.2 to 8.8',
        min: 7.2,
        max: 8.8,
        criticalMin: 6.4,
        criticalMax: 9.6,
      },
      {
        key: 'temperature',
        label: 'Stack temperature',
        unit: 'C',
        ideal: '160 to 215',
        min: 160,
        max: 215,
        criticalMin: 145,
        criticalMax: 235,
      },
      {
        key: 'waterQuality',
        label: 'Feed water TDS',
        unit: 'ppm',
        ideal: 'below 120',
        max: 120,
        criticalMax: 170,
      },
    ],
  },
  {
    id: 'autoclave',
    name: 'Autoclave',
    summary: 'Chamber temperature, pressure, hold duration.',
    inspectionContext: 'Sterilization readiness',
    icon: Gauge,
    accent: 'from-cyan-500 to-emerald-300',
    fields: [
      {
        key: 'temperature',
        label: 'Chamber temperature',
        unit: 'C',
        ideal: '119 to 124',
        min: 119,
        max: 124,
        criticalMin: 116,
        criticalMax: 127,
      },
      {
        key: 'pressure',
        label: 'Chamber pressure',
        unit: 'bar',
        ideal: '0.95 to 1.25',
        min: 0.95,
        max: 1.25,
        criticalMin: 0.8,
        criticalMax: 1.45,
      },
      {
        key: 'holdMinutes',
        label: 'Hold duration',
        unit: 'min',
        ideal: '30 or more',
        min: 30,
        criticalMin: 24,
      },
    ],
  },
  {
    id: 'compressor',
    name: 'Air Compressor',
    summary: 'Header pressure, thermal load, service cycles.',
    inspectionContext: 'Compressed air health',
    icon: Wrench,
    accent: 'from-slate-500 to-cyan-300',
    fields: [
      {
        key: 'pressure',
        label: 'Header pressure',
        unit: 'bar',
        ideal: '5.8 to 7.0',
        min: 5.8,
        max: 7,
        criticalMin: 5.2,
        criticalMax: 7.8,
      },
      {
        key: 'temperature',
        label: 'Outlet temperature',
        unit: 'C',
        ideal: 'below 82',
        max: 82,
        criticalMax: 95,
      },
      {
        key: 'cycleCount',
        label: 'Start cycles',
        unit: 'cycles',
        ideal: 'below 90',
        max: 90,
        criticalMax: 130,
      },
    ],
  },
];

const initialReports: Report[] = [
  {
    id: 'r-1007',
    reportNo: 'NJR-U01-20260901-BOI',
    unitId: 'unit-1',
    equipmentId: 'boiler',
    inspectedAt: '2026-09-01T08:10:00',
    status: 'Attention',
    operator: 'Asha Mehta',
    severity: 'Medium',
    summary: 'Feed water TDS is trending above the preferred operating band.',
    parameters: [
      { label: 'Steam pressure', value: '8.1 bar', condition: 'Healthy' },
      { label: 'Stack temperature', value: '210 C', condition: 'Healthy' },
      { label: 'Feed water TDS', value: '138 ppm', condition: 'Attention' },
    ],
    failedChecks: [],
    warnings: ['Feed water TDS exceeded the configured operating band.'],
    recommendations: ['Run blowdown and repeat water-quality check this shift.'],
  },
  {
    id: 'r-1006',
    reportNo: 'NJR-U02-20260831-AUT',
    unitId: 'unit-2',
    equipmentId: 'autoclave',
    inspectedAt: '2026-08-31T17:40:00',
    status: 'Healthy',
    operator: 'Rohan Sen',
    severity: 'Low',
    summary: 'Autoclave cycle readiness remained inside control limits.',
    parameters: [
      { label: 'Chamber temperature', value: '121.4 C', condition: 'Healthy' },
      { label: 'Chamber pressure', value: '1.08 bar', condition: 'Healthy' },
      { label: 'Hold duration', value: '34 min', condition: 'Healthy' },
    ],
    failedChecks: [],
    warnings: [],
    recommendations: ['Continue normal pre-cycle inspection cadence.'],
  },
  {
    id: 'r-1005',
    reportNo: 'NJR-U01-20260831-AUT',
    unitId: 'unit-1',
    equipmentId: 'autoclave',
    inspectedAt: '2026-08-31T14:35:00',
    status: 'Healthy',
    operator: 'Asha Mehta',
    severity: 'Low',
    summary: 'Hold duration and chamber pressure met release criteria.',
    parameters: [
      { label: 'Chamber temperature', value: '121.1 C', condition: 'Healthy' },
      { label: 'Chamber pressure', value: '1.12 bar', condition: 'Healthy' },
      { label: 'Hold duration', value: '32 min', condition: 'Healthy' },
    ],
    failedChecks: [],
    warnings: [],
    recommendations: ['No follow-up action required.'],
  },
  {
    id: 'r-1004',
    reportNo: 'NJR-U01-20260830-BOI',
    unitId: 'unit-1',
    equipmentId: 'boiler',
    inspectedAt: '2026-08-30T09:20:00',
    status: 'Critical',
    operator: 'Vikram Rao',
    severity: 'High',
    summary: 'Steam pressure dropped below the critical floor during startup.',
    parameters: [
      { label: 'Steam pressure', value: '6.1 bar', condition: 'Critical' },
      { label: 'Stack temperature', value: '178 C', condition: 'Healthy' },
      { label: 'Feed water TDS', value: '102 ppm', condition: 'Healthy' },
    ],
    failedChecks: ['Steam pressure was below the configured critical floor.'],
    warnings: ['Supervisor verification required before next startup.'],
    recommendations: ['Inspect fuel train and pressure control valve before release.'],
  },
  {
    id: 'r-1003',
    reportNo: 'NJR-U02-20260829-COM',
    unitId: 'unit-2',
    equipmentId: 'compressor',
    inspectedAt: '2026-08-29T12:00:00',
    status: 'Attention',
    operator: 'Rohan Sen',
    severity: 'Medium',
    summary: 'Start cycles are rising above the preferred operating envelope.',
    parameters: [
      { label: 'Header pressure', value: '6.2 bar', condition: 'Healthy' },
      { label: 'Outlet temperature', value: '78 C', condition: 'Healthy' },
      { label: 'Start cycles', value: '96 cycles', condition: 'Attention' },
    ],
    failedChecks: [],
    warnings: ['Start cycle count exceeded the configured operating band.'],
    recommendations: ['Check receiver leak rate and downstream demand pattern.'],
  },
  {
    id: 'r-1002',
    reportNo: 'NJR-U03-20260829-BOI',
    unitId: 'unit-3',
    equipmentId: 'boiler',
    inspectedAt: '2026-08-29T13:20:00',
    status: 'Pending',
    operator: 'Maintenance',
    severity: 'Open',
    summary: 'Commissioning record saved before complete production release.',
    parameters: [
      { label: 'Steam pressure', value: 'Pending', condition: 'Pending' },
      { label: 'Stack temperature', value: 'Pending', condition: 'Pending' },
      { label: 'Feed water TDS', value: 'Pending', condition: 'Pending' },
    ],
    failedChecks: [],
    warnings: ['Production inspection has not been completed for this unit.'],
    recommendations: ['Complete first production check before routine reporting.'],
  },
];

const defaultInspectionForm: InspectionFormState = {
  operator: '',
  pressure: '',
  temperature: '',
  waterQuality: '',
  holdMinutes: '',
  cycleCount: '',
  safetyInterlocks: true,
  leakObserved: false,
  notes: '',
};

const statusMeta: Record<
  Status,
  {
    icon: LucideIcon;
    badge: string;
    panel: string;
    ring: string;
    label: string;
  }
> = {
  Healthy: {
    icon: CheckCircle2,
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    panel: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    ring: 'bg-emerald-500',
    label: 'Healthy',
  },
  Attention: {
    icon: AlertTriangle,
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    panel: 'bg-amber-50 text-amber-950 border-amber-200',
    ring: 'bg-amber-500',
    label: 'Attention',
  },
  Critical: {
    icon: CircleAlert,
    badge: 'border-red-200 bg-red-50 text-red-800',
    panel: 'bg-red-50 text-red-950 border-red-200',
    ring: 'bg-red-600',
    label: 'Critical',
  },
  Pending: {
    icon: CalendarDays,
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    panel: 'bg-slate-50 text-slate-900 border-slate-200',
    ring: 'bg-slate-400',
    label: 'Pending',
  },
};

const navItems: Array<{ view: View; label: string; icon: LucideIcon }> = [
  { view: 'overview', label: 'Overview', icon: Factory },
  { view: 'newCheck', label: 'New Check', icon: Plus },
  { view: 'reports', label: 'Reports', icon: FileText },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'admin', label: 'Admin', icon: Settings2 },
];

const plantStages: Array<[string, number, number, string]> = [
  ['Monitor', 72, 166, '#22d3ee'],
  ['Inspect', 225, 205, '#34d399'],
  ['Analyse', 390, 130, '#f59e0b'],
  ['Report', 548, 166, '#e5e7eb'],
];

const inspectionSteps = [
  'Identification',
  'Operating Parameters',
  'Safety Conditions',
  'Observation',
  'Verification',
];

const datePresets: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

const emptyFilters: Filters = {
  unitId: 'all',
  equipmentId: 'all',
  status: 'all',
  operator: 'all',
  preset: 'last30',
  from: '2026-08-01',
  to: '2026-09-01',
};

function getUnit(unitId: string) {
  return units.find((unit) => unit.id === unitId) ?? units[0];
}

function getEquipment(equipmentId: string) {
  return (
    equipmentCatalog.find((equipment) => equipment.id === equipmentId) ??
    equipmentCatalog[0]
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateOnly(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value instanceof Date ? value : new Date(value));
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const next = new Date(today);
  next.setDate(today.getDate() - days);
  return next;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function dateRangeForPreset(filters: Filters) {
  if (filters.preset === 'custom') {
    return {
      from: startOfDay(new Date(`${filters.from}T00:00:00`)),
      to: endOfDay(new Date(`${filters.to}T00:00:00`)),
    };
  }

  if (filters.preset === 'today') {
    return { from: startOfDay(today), to: endOfDay(today) };
  }

  if (filters.preset === 'yesterday') {
    const yesterday = daysAgo(1);
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
  }

  if (filters.preset === 'thisWeek') {
    const from = startOfDay(new Date(today));
    from.setDate(today.getDate() - today.getDay());
    return { from, to: endOfDay(today) };
  }

  if (filters.preset === 'thisMonth') {
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: endOfDay(today),
    };
  }

  const days = filters.preset === 'last7' ? 6 : 29;
  return { from: startOfDay(daysAgo(days)), to: endOfDay(today) };
}

function statusPriority(status: Status) {
  if (status === 'Critical') {
    return 4;
  }

  if (status === 'Attention') {
    return 3;
  }

  if (status === 'Pending') {
    return 2;
  }

  return 1;
}

function deriveUnitStatus(unitReports: Report[], fallback: Status) {
  const latest = unitReports.slice(0, 5);
  return latest.reduce<Status>((current, report) => {
    return statusPriority(report.status) > statusPriority(current)
      ? report.status
      : current;
  }, fallback);
}

function conditionFor(value: number, field: InspectionField): Status {
  if (
    (field.criticalMin !== undefined && value < field.criticalMin) ||
    (field.criticalMax !== undefined && value > field.criticalMax)
  ) {
    return 'Critical';
  }

  if (
    (field.min !== undefined && value < field.min) ||
    (field.max !== undefined && value > field.max)
  ) {
    return 'Attention';
  }

  return 'Healthy';
}

function parseField(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function evaluateInspection(equipment: Equipment, form: InspectionFormState) {
  const parameters = equipment.fields.map((field) => {
    const value = parseField(form[field.key]);
    const condition = value === null ? 'Pending' : conditionFor(value, field);

    return {
      label: field.label,
      value: value === null ? 'Pending' : `${value} ${field.unit}`,
      condition,
    };
  });

  const failedChecks = parameters
    .filter((parameter) => parameter.condition === 'Critical')
    .map((parameter) => `${parameter.label} reached a critical threshold.`);
  const warnings = parameters
    .filter((parameter) => parameter.condition === 'Attention')
    .map((parameter) => `${parameter.label} is outside the operating band.`);

  if (!form.safetyInterlocks) {
    failedChecks.push('Safety interlocks were not confirmed.');
  }

  if (form.leakObserved) {
    failedChecks.push('Leak or abnormal release was observed.');
  }

  const status: Status =
    failedChecks.length > 0
      ? 'Critical'
      : warnings.length > 0
        ? 'Attention'
        : 'Healthy';

  const recommendations =
    status === 'Critical'
      ? [
          'Hold equipment release until supervisor verification is complete.',
          'Attach this inspection to the shift handoff packet.',
        ]
      : status === 'Attention'
        ? [
            'Repeat the affected reading before the next operating interval.',
            'Keep the item visible in the next unit review.',
          ]
        : ['Continue normal inspection cadence for this equipment.'];

  return {
    status,
    severity:
      status === 'Critical'
        ? 'High'
        : status === 'Attention'
          ? 'Medium'
          : 'Low',
    summary:
      status === 'Critical'
        ? `${equipment.name} requires immediate supervisor attention.`
        : status === 'Attention'
          ? `${equipment.name} is operating with conditions to watch.`
          : `${equipment.name} is inside configured operating limits.`,
    parameters,
    failedChecks,
    warnings,
    recommendations,
  };
}

function filterReports(
  reports: Report[],
  filters: Filters,
  authorizedUnitIds: string[],
) {
  const range = dateRangeForPreset(filters);

  return reports.filter((report) => {
    const inspectedAt = new Date(report.inspectedAt);

    return (
      authorizedUnitIds.includes(report.unitId) &&
      inspectedAt >= range.from &&
      inspectedAt <= range.to &&
      (filters.unitId === 'all' || report.unitId === filters.unitId) &&
      (filters.equipmentId === 'all' ||
        report.equipmentId === filters.equipmentId) &&
      (filters.status === 'all' || report.status === filters.status) &&
      (filters.operator === 'all' || report.operator === filters.operator)
    );
  });
}

function escapePdf(value: string) {
  return value.replace(/[\\()]/g, '\\$&');
}

function pdfText(
  value: string,
  x: number,
  y: number,
  size = 10,
  bold = false,
) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdf(
    value,
  )}) Tj ET`;
}

function buildPdf(lines: string[]) {
  const stream = [
    'q 0.965 0.975 0.965 rg 0 0 595 842 re f Q',
    'q 0.12 0.17 0.18 RG 52 764 491 0.8 re S Q',
    '0.12 0.17 0.18 rg',
    ...lines.slice(0, 37).map((line, index) => {
      const y = 792 - index * 18;
      return pdfText(line, 52, y, index === 0 ? 18 : 10, index < 3);
    }),
    pdfText('Page 1 of 1', 485, 38, 9),
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

function downloadPdf(
  title: string,
  reports: Report[],
  filename: string,
  rangeLabel: string,
) {
  if (reports.length === 0 || typeof window === 'undefined') {
    return false;
  }

  const statusSummary = ['Healthy', 'Attention', 'Critical', 'Pending']
    .map((status) => {
      const count = reports.filter((report) => report.status === status).length;
      return `${status}: ${count}`;
    })
    .join(' | ');

  const lines = [
    title,
    'NAJAR Industrial Inspection Report',
    `Generated ${formatDateTime(today.toISOString())}`,
    `Period: ${rangeLabel}`,
    `Records: ${reports.length}`,
    statusSummary,
    '',
    'Inspection Records',
    ...reports.flatMap((report) => [
      `${report.reportNo} | ${getUnit(report.unitId).name} | ${
        getEquipment(report.equipmentId).name
      } | ${report.status}`,
      `${formatDateTime(report.inspectedAt)} | ${report.operator} | Severity ${
        report.severity
      }`,
      report.summary,
      `Recommendation: ${report.recommendations[0]}`,
      '',
    ]),
  ];

  const blob = new Blob([buildPdf(lines)], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 250);
  return true;
}

function StatusBadge({ status }: { status: Status }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${meta.badge}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

function PlantGraphic() {
  return (
    <div className="plant-graphic relative overflow-hidden rounded-lg border border-white/15 bg-zinc-950 p-5 text-white shadow-2xl">
      <div className="absolute inset-0 plant-grid opacity-60" />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              Live Plant Map
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Unit condition before release
            </h2>
          </div>
          <StatusBadge status="Attention" />
        </div>

        <svg
          className="h-auto w-full"
          viewBox="0 0 620 330"
          aria-labelledby="plant-map-title"
        >
          <title id="plant-map-title">
            Plant inspection flow from units to reports and analysis
          </title>
          <defs>
            <linearGradient id="pipe" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="54%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path
            className="signal-line"
            d="M70 166 C148 86 222 246 303 164 S459 90 548 166"
            fill="none"
            stroke="url(#pipe)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M70 166 C148 86 222 246 303 164 S459 90 548 166"
            fill="none"
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          {plantStages.map(([label, x, y, color]) => (
            <g key={label}>
              <circle
                cx={x}
                cy={y}
                r="34"
                fill="#101827"
                stroke={color}
                strokeWidth="3"
              />
              <circle cx={x} cy={y} r="6" fill={color} />
              <text
                x={x}
                y={y + 60}
                fill="rgba(255,255,255,0.82)"
                fontSize="15"
                fontWeight="600"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          ))}
          <g transform="translate(72 54)">
            <rect width="136" height="52" rx="8" fill="rgba(15,23,42,0.85)" />
            <text x="18" y="23" fill="#a5f3fc" fontSize="13">
              Boiler U01
            </text>
            <text x="18" y="40" fill="#fff7ed" fontSize="18" fontWeight="700">
              Attention
            </text>
          </g>
          <g transform="translate(372 218)">
            <rect width="154" height="54" rx="8" fill="rgba(15,23,42,0.86)" />
            <text x="18" y="23" fill="#bbf7d0" fontSize="13">
              Autoclave U02
            </text>
            <text x="18" y="41" fill="#f8fafc" fontSize="18" fontWeight="700">
              Healthy
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

function LandingScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="industrial-shell min-h-screen text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Factory className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              NAJAR
            </p>
            <p className="font-semibold">Industrial Intelligence</p>
          </div>
        </div>
        <Button className="h-10 px-4" onClick={onLogin}>
          <LogIn className="size-4" aria-hidden="true" />
          Login
        </Button>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,1fr)] lg:items-center lg:px-8">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="h-7 rounded-full border-cyan-200 bg-cyan-50 px-3 text-cyan-900"
          >
            Monitor - Inspect - Analyse - Report
          </Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
            NAJAR Digital Logbook
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Know the condition of every operating unit before drift becomes
            downtime. Enter a plant context, inspect the equipment, generate an
            actionable result, and preserve the report automatically.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button className="h-11 px-5 text-base" onClick={onLogin}>
              <LockKeyhole className="size-4" aria-hidden="true" />
              Enter Platform
            </Button>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium transition hover:bg-muted"
              href="#workflow"
            >
              See workflow
              <ChevronRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <PlantGraphic />
      </section>

      <section
        id="workflow"
        className="mx-auto grid w-full max-w-7xl gap-3 px-4 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"
        aria-label="Inspection lifecycle"
      >
        {[
          ['Monitor', 'Unit signal, recent history, and open exceptions.'],
          ['Inspect', 'Equipment-specific checks with step-by-step context.'],
          ['Analyse', 'Trends come from stored inspection reports.'],
          ['Report', 'Single, daily, weekly, monthly, and custom PDFs.'],
        ].map(([title, copy], index) => (
          <article
            key={title}
            className="rounded-lg border border-border bg-card/90 p-4 shadow-sm"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              {index + 1}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

function LoginScreen({
  users,
  selectedProfile,
  onSelectProfile,
  onSubmit,
  onBack,
}: {
  users: User[];
  selectedProfile: string;
  onSelectProfile: (id: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
  onBack: () => void;
}) {
  const selectedUser = users.find((user) => user.id === selectedProfile);

  return (
    <main className="industrial-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
          <Button variant="ghost" className="mb-5" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Badge
            variant="outline"
            className="h-7 rounded-full border-cyan-200 bg-cyan-50 px-3 text-cyan-900"
          >
            Secure plant entry
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">
            Enter through the unit access gate.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The platform opens only the units assigned to the signed-in user.
            A single-unit operator goes straight to work; a multi-unit user
            chooses the operating unit deliberately.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Selected profile
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser?.role} - {selectedUser?.assignedUnitIds.length}{' '}
                  assigned unit
                  {selectedUser?.assignedUnitIds.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Authentication
              </p>
              <h2 className="text-2xl font-semibold">Choose access context</h2>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectProfile(user.id)}
                  className={`flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition ${
                    selectedProfile === user.id
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{user.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {user.role} access
                    </span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {user.assignedUnitIds
                      .map((unitId) => getUnit(unitId).name)
                      .join(', ')}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5" htmlFor="email">
                <span className="text-sm font-medium">Email</span>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser?.email ?? ''}
                  readOnly
                />
              </label>
              <label className="space-y-1.5" htmlFor="password">
                <span className="text-sm font-medium">Password</span>
                <Input
                  id="password"
                  type="password"
                  value="platform-gate"
                  readOnly
                />
              </label>
            </div>

            <Button type="submit" className="h-11 w-full text-base">
              <LogIn className="size-4" aria-hidden="true" />
              Continue
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function UnitSelectionScreen({
  user,
  authorizedUnits,
  reports,
  onSelectUnit,
  onLogout,
}: {
  user: User;
  authorizedUnits: Unit[];
  reports: Report[];
  onSelectUnit: (unitId: string) => void;
  onLogout: () => void;
}) {
  return (
    <main className="industrial-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{user.name}</p>
              <h1 className="text-2xl font-semibold">
                Choose your operating unit
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Sign out
          </Button>
        </header>

        {authorizedUnits.length === 0 ? (
          <section className="mt-8 rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <CircleAlert className="mx-auto size-10 text-amber-700" />
            <h2 className="mt-4 text-xl font-semibold">
              No assigned unit is available
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask an administrator to assign at least one operating unit before
              inspection work can begin.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {authorizedUnits.map((unit) => {
              const unitReports = reports.filter(
                (report) => report.unitId === unit.id,
              );
              const status = deriveUnitStatus(unitReports, unit.status);
              const openIssues = unitReports.filter(
                (report) =>
                  report.status === 'Attention' || report.status === 'Critical',
              ).length;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => onSelectUnit(unit.id)}
                  className="group rounded-lg border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {unit.plant}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold">
                        {unit.name}
                      </h2>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
                    {unit.signal}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <span className="rounded-lg border border-border bg-background p-3">
                      <span className="block text-muted-foreground">Last</span>
                      <span className="mt-1 block font-semibold">
                        {formatDateOnly(unit.lastInspection)}
                      </span>
                    </span>
                    <span className="rounded-lg border border-border bg-background p-3">
                      <span className="block text-muted-foreground">
                        Issues
                      </span>
                      <span className="mt-1 block font-semibold">
                        {openIssues}
                      </span>
                    </span>
                    <span className="rounded-lg border border-border bg-background p-3">
                      <span className="block text-muted-foreground">
                        Checks
                      </span>
                      <span className="mt-1 block font-semibold">
                        {unitReports.length}
                      </span>
                    </span>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 font-medium text-primary">
                    Open unit
                    <ChevronRight
                      className="size-4 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}
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
  onLogout,
}: {
  user: User;
  view: View;
  currentUnit: Unit;
  authorizedUnits: Unit[];
  children: React.ReactNode;
  onNavigate: (view: View) => void;
  onChangeUnit: () => void;
  onLogout: () => void;
}) {
  return (
    <main className="industrial-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                NAJAR
              </p>
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                Industrial Intelligence
              </h1>
            </div>
          </div>

          <nav
            className="flex gap-2 overflow-x-auto pb-1 lg:justify-center lg:pb-0"
            aria-label="Authenticated navigation"
          >
            {navItems
              .filter((item) => item.view !== 'admin' || user.role === 'Admin')
              .map((item) => {
                const Icon = item.icon;
                const active = view === item.view;

                return (
                  <Button
                    key={item.view}
                    variant={active ? 'default' : 'ghost'}
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="outline"
              className="h-9 justify-start px-3"
              onClick={onChangeUnit}
            >
              <Gauge className="size-4" aria-hidden="true" />
              {currentUnit.name}
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <UserRound className="size-4 text-muted-foreground" />
              <span className="max-w-32 truncate">{user.name}</span>
              <Badge variant="outline" className="rounded-full">
                {user.role}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1540px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {authorizedUnits.length > 1 && (
          <p className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Current unit context:{' '}
            <b className="text-foreground">{currentUnit.name}</b>. Reports,
            analytics, and inspection actions are filtered to the units assigned
            to {user.name}.
          </p>
        )}
        {children}
      </div>
    </main>
  );
}

function UnitSignal({ status }: { status: Status }) {
  const meta = statusMeta[status];

  return (
    <div className="relative min-h-72 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-white">
      <div className="absolute inset-0 plant-grid opacity-45" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Unit condition
            </p>
            <h2 className="mt-2 text-4xl font-semibold">{status}</h2>
          </div>
          <span className={`size-4 rounded-full ${meta.ring}`} />
        </div>
        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <Flame className="size-7 text-amber-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-white/60">Thermal loop</p>
            <p className="mt-1 text-2xl font-semibold">8.1 bar</p>
          </div>
          <div className="h-1 w-20 rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300" />
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-right">
            <Droplets
              className="ml-auto size-7 text-cyan-300"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-white/60">Water quality</p>
            <p className="mt-1 text-2xl font-semibold">138 ppm</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm leading-6 text-white/70">
            This unit can keep running while water-quality drift remains visible
            in the shift review queue.
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentReportItem({
  report,
  onOpen,
}: {
  report: Report;
  onOpen: () => void;
}) {
  const equipment = getEquipment(report.equipmentId);
  const unit = getUnit(report.unitId);
  const EquipmentIcon = equipment.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md md:grid-cols-[auto_1fr_auto]"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-lg bg-gradient-to-br ${equipment.accent} text-zinc-950`}
      >
        <EquipmentIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {equipment.name} - {unit.name}
          </span>
          <StatusBadge status={report.status} />
        </span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">
          {report.reportNo} - {formatDateTime(report.inspectedAt)} -{' '}
          {report.operator}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          Severity: {report.severity}
        </span>
      </span>
      <span className="flex items-center gap-2 text-sm font-medium text-primary">
        Open report
        <ChevronRight
          className="size-4 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

function UnitHome({
  unit,
  reports,
  onNewCheck,
  onOpenReport,
  onReports,
}: {
  unit: Unit;
  reports: Report[];
  onNewCheck: () => void;
  onOpenReport: (report: Report) => void;
  onReports: () => void;
}) {
  const unitReports = reports.filter((report) => report.unitId === unit.id);
  const recentReports = unitReports.slice(0, 5);
  const status = deriveUnitStatus(unitReports, unit.status);
  const criticalCount = unitReports.filter(
    (report) => report.status === 'Critical',
  ).length;
  const attentionCount = unitReports.filter(
    (report) => report.status === 'Attention',
  ).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid gap-5">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <Badge
                variant="outline"
                className="h-6 rounded-full border-border bg-background px-2.5"
              >
                {unit.shiftOwner}
              </Badge>
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">
              {unit.name}
            </h2>
            <p className="mt-2 text-lg font-medium text-muted-foreground">
              {unit.line}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              {unit.signal}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  Last inspection
                </p>
                <p className="mt-2 font-semibold">
                  {formatDateTime(unit.lastInspection)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Open issues</p>
                <p className="mt-2 text-2xl font-semibold">
                  {criticalCount + attentionCount}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  Recent reports
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {unitReports.length}
                </p>
              </div>
            </div>
          </div>

          <UnitSignal status={status} />
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Recent History
              </p>
              <h2 className="text-2xl font-semibold">Last 5 reports</h2>
            </div>
            <Button variant="outline" onClick={onReports}>
              <FileText className="size-4" aria-hidden="true" />
              Browse Reports
            </Button>
          </div>

          <div className="grid gap-3">
            {recentReports.length === 0 ? (
              <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                <ClipboardCheck className="mx-auto size-10 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">
                  {unit.name} has no inspection history
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start its first equipment check to create the operating
                  record.
                </p>
                <Button className="mt-5" onClick={onNewCheck}>
                  <Plus className="size-4" aria-hidden="true" />
                  Start New Check
                </Button>
              </section>
            ) : (
              recentReports.map((report) => (
                <RecentReportItem
                  key={report.id}
                  report={report}
                  onOpen={() => onOpenReport(report)}
                />
              ))
            )}
          </div>
        </section>
      </section>

      <aside className="grid gap-4 self-start">
        <section className="rounded-lg border border-primary/30 bg-primary p-5 text-primary-foreground shadow-lg">
          <p className="text-sm font-medium text-primary-foreground/75">
            Next action
          </p>
          <h2 className="mt-2 text-3xl font-semibold">New Check</h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
            Open the equipment selection surface for {unit.name} and generate a
            stored report from the result.
          </p>
          <Button
            className="mt-5 h-11 w-full bg-white text-zinc-950 hover:bg-white/90"
            onClick={onNewCheck}
          >
            <Plus className="size-4" aria-hidden="true" />
            Start New Check
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Equipment state
          </p>
          <div className="mt-4 grid gap-3">
            {equipmentCatalog.map((equipment) => {
              const latest = unitReports.find(
                (report) => report.equipmentId === equipment.id,
              );
              const Icon = equipment.icon;

              return (
                <div
                  key={equipment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ${equipment.accent} text-zinc-950`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-medium">{equipment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {latest
                          ? formatDateOnly(latest.inspectedAt)
                          : 'No report yet'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={latest?.status ?? 'Pending'} />
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}

function NewCheckView({
  unit,
  reports,
  onSelectEquipment,
}: {
  unit: Unit;
  reports: Report[];
  onSelectEquipment: (equipment: Equipment) => void;
}) {
  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
        <Badge
          variant="outline"
          className="h-7 rounded-full border-cyan-200 bg-cyan-50 px-3 text-cyan-900"
        >
          {unit.name}
        </Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-normal">
          What are you inspecting?
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Choose the equipment category. Each card opens the configured check
          flow for that equipment and keeps the resulting report attached to{' '}
          {unit.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {equipmentCatalog.map((equipment) => {
          const latest = reports.find(
            (report) =>
              report.unitId === unit.id && report.equipmentId === equipment.id,
          );
          const Icon = equipment.icon;

          return (
            <button
              key={equipment.id}
              type="button"
              onClick={() => onSelectEquipment(equipment)}
              className="group min-h-80 overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <span
                className={`block h-28 bg-gradient-to-br ${equipment.accent} p-5 text-zinc-950`}
              >
                <Icon className="size-12" aria-hidden="true" />
              </span>
              <span className="block p-5">
                <span className="text-sm font-medium text-muted-foreground">
                  {equipment.inspectionContext}
                </span>
                <span className="mt-2 block text-3xl font-semibold">
                  {equipment.name}
                </span>
                <span className="mt-3 block min-h-14 text-sm leading-6 text-muted-foreground">
                  {equipment.summary}
                </span>
                <span className="mt-5 flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-xs text-muted-foreground">
                      Last inspection
                    </span>
                    <span className="mt-1 block font-medium">
                      {latest ? formatDateOnly(latest.inspectedAt) : 'Pending'}
                    </span>
                  </span>
                  <StatusBadge status={latest?.status ?? 'Pending'} />
                </span>
                <span className="mt-6 inline-flex items-center gap-2 font-medium text-primary">
                  Open check
                  <ChevronRight
                    className="size-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: InspectionField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = `inspection-field-${field.key}`;

  return (
    <label
      className="rounded-lg border border-border bg-background p-4"
      htmlFor={inputId}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-medium">{field.label}</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Operating band: {field.ideal} {field.unit}
          </span>
        </span>
        <Thermometer
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
      <Input
        id={inputId}
        className="mt-4 h-10"
        inputMode="decimal"
        value={value}
        placeholder={`Enter ${field.unit}`}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SegmentedBoolean({
  label,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  label: string;
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-medium">{label}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${
            value
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-border bg-card hover:bg-muted'
          }`}
        >
          <Check className="size-4" aria-hidden="true" />
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${
            !value
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-border bg-card hover:bg-muted'
          }`}
        >
          <CircleAlert className="size-4" aria-hidden="true" />
          {falseLabel}
        </button>
      </div>
    </div>
  );
}

function InspectionView({
  unit,
  equipment,
  form,
  step,
  error,
  isGenerating,
  onBack,
  onStep,
  onChangeForm,
  onGenerate,
}: {
  unit: Unit;
  equipment: Equipment;
  form: InspectionFormState;
  step: number;
  error: string;
  isGenerating: boolean;
  onBack: () => void;
  onStep: (step: number) => void;
  onChangeForm: (form: InspectionFormState) => void;
  onGenerate: () => void;
}) {
  const progress = Math.round(((step + 1) / inspectionSteps.length) * 100);

  if (isGenerating) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-7 animate-pulse" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold">
            Generating inspection result
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The entered values are being evaluated against the configured
            operating bands for {equipment.name}. The report record will be
            created from the result.
          </p>
          <Progress value={72} className="mt-6">
            <ProgressLabel>Result generation</ProgressLabel>
            <span className="ml-auto text-sm text-muted-foreground">72%</span>
          </Progress>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onGenerate();
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button variant="ghost" className="mb-4" onClick={onBack}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Equipment
            </Button>
            <p className="text-sm font-medium text-muted-foreground">
              {unit.name} - {equipment.name}
            </p>
            <h2 className="mt-2 text-4xl font-semibold tracking-normal">
              {inspectionSteps[step]}
            </h2>
          </div>
          <StatusBadge status="Pending" />
        </div>

        <Progress value={progress} className="mt-6">
          <ProgressLabel>Inspection progress</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground">
            {progress}%
          </span>
        </Progress>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {inspectionSteps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onStep(index)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                step === index
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className="block text-xs">{index + 1}</span>
              <span className="mt-1 block font-medium">{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            We could not generate this inspection result. {error} Your entered
            data is still preserved.
          </div>
        )}

        <div className="mt-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5" htmlFor="operator-name">
                <span className="text-sm font-medium">Operator</span>
                <Input
                  id="operator-name"
                  className="h-10"
                  value={form.operator}
                  placeholder="Operator name"
                  onChange={(event) =>
                    onChangeForm({ ...form, operator: event.target.value })
                  }
                />
              </label>
              <label className="space-y-1.5" htmlFor="equipment-id">
                <span className="text-sm font-medium">Equipment</span>
                <Input
                  id="equipment-id"
                  className="h-10"
                  value={`${equipment.name} - configured check`}
                  readOnly
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {equipment.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={(value) =>
                    onChangeForm({ ...form, [field.key]: value })
                  }
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <SegmentedBoolean
                label="Safety interlocks confirmed"
                value={form.safetyInterlocks}
                trueLabel="Confirmed"
                falseLabel="Not Confirmed"
                onChange={(value) =>
                  onChangeForm({ ...form, safetyInterlocks: value })
                }
              />
              <SegmentedBoolean
                label="Leak or abnormal release observed"
                value={!form.leakObserved}
                trueLabel="No Leak"
                falseLabel="Leak Seen"
                onChange={(value) =>
                  onChangeForm({ ...form, leakObserved: !value })
                }
              />
            </div>
          )}

          {step === 3 && (
            <label className="block space-y-1.5" htmlFor="inspection-notes">
              <span className="text-sm font-medium">Operator observation</span>
              <Textarea
                id="inspection-notes"
                className="min-h-36"
                value={form.notes}
                placeholder="Add shift observation, abnormal sound, corrective action, or supervisor handoff note."
                onChange={(event) =>
                  onChangeForm({ ...form, notes: event.target.value })
                }
              />
            </label>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <section className="rounded-lg border border-border bg-background p-4">
                <h3 className="font-semibold">Ready to evaluate</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {equipment.name} in {unit.name} will be evaluated against{' '}
                  {equipment.fields.length} configured operating parameters,
                  safety confirmation, and operator observation.
                </p>
              </section>
              <div className="grid gap-3 sm:grid-cols-3">
                {equipment.fields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {form[field.key] || '-'} {field.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => onStep(Math.max(0, step - 1))}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          {step < inspectionSteps.length - 1 ? (
            <Button
              type="button"
              onClick={() =>
                onStep(Math.min(inspectionSteps.length - 1, step + 1))
              }
            >
              Continue
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit">
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Generate Result
            </Button>
          )}
        </div>
      </form>

      <aside className="grid gap-4 self-start">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Check context
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`flex size-11 items-center justify-center rounded-lg bg-gradient-to-br ${equipment.accent} text-zinc-950`}
            >
              <equipment.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{equipment.name}</p>
              <p className="text-sm text-muted-foreground">{unit.name}</p>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Required groups
          </p>
          <div className="mt-4 grid gap-2">
            {inspectionSteps.map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                    index <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}

function ResultView({
  report,
  onNewCheck,
  onReports,
  onExport,
}: {
  report: Report | null;
  onNewCheck: () => void;
  onReports: () => void;
  onExport: (report: Report) => void;
}) {
  if (!report) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <FileText className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">
          No result is selected
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a recent report or complete a new inspection to view a result.
        </p>
        <Button className="mt-5" onClick={onNewCheck}>
          <Plus className="size-4" aria-hidden="true" />
          New Check
        </Button>
      </section>
    );
  }

  const meta = statusMeta[report.status];
  const Icon = meta.icon;
  const equipment = getEquipment(report.equipmentId);
  const unit = getUnit(report.unitId);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className={`border-b border-border p-6 ${meta.panel}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Overall Outcome</p>
              <h2 className="mt-2 text-5xl font-semibold tracking-normal">
                {report.status}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7">
                {report.summary}
              </p>
            </div>
            <span className="flex size-16 items-center justify-center rounded-lg bg-white/70">
              <Icon className="size-9" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <section>
            <h3 className="text-xl font-semibold">Why this result appeared</h3>
            <div className="mt-4 grid gap-3">
              {report.failedChecks.length === 0 &&
              report.warnings.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  All configured checks are inside operating limits.
                </div>
              ) : (
                [...report.failedChecks, ...report.warnings].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <p className="font-medium">{item}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Key parameters</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {report.parameters.map((parameter) => (
                <div
                  key={parameter.label}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <StatusBadge status={parameter.condition} />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {parameter.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {parameter.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Recommendations</h3>
            <div className="mt-4 grid gap-3">
              {report.recommendations.map((recommendation) => (
                <div
                  key={recommendation}
                  className="flex gap-3 rounded-lg border border-border bg-background p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="grid gap-4 self-start">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Stored report
          </p>
          <h3 className="mt-2 text-xl font-semibold">{report.reportNo}</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{unit.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Equipment</span>
              <span className="font-medium">{equipment.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Operator</span>
              <span className="font-medium">{report.operator}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Generated</span>
              <span className="font-medium">
                {formatDateTime(report.inspectedAt)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Report actions
          </p>
          <div className="mt-4 grid gap-2">
            <Button onClick={onNewCheck}>
              <Plus className="size-4" aria-hidden="true" />
              New Check
            </Button>
            <Button variant="outline" onClick={onReports}>
              <FileText className="size-4" aria-hidden="true" />
              Open Reports
            </Button>
            <Button variant="outline" onClick={() => onExport(report)}>
              <Download className="size-4" aria-hidden="true" />
              Single PDF
            </Button>
          </div>
        </section>
      </aside>
    </section>
  );
}

function ReportsView({
  filters,
  reports,
  authorizedUnits,
  onFilter,
  onOpenReport,
  onExport,
  onNewCheck,
}: {
  filters: Filters;
  reports: Report[];
  authorizedUnits: Unit[];
  onFilter: (filters: Filters) => void;
  onOpenReport: (report: Report) => void;
  onExport: (title: string, reportSet: Report[], filename: string) => void;
  onNewCheck: () => void;
}) {
  const operators = Array.from(new Set(reports.map((report) => report.operator)));
  const range = dateRangeForPreset(filters);
  const rangeLabel = `${formatDateOnly(range.from)} to ${formatDateOnly(
    range.to,
  )}`;

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Operational record
            </p>
            <h2 className="mt-2 text-4xl font-semibold tracking-normal">
              Reports
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse inspection records by unit, equipment, status, operator,
              and reporting period.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              onClick={() =>
                onExport('Daily Report', reports, 'najar-daily-report.pdf')
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Daily PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onExport('Weekly Report', reports, 'najar-weekly-report.pdf')
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Weekly PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onExport('Custom Report', reports, 'najar-custom-report.pdf')
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Custom PDF
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Unit</span>
            <NativeSelect
              className="w-full"
              value={filters.unitId}
              onChange={(event) =>
                onFilter({ ...filters, unitId: event.target.value })
              }
            >
              <NativeSelectOption value="all">All assigned</NativeSelectOption>
              {authorizedUnits.map((unit) => (
                <NativeSelectOption key={unit.id} value={unit.id}>
                  {unit.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Equipment</span>
            <NativeSelect
              className="w-full"
              value={filters.equipmentId}
              onChange={(event) =>
                onFilter({ ...filters, equipmentId: event.target.value })
              }
            >
              <NativeSelectOption value="all">All equipment</NativeSelectOption>
              {equipmentCatalog.map((equipment) => (
                <NativeSelectOption key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <NativeSelect
              className="w-full"
              value={filters.status}
              onChange={(event) =>
                onFilter({ ...filters, status: event.target.value })
              }
            >
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              {Object.keys(statusMeta).map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {status}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Operator</span>
            <NativeSelect
              className="w-full"
              value={filters.operator}
              onChange={(event) =>
                onFilter({ ...filters, operator: event.target.value })
              }
            >
              <NativeSelectOption value="all">All operators</NativeSelectOption>
              {operators.map((operator) => (
                <NativeSelectOption key={operator} value={operator}>
                  {operator}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Period</span>
            <NativeSelect
              className="w-full"
              value={filters.preset}
              onChange={(event) =>
                onFilter({
                  ...filters,
                  preset: event.target.value as DatePreset,
                })
              }
            >
              {datePresets.map((preset) => (
                <NativeSelectOption key={preset.id} value={preset.id}>
                  {preset.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>

          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <span className="block text-muted-foreground">Range</span>
            <span className="mt-1 block font-medium">{rangeLabel}</span>
          </div>
        </div>

        {filters.preset === 'custom' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5" htmlFor="from-date">
              <span className="text-sm font-medium">From Date</span>
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
              <span className="text-sm font-medium">To Date</span>
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
        )}
      </div>

      <div className="grid gap-3">
        {reports.length === 0 ? (
          <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-sm">
            <FileText className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">
              No reports in this period
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start a new equipment check or widen the date range.
            </p>
            <Button className="mt-5" onClick={onNewCheck}>
              <Plus className="size-4" aria-hidden="true" />
              Start New Check
            </Button>
          </section>
        ) : (
          reports.map((report) => (
            <RecentReportItem
              key={report.id}
              report={report}
              onOpen={() => onOpenReport(report)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AnalyticsView({
  reports,
  authorizedUnits,
}: {
  reports: Report[];
  authorizedUnits: Unit[];
}) {
  const statusCounts = (Object.keys(statusMeta) as Status[]).map((status) => ({
    status,
    count: reports.filter((report) => report.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((item) => item.count));
  const lastSevenDays = Array.from({ length: 7 }).map((_, index) => {
    const date = daysAgo(6 - index);
    const dateLabel = toDateInput(date);
    return {
      label: date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      }),
      count: reports.filter(
        (report) => report.inspectedAt.slice(0, 10) === dateLabel,
      ).length,
    };
  });
  const maxDailyCount = Math.max(1, ...lastSevenDays.map((day) => day.count));
  const equipmentIssueCounts = equipmentCatalog.map((equipment) => ({
    equipment,
    count: reports.filter(
      (report) =>
        report.equipmentId === equipment.id &&
        (report.status === 'Attention' || report.status === 'Critical'),
    ).length,
  }));
  const topIssue = equipmentIssueCounts.reduce((current, next) =>
    next.count > current.count ? next : current,
  );
  const criticalCount = reports.filter(
    (report) => report.status === 'Critical',
  ).length;

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">Analysis</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-normal">
          What the reports are telling us
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          These views consume the same report records created by inspection
          results across {authorizedUnits.map((unit) => unit.name).join(', ')}.
        </p>
      </div>

      {reports.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-sm">
          <BarChart3 className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">
            No analytics available yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Analytics will appear after inspection reports exist for assigned
            units.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inspection volume
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  Last 7 days
                </h3>
              </div>
              <Badge variant="outline" className="rounded-full">
                {reports.length} records
              </Badge>
            </div>
            <div className="mt-6 grid h-72 grid-cols-7 items-end gap-3">
              {lastSevenDays.map((day) => (
                <div key={day.label} className="grid h-full items-end gap-2">
                  <div
                    className="rounded-t-lg bg-gradient-to-t from-primary to-emerald-300"
                    style={{
                      height: `${Math.max(
                        8,
                        (day.count / maxDailyCount) * 100,
                      )}%`,
                    }}
                    aria-label={`${day.count} inspections on ${day.label}`}
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    {day.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Status ratio
              </p>
              <div className="mt-4 grid gap-3">
                {statusCounts.map((item) => (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{item.status}</span>
                      <span className="text-muted-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${statusMeta[item.status].ring}`}
                        style={{
                          width: `${(item.count / maxStatusCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Current insight
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                {criticalCount > 0
                  ? `${criticalCount} critical report requires review`
                  : `${topIssue.equipment.name} has ${topIssue.count} open issue${
                      topIssue.count === 1 ? '' : 's'
                    }`}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This statement is calculated from stored reports, not a
                decorative chart annotation.
              </p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function AdminView({
  user,
  users,
  onToggleAssignment,
}: {
  user: User;
  users: User[];
  onToggleAssignment: (userId: string, unitId: string) => void;
}) {
  if (user.role !== 'Admin') {
    return (
      <section className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">
          Admin access is required
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Unit assignments and role management are visible only to
          administrators.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h2 className="mt-2 text-4xl font-semibold tracking-normal">
          Access topology
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Assign users to units from one central model so unit context, reports,
          analytics, and inspection entry share the same access map.
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid min-w-[760px] grid-cols-[220px_150px_repeat(3,1fr)] border-b border-border bg-muted/60 p-3 text-sm font-semibold">
          <span>User</span>
          <span>Role</span>
          {units.map((unit) => (
            <span key={unit.id}>{unit.name}</span>
          ))}
        </div>
        <div className="min-w-[760px] divide-y divide-border">
          {users.map((managedUser) => (
            <div
              key={managedUser.id}
              className="grid grid-cols-[220px_150px_repeat(3,1fr)] items-center gap-0 p-3 text-sm"
            >
              <div>
                <p className="font-semibold">{managedUser.name}</p>
                <p className="text-muted-foreground">{managedUser.email}</p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {managedUser.role}
              </Badge>
              {units.map((unit) => {
                const assigned = managedUser.assignedUnitIds.includes(unit.id);

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => onToggleAssignment(managedUser.id, unit.id)}
                    className={`mr-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 font-medium transition ${
                      assigned
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {assigned ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <CircleAlert className="size-4" aria-hidden="true" />
                    )}
                    {assigned ? 'Assigned' : 'No access'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {equipmentCatalog.map((equipment) => {
          const Icon = equipment.icon;

          return (
            <article
              key={equipment.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <span
                className={`flex size-11 items-center justify-center rounded-lg bg-gradient-to-br ${equipment.accent} text-zinc-950`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{equipment.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {equipment.fields.length} configured operating parameters
              </p>
            </article>
          );
        })}
      </section>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [users, setUsers] = useState(initialUsers);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState('supervisor-1');
  const [selectedUnitId, setSelectedUnitId] = useState('unit-1');
  const [reports, setReports] = useState(initialReports);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [inspectionStep, setInspectionStep] = useState(0);
  const [inspectionForm, setInspectionForm] = useState<InspectionFormState>(
    defaultInspectionForm,
  );
  const [inspectionError, setInspectionError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<Report | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [pdfMessage, setPdfMessage] = useState('');

  const sessionUser = users.find((user) => user.id === sessionUserId) ?? null;
  const authorizedUnits = useMemo(() => {
    if (!sessionUser) {
      return [];
    }

    return units.filter((unit) => sessionUser.assignedUnitIds.includes(unit.id));
  }, [sessionUser]);
  const authorizedUnitIds = authorizedUnits.map((unit) => unit.id);
  const currentUnit =
    authorizedUnits.find((unit) => unit.id === selectedUnitId) ??
    authorizedUnits[0] ??
    units[0];
  const authorizedReports = reports.filter((report) =>
    authorizedUnitIds.includes(report.unitId),
  );
  const filteredReports = filterReports(reports, filters, authorizedUnitIds);

  function handleLogin(event: FormSubmitEvent) {
    event.preventDefault();
    const user = users.find((candidate) => candidate.id === selectedProfile);

    if (!user) {
      return;
    }

    setSessionUserId(user.id);
    const assignedUnits = units.filter((unit) =>
      user.assignedUnitIds.includes(unit.id),
    );

    if (assignedUnits.length === 1) {
      setSelectedUnitId(assignedUnits[0].id);
      setView('overview');
    } else {
      setView('unitSelect');
    }
  }

  function handleLogout() {
    setSessionUserId(null);
    setLastResult(null);
    setSelectedEquipment(null);
    setView('landing');
  }

  function openReport(report: Report) {
    setLastResult(report);
    setView('result');
  }

  function startEquipmentCheck(equipment: Equipment) {
    setSelectedEquipment(equipment);
    setInspectionStep(0);
    setInspectionError('');
    setInspectionForm({
      ...defaultInspectionForm,
      operator: sessionUser?.name ?? '',
    });
    setView('inspection');
  }

  function generateResult() {
    if (!selectedEquipment) {
      return;
    }

    if (!inspectionForm.operator.trim()) {
      setInspectionError('Operator name is required.');
      setInspectionStep(0);
      return;
    }

    const missingField = selectedEquipment.fields.find(
      (field) => parseField(inspectionForm[field.key]) === null,
    );

    if (missingField) {
      setInspectionError(`${missingField.label} must be entered as a number.`);
      setInspectionStep(1);
      return;
    }

    setInspectionError('');
    setIsGenerating(true);

    window.setTimeout(() => {
      const result = evaluateInspection(selectedEquipment, inspectionForm);
      const nextIndex = reports.length + 1001;
      const timestamp = new Date(today);
      timestamp.setMinutes(today.getMinutes() + reports.length + 1);
      const report: Report = {
        id: `r-${nextIndex}`,
        reportNo: `NJR-${currentUnit.name.replace(' ', '')}-${toDateInput(
          today,
        ).replace(/-/g, '')}-${selectedEquipment.id.toUpperCase().slice(0, 3)}`,
        unitId: currentUnit.id,
        equipmentId: selectedEquipment.id,
        inspectedAt: timestamp.toISOString(),
        status: result.status,
        operator: inspectionForm.operator.trim(),
        severity: result.severity,
        summary: result.summary,
        parameters: result.parameters,
        failedChecks: result.failedChecks,
        warnings: result.warnings,
        recommendations: result.recommendations,
      };

      setReports((current) => [report, ...current]);
      setLastResult(report);
      setIsGenerating(false);
      setView('result');
    }, 850);
  }

  function exportSingleReport(report: Report) {
    const ok = downloadPdf(
      'Single Inspection Report',
      [report],
      `${report.reportNo}.pdf`.toLowerCase(),
      formatDateOnly(report.inspectedAt),
    );
    setPdfMessage(
      ok
        ? 'PDF report generated from stored inspection data.'
        : 'No report data is available for export.',
    );
  }

  function exportReportSet(title: string, reportSet: Report[], filename: string) {
    const range = dateRangeForPreset(filters);
    const ok = downloadPdf(
      title,
      reportSet,
      filename,
      `${formatDateOnly(range.from)} to ${formatDateOnly(range.to)}`,
    );
    setPdfMessage(
      ok
        ? `${title} generated from ${reportSet.length} stored report records.`
        : 'No report data is available for export.',
    );
  }

  function toggleAssignment(userId: string, unitId: string) {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        const assigned = user.assignedUnitIds.includes(unitId);
        const nextAssignments = assigned
          ? user.assignedUnitIds.filter((id) => id !== unitId)
          : [...user.assignedUnitIds, unitId];

        return {
          ...user,
          assignedUnitIds: nextAssignments,
        };
      }),
    );
  }

  if (!sessionUser) {
    if (view === 'login') {
      return (
        <LoginScreen
          users={users}
          selectedProfile={selectedProfile}
          onSelectProfile={setSelectedProfile}
          onSubmit={handleLogin}
          onBack={() => setView('landing')}
        />
      );
    }

    return <LandingScreen onLogin={() => setView('login')} />;
  }

  if (view === 'unitSelect') {
    return (
      <UnitSelectionScreen
        user={sessionUser}
        authorizedUnits={authorizedUnits}
        reports={reports}
        onSelectUnit={(unitId) => {
          setSelectedUnitId(unitId);
          setView('overview');
        }}
        onLogout={handleLogout}
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
        setPdfMessage('');
        setView(nextView);
      }}
      onChangeUnit={() => setView('unitSelect')}
      onLogout={handleLogout}
    >
      {pdfMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {pdfMessage}
        </div>
      )}

      {view === 'overview' && (
        <UnitHome
          unit={currentUnit}
          reports={reports}
          onNewCheck={() => setView('newCheck')}
          onOpenReport={openReport}
          onReports={() => setView('reports')}
        />
      )}

      {view === 'newCheck' && (
        <NewCheckView
          unit={currentUnit}
          reports={reports}
          onSelectEquipment={startEquipmentCheck}
        />
      )}

      {view === 'inspection' && selectedEquipment && (
        <InspectionView
          unit={currentUnit}
          equipment={selectedEquipment}
          form={inspectionForm}
          step={inspectionStep}
          error={inspectionError}
          isGenerating={isGenerating}
          onBack={() => setView('newCheck')}
          onStep={setInspectionStep}
          onChangeForm={setInspectionForm}
          onGenerate={generateResult}
        />
      )}

      {view === 'result' && (
        <ResultView
          report={lastResult}
          onNewCheck={() => setView('newCheck')}
          onReports={() => setView('reports')}
          onExport={exportSingleReport}
        />
      )}

      {view === 'reports' && (
        <ReportsView
          filters={filters}
          reports={filteredReports}
          authorizedUnits={authorizedUnits}
          onFilter={setFilters}
          onOpenReport={openReport}
          onExport={exportReportSet}
          onNewCheck={() => setView('newCheck')}
        />
      )}

      {view === 'analytics' && (
        <AnalyticsView
          reports={authorizedReports}
          authorizedUnits={authorizedUnits}
        />
      )}

      {view === 'admin' && (
        <AdminView
          user={sessionUser}
          users={users}
          onToggleAssignment={toggleAssignment}
        />
      )}
    </AppShell>
  );
}
