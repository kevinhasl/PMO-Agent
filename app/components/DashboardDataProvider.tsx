'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { portfolioProjects as baselineProjects, type PortfolioProject } from '../portfolioData';
import { reportsByProject as baselineReports, type FlashReport } from '../flashReports';

export type ChangeRecord = { project: string; unit: string; projectType: string; field: string; previous: string; current: string; category: string; significant: boolean };
export type ProjectSnapshot = { date: string; importedAt: string; projects: PortfolioProject[]; changes: ChangeRecord[] };
type FlashMap = Record<string, FlashReport[]>;
type DashboardData = { projects: PortfolioProject[]; reportsByProject: FlashMap; changes: ChangeRecord[]; snapshotDate: string; snapshots: ProjectSnapshot[]; applySnapshot: (projects: PortfolioProject[], reports: FlashMap, snapshotDate: string) => void; restoreSnapshot: (date: string) => void; deleteSnapshot: (date: string) => void };
const storageKey = 'pmo-dashboard-local-data-v1';
const DataContext = createContext<DashboardData | null>(null);

function asDate(value: string) { const time = new Date(value).getTime(); return Number.isNaN(time) ? 0 : time; }
function mergeReports(current: FlashMap, incoming: FlashMap) {
  const result: FlashMap = { ...current };
  Object.entries(incoming).forEach(([project, reports]) => {
    const seen = new Set((result[project] ?? []).map(report => `${project}|${report.date}`));
    result[project] = [...(result[project] ?? []), ...reports.filter(report => !seen.has(`${project}|${report.date}`))].sort((a, b) => asDate(b.date) - asDate(a.date));
  });
  return result;
}
function compare(previous: PortfolioProject[], current: PortfolioProject[]) {
  const prior = new Map(previous.map(project => [project.code || project.name, project]));
  const fields: Array<[keyof PortfolioProject, string, string]> = [['health', 'Health', 'Health'], ['status', 'Status', 'Status'], ['phase', 'Current phase', 'Phase'], ['progress', 'Completion', 'Progress'], ['target', 'Target completion', 'Schedule'], ['owner', 'Project manager', 'Ownership'], ['unit', 'Business unit', 'Organization'], ['type', 'Project type', 'Organization']];
  return current.flatMap(project => {
    const old = prior.get(project.code || project.name);
    if (!old) return [{ project: project.name, unit: project.unit, projectType: project.type, field: 'Project added', previous: 'Not in prior snapshot', current: 'Added', category: 'Portfolio', significant: true }];
    return fields.filter(([key]) => String(old[key]) !== String(project[key])).map(([key, field, category]) => ({ project: project.name, unit: project.unit, projectType: project.type, field, previous: String(old[key]), current: String(project[key]), category, significant: key === 'health' || key === 'status' || key === 'target' }));
  });
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState(baselineProjects);
  const [reportsByProject, setReportsByProject] = useState<FlashMap>(baselineReports);
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [snapshotDate, setSnapshotDate] = useState('August 25, 2026');
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([{ date: 'August 25, 2026', importedAt: 'Baseline', projects: baselineProjects, changes: [] }]);
  useEffect(() => { const saved = window.localStorage.getItem(storageKey); if (!saved) return; try { const parsed = JSON.parse(saved); setProjects(parsed.projects ?? baselineProjects); setReportsByProject(parsed.reportsByProject ?? baselineReports); setChanges(parsed.changes ?? []); setSnapshotDate(parsed.snapshotDate ?? snapshotDate); setSnapshots(parsed.snapshots?.length ? parsed.snapshots : [{ date: 'August 25, 2026', importedAt: 'Baseline', projects: baselineProjects, changes: [] }]); } catch { window.localStorage.removeItem(storageKey); } }, []);
  const value = useMemo<DashboardData>(() => ({ projects, reportsByProject, changes, snapshotDate, snapshots, applySnapshot(nextProjects, incomingReports, nextSnapshotDate) { const nextReports = mergeReports(reportsByProject, incomingReports); const nextChanges = compare(projects, nextProjects); const nextSnapshots = [...snapshots.filter(snapshot => snapshot.date !== nextSnapshotDate), { date: nextSnapshotDate, importedAt: new Date().toLocaleString('en-US'), projects: nextProjects, changes: nextChanges }]; const saved = { projects: nextProjects, reportsByProject: nextReports, changes: nextChanges, snapshotDate: nextSnapshotDate, snapshots: nextSnapshots }; setProjects(nextProjects); setReportsByProject(nextReports); setChanges(nextChanges); setSnapshotDate(nextSnapshotDate); setSnapshots(nextSnapshots); window.localStorage.setItem(storageKey, JSON.stringify(saved)); }, restoreSnapshot(date) { const snapshot = snapshots.find(item => item.date === date); if (!snapshot) return; const saved = { projects: snapshot.projects, reportsByProject, changes: snapshot.changes, snapshotDate: snapshot.date, snapshots }; setProjects(snapshot.projects); setChanges(snapshot.changes); setSnapshotDate(snapshot.date); window.localStorage.setItem(storageKey, JSON.stringify(saved)); }, deleteSnapshot(date) { const snapshot = snapshots.find(item => item.date === date); if (!snapshot || snapshot.importedAt === 'Baseline') return; const nextSnapshots = snapshots.filter(item => item.date !== date); const nextActive = date === snapshotDate ? nextSnapshots[nextSnapshots.length - 1] : undefined; const saved = { projects: nextActive?.projects ?? projects, reportsByProject, changes: nextActive?.changes ?? changes, snapshotDate: nextActive?.date ?? snapshotDate, snapshots: nextSnapshots }; if (nextActive) { setProjects(nextActive.projects); setChanges(nextActive.changes); setSnapshotDate(nextActive.date); } setSnapshots(nextSnapshots); window.localStorage.setItem(storageKey, JSON.stringify(saved)); } }), [projects, reportsByProject, changes, snapshotDate, snapshots]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDashboardData() { const data = useContext(DataContext); if (!data) throw new Error('Dashboard data provider is missing.'); return data; }
