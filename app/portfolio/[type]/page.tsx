'use client';

import Link from 'next/link';
import { FormEvent, type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { type PortfolioProject } from '../../portfolioData';
import { type FlashReport } from '../../flashReports';
import Sidebar from '../../components/Sidebar';
import { useDashboardData } from '../../components/DashboardDataProvider';
import { discrepancyResponse } from '../../agentDiscrepancies';

function numberAgentItems(text: string) { let number = 0; return text.split('\n').map(line => { if (line.startsWith('• ')) return `${++number}. ${line.slice(2)}`; if (line.trim().endsWith(':')) number = 0; return line; }).join('\n'); }
async function copyAgentResponse(text: string) { await navigator.clipboard.writeText(text); }
function exportAgentResponseToWord(text: string) { const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#18252c;margin:42px}h1{color:#146e70;font-size:22px}p{font-size:11px;color:#69777d}.response{font-size:12pt;line-height:1.55}</style></head><body><h1>PMO Agent Response</h1><p>Generated from the PMO Dashboard</p><div class="response">${escaped}</div></body></html>`; const url = URL.createObjectURL(new Blob([documentHtml], { type: 'application/msword' })); const link = document.createElement('a'); link.href = url; link.download = 'PMO-Agent-Response.doc'; link.click(); URL.revokeObjectURL(url); }

const healthRank: Record<string, number> = { 'At risk': 0, 'Off track': 1, 'On track': 2 };
const targetWindow = (target: string) => { const date = new Date(target); const period = date.getDate() <= 10 ? 'Early' : date.getDate() <= 20 ? 'Mid' : 'Late'; return `${period} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]} ${date.getFullYear()}`; };
type SortKey = 'name' | 'health' | 'progress' | 'phase' | 'status';
type GroupedPortfolioPageProps = { groupBy?: 'type' | 'unit'; pathBase?: string; groupLabel?: string };
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function GroupedPortfolioPage({ groupBy = 'type', pathBase = '/portfolio', groupLabel = 'Project type' }: GroupedPortfolioPageProps) {
  const { projects: portfolioProjects, reportsByProject } = useDashboardData();
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [descending, setDescending] = useState(false);
  const [agentWidth, setAgentWidth] = useState(300);
  const [detailWidth, setDetailWidth] = useState(440);
  const [agentHeight, setAgentHeight] = useState(50);
  useEffect(() => {
    const beginResize = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const agentHandle = target.closest('.type-agent-width-resize');
      const detailHandle = target.closest('.type-detail-resize');
      if (!agentHandle && !detailHandle) return;
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = agentHandle ? agentWidth : detailWidth;
      const move = (pointerEvent: PointerEvent) => {
        const delta = pointerEvent.clientX - startX;
        if (agentHandle) setAgentWidth(Math.min(460, Math.max(220, startWidth + delta)));
        else setDetailWidth(Math.min(700, Math.max(300, startWidth - delta)));
      };
      const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop);
    };
    document.addEventListener('pointerdown', beginResize, true);
    return () => document.removeEventListener('pointerdown', beginResize, true);
  }, [agentWidth, detailWidth]);
  const groupValue = groupBy === 'type' ? params.type : params.unit;
  const projectItems = portfolioProjects.filter(project => groupBy === 'type' ? project.typeSlug === groupValue : slugify(project.unit) === groupValue);
  const requestedProject = searchParams.get('project');
  const [selected, setSelected] = useState<string | null>(() => projectItems.some(project => project.name === requestedProject) ? requestedProject : null);
  const projects = useMemo(() => [...projectItems].sort((a, b) => { const left = sortKey === 'health' ? healthRank[a.health] ?? 3 : a[sortKey]; const right = sortKey === 'health' ? healthRank[b.health] ?? 3 : b[sortKey]; const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right)); return (descending ? -1 : 1) * (result || a.name.localeCompare(b.name)); }), [projectItems, sortKey, descending]);
  const sortBy = (key: SortKey) => { if (key === sortKey) setDescending(value => !value); else { setSortKey(key); setDescending(false); } };
  const current = projects.find(project => project.name === selected);
  const reports = selected ? reportsByProject[selected] ?? [] : [];
  const title = projects[0]?.[groupBy] ?? groupLabel;

  return <main className="type-page"><header className="portfolio-top"><Link href={pathBase} className="back-link">← All {groupLabel.toLowerCase()}s</Link><span>PMO / {groupLabel} / {title}</span></header><section className="type-hero"><div><p className="eyebrow">{groupLabel.toUpperCase()}</p><h1>{title}</h1><p>{projects.length} initiatives in this {groupLabel.toLowerCase()}. Select a project to review its current details and its five most recent Flash reports.</p></div><div className="type-summary"><span>On track <b>{projects.filter(p => p.health === 'On track').length}</b></span><span>At risk <b>{projects.filter(p => p.health === 'At risk').length}</b></span><span>Off track <b>{projects.filter(p => p.health === 'Off track').length}</b></span></div></section><section className="type-workspace type-resizable" style={{ '--type-agent-width': `${agentWidth}px`, '--type-detail-width': `${detailWidth}px`, '--type-agent-height': `${agentHeight}vh` } as CSSProperties}><div className="all-projects"><div className="list-heading">{(['name', 'health', 'progress', 'phase', 'status'] as SortKey[]).map(key => <button key={key} onClick={() => sortBy(key)}>{key === 'name' ? 'Project' : key === 'phase' ? 'Current phase' : key[0].toUpperCase() + key.slice(1)} {sortKey === key ? (descending ? '↓' : '↑') : '↕'}</button>)}</div>{projects.map(project => <button key={project.code} onClick={() => setSelected(project.name)} className={`type-project-row ${selected === project.name ? 'selected-project' : ''}`}><div><strong>{project.name}</strong><small>{project.code} · {project.owner} · Target: {targetWindow(project.target)}</small></div><span className={`health-badge ${project.health === 'Off track' ? 'watch' : project.health === 'At risk' ? 'risk' : 'good'}`}>{project.health}</span><span className="inline-progress"><i style={{ width: `${project.progress}%` }} />{project.progress}%</span><span>{project.phase}</span><span>{project.status}</span></button>)}</div><div className="type-side"><TypeAgent title={title} projects={projectItems} onHeightChange={setAgentHeight} /><div className="type-agent-width-resize" role="separator" aria-orientation="vertical" aria-label="Resize PMO Agent" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); const move = (pointerEvent: PointerEvent) => setAgentWidth(Math.min(460, Math.max(220, pointerEvent.clientX - 34))); const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); }} /><div className="type-detail-resize" role="separator" aria-orientation="vertical" aria-label="Resize Flash report details" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); const move = (pointerEvent: PointerEvent) => setDetailWidth(Math.min(700, Math.max(300, window.innerWidth - pointerEvent.clientX))); const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); }} /><TypeDetail current={current} reports={reports} /></div></section></main>;
}

export default function TypePortfolioPageWithSidebar() {
  return <div className="with-sidebar"><Sidebar /><div className="page-content"><GroupedPortfolioPage /></div></div>;
}

function TypeDetail({ current, reports }: { current?: PortfolioProject; reports: FlashReport[] }) {
  if (!current) return <aside className="type-detail"><div className="select-project"><span>◫</span><strong>Select a project</strong><p>Choose any project to open its detail and Flash report history.</p></div></aside>;
  const summary = reports[0]?.summary?.trim() || 'None';
  return <aside className="type-detail type-history-panel"><div className="project-history"><header><div><p className="eyebrow">FLASH REPORT HISTORY</p><strong>{current.name}</strong><small>{current.owner} · {current.status} · {current.phase} · Target: {targetWindow(current.target)}</small></div></header>{reports.length ? <div className="history-scroll"><section className="project-flash-summary"><span>Project summary</span><p>{summary}</p></section>{reports.map((report, index) => <article className="report-card" key={`${report.date}-${index}`}><div className="report-head"><div><span className="report-sequence">{index === 0 ? 'LATEST' : `REPORT ${index + 1}`}</span><strong>{report.date}</strong></div><div><span className={`health-badge ${report.health === 'Off track' ? 'watch' : report.health === 'At risk' ? 'risk' : 'good'}`}>{report.health}</span><small>{report.complete ?? '—'}% complete</small></div></div><TypeReportField label="Highlights" text={report.highlights} /><TypeReportField label="Issues" text={report.issues} /><TypeReportField label="Next steps" text={report.nextSteps} /></article>)}</div> : <div className="empty-history"><span>◌</span><strong>No Flash reports on file</strong><p>This project has no matching report history in the August 25 Flash export.</p></div>}</div></aside>;
}

function TypeReportField({ label, text }: { label: string; text: string }) { return <div className="report-field"><span>{label}</span><p>{text?.trim() || 'None'}</p></div>; }

function getAgentResponse(prompt: string, title: string, projects: PortfolioProject[], reportsByProject: Record<string, FlashReport[]>) {
  const lower = prompt.toLowerCase();
  const latest = projects.map(project => ({ project, report: reportsByProject[project.name]?.[0] })).filter(item => item.report);
  const missing = projects.filter(project => !(reportsByProject[project.name]?.length));
  const requestedProject = projects.find(project => lower.includes(project.name.toLowerCase()));
  if (/(discrepanc|inconsisten|data quality|data (?:problem|issue|mismatch|error|check|validation)|bad data|overdue|past target|date.*past)/.test(lower)) return discrepancyResponse(projects, reportsByProject, new Date());
  if (requestedProject) { const report = reportsByProject[requestedProject.name]?.[0]; return `${requestedProject.name}:\n• Status: ${requestedProject.status}\n• Health: ${requestedProject.health}\n• Current phase: ${requestedProject.phase}\n• Owner: ${requestedProject.owner}\n• Priority: ${requestedProject.priority}\n• Progress: ${requestedProject.progress}%\n• Target completion: ${targetWindow(requestedProject.target)}${report ? `\n• Latest Flash report (${report.date}): ${report.summary || 'No summary provided.'}` : '\n• No Flash report is on file.'}`; }
  if (/(missing|no flash|without flash|report coverage)/.test(lower)) return missing.length ? `Missing Flash reports (${missing.length}):\n${missing.map(project => `• ${project.name}`).join('\n')}` : `All ${projects.length} ${title} projects have at least one Flash report on file.`;
  if (/(highlight|latest update|recent update)/.test(lower)) return latest.length ? `Latest highlights:\n${latest.slice(0, 5).map(({ project, report }) => `• ${project.name} — ${report?.highlights || report?.summary || 'No highlight provided.'}`).join('\n')}` : `No Flash reports are available for this project type.`;
  if (/\bissues?\b/.test(lower)) { const issues = latest.filter(({ report }) => report?.issues?.trim()); return issues.length ? `Latest Flash report issues:\n${issues.map(({ project, report }) => `• ${project.name} — ${report?.issues}`).join('\n')}` : `The latest Flash reports for these ${title} projects do not list any issues.`; }

  const statuses = ['On hold', 'In progress', 'Ready'].filter(value => lower.includes(value.toLowerCase()));
  const healthValues = ['At risk', 'Off track', 'On track'].filter(value => lower.includes(value.toLowerCase()));
  const phases = [...new Set(projects.map(project => project.phase))].filter(value => lower.includes(value.toLowerCase()));
  const priorities = [...new Set(projects.map(project => project.priority))].filter(value => lower.includes(value.toLowerCase()));
  const owners = [...new Set(projects.map(project => project.owner))].filter(value => lower.includes(value.toLowerCase()));
  const units = [...new Set(projects.map(project => project.unit))].filter(value => lower.includes(value.toLowerCase()));
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const month = months.find(value => lower.includes(value));
  const percent = lower.match(/(?:over|above|greater than|under|below|less than)\s+(\d{1,3})\s*%?/);
  const hasFilter = statuses.length || healthValues.length || phases.length || priorities.length || owners.length || units.length || month || percent;
  if (hasFilter) { let matches = projects.filter(project => (!statuses.length || statuses.includes(project.status)) && (!healthValues.length || healthValues.includes(project.health)) && (!phases.length || phases.includes(project.phase)) && (!priorities.length || priorities.includes(project.priority)) && (!owners.length || owners.includes(project.owner)) && (!units.length || units.includes(project.unit)) && (!month || new Date(project.target).getMonth() === months.indexOf(month)));
    if (percent) { const value = Number(percent[1]); const isMinimum = /(over|above|greater than)/.test(lower); matches = matches.filter(project => isMinimum ? project.progress > value : project.progress < value); }
    return matches.length ? `Matching projects (${matches.length}):\n${matches.map(project => `• ${project.name} — ${project.status}; ${project.health}; ${project.phase}; ${project.progress}% complete; target ${targetWindow(project.target)}`).join('\n')}` : `No ${title} projects match those criteria.`; }
  if (/(risk|at risk|off track)/.test(lower)) { const risky = projects.filter(project => project.health !== 'On track'); return risky.length ? `Projects needing attention:\n${risky.map(project => `• ${project.name} — ${project.health}; ${project.status}; ${project.phase}; ${project.progress}% complete`).join('\n')}` : `All ${projects.length} ${title} projects are currently on track.`; }
  return `${title} portfolio summary:\n• ${projects.length} total projects\n• ${projects.filter(project => project.health === 'On track').length} on track\n• ${projects.filter(project => project.health === 'At risk').length} at risk\n• ${projects.filter(project => project.health === 'Off track').length} off track\n\nAsk about status, health, phase, owner, priority, completion, target month, or Flash reports.`;
}

function TypeAgent({ title, projects, onHeightChange }: { title: string; projects: PortfolioProject[]; onHeightChange: (height: number) => void }) {
  const { reportsByProject, snapshotDate } = useDashboardData();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: `I’m focused on the ${title} portfolio. Ask about project status, health, phase, owner, priority, completion, target dates, or Flash reports.` }]);
  useEffect(() => { setMessages([{ role: 'assistant', text: `Current date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. I’m focused on the ${title} portfolio using the ${snapshotDate} snapshot. Ask about project status, health, phase, completion, target dates, or Flash reports.` }]); }, [title, snapshotDate]);
  const ask = (event: FormEvent) => { event.preventDefault(); const prompt = question.trim(); if (!prompt) return; const response = getAgentResponse(prompt, title, projects, reportsByProject);
    setMessages(current => [...current, { role: 'user', text: prompt }, { role: 'assistant', text: response }]); setQuestion(''); };
  return <aside className="type-agent" aria-label={`${title} PMO Agent`}><header><div><span className="copilot-icon">✦</span><div><strong>PMO Agent</strong><small>{title} portfolio</small></div></div></header><div className="type-agent-context"><span>Portfolio context</span><strong>{projects.length} {title} projects</strong><small>The agent uses only this project type.</small></div><div className="type-agent-chat">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><span>{message.role === 'assistant' ? '✦' : 'KH'}</span><div className="message-body"><p>{numberAgentItems(message.text)}</p>{message.role === 'assistant' && <div className="response-actions"><button type="button" onClick={() => void copyAgentResponse(numberAgentItems(message.text))}>Copy</button><button type="button" onClick={() => exportAgentResponseToWord(numberAgentItems(message.text))}>Export Word</button></div>}</div></div>)}</div><form onSubmit={ask}><label className="chat-input"><input value={question} onChange={event => setQuestion(event.target.value)} placeholder={`Ask about ${title}…`} aria-label={`Ask about ${title}`} /><button type="submit" aria-label="Send message">↑</button></label></form><div className="type-agent-height-resize" role="separator" aria-orientation="horizontal" aria-label="Resize PMO Agent height" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); const top = event.currentTarget.parentElement?.getBoundingClientRect().top ?? 0; const move = (pointerEvent: PointerEvent) => onHeightChange(Math.min(90, Math.max(25, ((pointerEvent.clientY - top) / window.innerHeight) * 100))); const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); }} /></aside>;
}
