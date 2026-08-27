'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import { useDashboardData } from '../components/DashboardDataProvider';
import type { PortfolioProject } from '../portfolioData';
import type { FlashReport } from '../flashReports';

type FlashMap = Record<string, FlashReport[]>;
const normal = (value: unknown) => String(value ?? '').trim();
const key = (value: unknown) => normal(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const dateText = (value: unknown) => { if (typeof value === 'number') { const date = XLSX.SSF.parse_date_code(value); return date ? new Date(date.y, date.m - 1, date.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; } const parsed = new Date(normal(value)); return Number.isNaN(parsed.getTime()) ? normal(value) : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const value = (row: Record<string, unknown>, name: string) => row[key(name)] ?? '';
const readRows = async (file: File) => { const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; return (XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) ?? []).map(row => Object.fromEntries(Object.entries(row).map(([column, cell]) => [key(column), cell]))); };
const typeSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ReportsPage() {
  const projectInput = useRef<HTMLInputElement>(null); const flashInput = useRef<HTMLInputElement>(null);
  const { applySnapshot, snapshotDate, snapshots, restoreSnapshot } = useDashboardData();
  const [projectFile, setProjectFile] = useState<File | null>(null); const [flashFile, setFlashFile] = useState<File | null>(null); const [message, setMessage] = useState('Choose the two Excel files to import the next local snapshot.'); const [importing, setImporting] = useState(false);
  const importFiles = async () => {
    if (!projectFile || !flashFile) return setMessage('Choose both the project snapshot and the incremental Flash report file.');
    if (!/ip-oh-r-all/i.test(projectFile.name) || !/flashall/i.test(flashFile.name)) return setMessage('Use one IP-OH-R-All file and one FlashAll file.');
    setImporting(true);
    try {
      const [projectRows, flashRows] = await Promise.all([readRows(projectFile), readRows(flashFile)]);
      const requiredProjectFields = ['code', 'name', 'type', 'projectmanager', 'health', 'currentphase', 'targetend', 'status'];
      const requiredFlashFields = ['creationdate', 'origin', 'health', 'summary', 'highlights', 'issues', 'nextsteps'];
      const projectKeys = new Set(Object.keys(projectRows[0] ?? {})); const flashKeys = new Set(Object.keys(flashRows[0] ?? {}));
      if (!requiredProjectFields.every(field => projectKeys.has(field)) || !requiredFlashFields.every(field => flashKeys.has(field))) throw new Error('The selected files do not have the expected portfolio and Flash report columns.');
      const projects: PortfolioProject[] = projectRows.filter(row => normal(value(row, 'Name'))).map(row => { const type = normal(value(row, 'Type')) || 'Uncategorized'; return { code: normal(value(row, 'Code')), name: normal(value(row, 'Name')), type, typeSlug: typeSlug(type), owner: normal(value(row, 'Project manager')), unit: normal(value(row, 'Unit')), health: normal(value(row, 'Health')) || 'On track', trend: normal(value(row, 'Trend')), phase: normal(value(row, 'Current phase')), status: normal(value(row, 'Status')), priority: normal(value(row, 'Priority')), progress: Number(value(row, '% Complete')) || 0, target: dateText(value(row, 'Target end')) }; });
      if (!projects.length) throw new Error('No projects were found in the selected project snapshot.');
      const reports: FlashMap = {};
      flashRows.filter(row => normal(value(row, 'Origin'))).forEach(row => { const project = normal(value(row, 'Origin')); (reports[project] ??= []).push({ date: dateText(value(row, 'Creation date')), health: normal(value(row, 'Health')) || 'On track', complete: value(row, '% Complete') === '' ? null : Number(value(row, '% Complete')), summary: normal(value(row, 'Summary')), highlights: normal(value(row, 'Highlights')), issues: normal(value(row, 'Issues')), nextSteps: normal(value(row, 'Next steps')) }); });
      const fileDate = projectFile.name.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date().toISOString().slice(0, 10);
      const readableDate = new Date(`${fileDate}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      applySnapshot(projects, reports, readableDate);
      setMessage(`Imported ${projects.length} projects and ${flashRows.length} new Flash reports. Dashboard and change log now use the ${readableDate} local snapshot.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The files could not be imported.'); }
    finally { setImporting(false); }
  };
  return <main className="with-sidebar reports-page"><Sidebar /><div className="page-content">
    <header className="portfolio-top"><span>PMO / Data</span><span><Link href="/changes" className="back-link">View change log</Link> · <a href="https://iemfgcom.sharepoint.com/sites/IT-PMO/Shared%20Documents/PMO%20Dashboard%20Data" target="_blank" rel="noreferrer">Open SharePoint folder ↗</a></span></header>
    <section className="reports-hero"><div><p className="eyebrow">LOCAL DATA REFRESH</p><h1>Import portfolio source reports</h1><p>Current local snapshot: {snapshotDate}. Select the two files you downloaded from SharePoint.</p></div></section>
    <section className="reports-status import-status" aria-live="polite"><span className="status-dot good" /><div><strong>{importing ? 'Importing files…' : 'Local file import'}</strong><p>{message}</p></div></section>
    <section className="upload-grid"><label><span>1. Full project snapshot</span><strong>{projectFile?.name ?? 'Choose IP-OH-R-All.xlsx'}</strong><input ref={projectInput} type="file" accept=".xlsx" onChange={event => setProjectFile(event.target.files?.[0] ?? null)} /><button type="button" onClick={() => projectInput.current?.click()}>Choose project file</button></label><label><span>2. Incremental Flash reports</span><strong>{flashFile?.name ?? 'Choose FlashAll.xlsx'}</strong><input ref={flashInput} type="file" accept=".xlsx" onChange={event => setFlashFile(event.target.files?.[0] ?? null)} /><button type="button" onClick={() => flashInput.current?.click()}>Choose Flash file</button></label></section>
    <button className="check-files-button import-button" onClick={() => void importFiles()} disabled={importing || !projectFile || !flashFile}>{importing ? 'Importing…' : 'Import new snapshot'}</button>
    <p className="reports-note"><strong>Import rule:</strong> the IP-OH-R-All file replaces the current local project snapshot. FlashAll adds only new reports; existing Flash history is retained and duplicate project/date combinations are ignored.</p>
    <p className="reports-note"><strong>Local only:</strong> this import is saved in this browser on this computer. It does not change the SharePoint files.</p>
    <section className="snapshot-archive"><div><p className="eyebrow">LOCAL SNAPSHOT ARCHIVE</p><h2>Retained project snapshots</h2><p>Each import keeps the project snapshot that was active at that point. Restoring one changes the active project data on this computer.</p></div><div>{[...snapshots].reverse().map(snapshot => <article key={snapshot.date}><div><strong>{snapshot.date}</strong><small>{snapshot.projects.length} projects · {snapshot.importedAt === 'Baseline' ? 'Original baseline' : `Imported ${snapshot.importedAt}`}</small></div><button type="button" disabled={snapshot.date === snapshotDate} onClick={() => restoreSnapshot(snapshot.date)}>{snapshot.date === snapshotDate ? 'Current' : 'Restore'}</button></article>)}</div></section>
  </div></main>;
}
