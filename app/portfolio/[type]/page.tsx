'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { portfolioProjects, type PortfolioProject } from '../../portfolioData';
import { reportsByProject } from '../../flashReports';

const healthRank: Record<string, number> = { 'At risk': 0, 'Off track': 1, 'On track': 2 };
const targetWindow = (target: string) => { const date = new Date(target); const period = date.getDate() <= 10 ? 'Early' : date.getDate() <= 20 ? 'Mid' : 'Late'; return `${period} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]} ${date.getFullYear()}`; };
type SortKey = 'name' | 'health' | 'progress' | 'phase' | 'status';

export default function TypePortfolioPage() {
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [descending, setDescending] = useState(false);
  const projectItems = portfolioProjects.filter(project => project.typeSlug === params.type);
  const requestedProject = searchParams.get('project');
  const [selected, setSelected] = useState<string | null>(() => projectItems.some(project => project.name === requestedProject) ? requestedProject : null);
  const projects = useMemo(() => [...projectItems].sort((a, b) => { const left = sortKey === 'health' ? healthRank[a.health] ?? 3 : a[sortKey]; const right = sortKey === 'health' ? healthRank[b.health] ?? 3 : b[sortKey]; const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right)); return (descending ? -1 : 1) * (result || a.name.localeCompare(b.name)); }), [projectItems, sortKey, descending]);
  const sortBy = (key: SortKey) => { if (key === sortKey) setDescending(value => !value); else { setSortKey(key); setDescending(false); } };
  const current = projects.find(project => project.name === selected);
  const reports = selected ? reportsByProject[selected] ?? [] : [];
  const title = projects[0]?.type ?? 'Project type';

  return <main className="type-page"><header className="portfolio-top"><Link href="/portfolio" className="back-link">← All project types</Link><span>PMO / Portfolio / {title}</span></header><section className="type-hero"><div><p className="eyebrow">PROJECT TYPE</p><h1>{title}</h1><p>{projects.length} initiatives in this portfolio. Select a project to review its current details and its five most recent Flash reports.</p></div><div className="type-summary"><span>On track <b>{projects.filter(p => p.health === 'On track').length}</b></span><span>At risk <b>{projects.filter(p => p.health === 'At risk').length}</b></span><span>Off track <b>{projects.filter(p => p.health === 'Off track').length}</b></span></div></section><section className="type-workspace"><div className="all-projects"><div className="list-heading">{(['name', 'health', 'progress', 'phase', 'status'] as SortKey[]).map(key => <button key={key} onClick={() => sortBy(key)}>{key === 'name' ? 'Project' : key === 'phase' ? 'Current phase' : key[0].toUpperCase() + key.slice(1)} {sortKey === key ? (descending ? '↓' : '↑') : '↕'}</button>)}</div>{projects.map(project => <button key={project.code} onClick={() => setSelected(project.name)} className={`type-project-row ${selected === project.name ? 'selected-project' : ''}`}><div><strong>{project.name}</strong><small>{project.code} · {project.owner} · Target: {targetWindow(project.target)}</small></div><span className={`health-badge ${project.health === 'Off track' ? 'watch' : project.health === 'At risk' ? 'risk' : 'good'}`}>{project.health}</span><span className="inline-progress"><i style={{ width: `${project.progress}%` }} />{project.progress}%</span><span>{project.phase}</span><span>{project.status}</span></button>)}</div><div className="type-side"><TypeAgent title={title} projects={projectItems} /><aside className="type-detail">{current ? <><header><span className="eyebrow">PROJECT DETAIL</span><strong>{current.name}</strong><small>{current.owner} · {current.unit} · {current.priority} priority · Target: {targetWindow(current.target)}</small></header><div className="detail-metrics"><span><b>{current.progress}%</b> complete</span><span><b>{current.phase}</b> phase</span><span><b>{current.status}</b> status</span></div><div className="detail-reports"><p className="eyebrow">FLASH REPORTS · LATEST FIRST</p>{reports.length ? reports.map((report, index) => <article key={`${report.date}-${index}`}><div><span>{index === 0 ? 'LATEST' : `REPORT ${index + 1}`}</span><strong>{report.date}</strong><em className={report.health === 'Off track' ? 'watch' : report.health === 'At risk' ? 'risk' : 'good'}>{report.health}</em></div><p>{report.summary || 'No summary provided.'}</p>{report.issues && <p><b>Issues:</b> {report.issues}</p>}{report.nextSteps && <p><b>Next:</b> {report.nextSteps}</p>}</article>) : <div className="no-reports">No matching Flash reports in the August 25 export.</div>}</div></> : <div className="select-project"><span>◫</span><strong>Select a project</strong><p>Choose any project to open its detail and Flash report history.</p></div>}</aside></div></section></main>;
}

function getAgentResponse(prompt: string, title: string, projects: PortfolioProject[]) {
  const lower = prompt.toLowerCase();
  const latest = projects.map(project => ({ project, report: reportsByProject[project.name]?.[0] })).filter(item => item.report);
  const missing = projects.filter(project => !(reportsByProject[project.name]?.length));
  const requestedProject = projects.find(project => lower.includes(project.name.toLowerCase()));
  if (requestedProject) { const report = reportsByProject[requestedProject.name]?.[0]; return `${requestedProject.name}:\n• Status: ${requestedProject.status}\n• Health: ${requestedProject.health}\n• Current phase: ${requestedProject.phase}\n• Owner: ${requestedProject.owner}\n• Priority: ${requestedProject.priority}\n• Progress: ${requestedProject.progress}%\n• Target completion: ${targetWindow(requestedProject.target)}${report ? `\n• Latest Flash report (${report.date}): ${report.summary || 'No summary provided.'}` : '\n• No Flash report is on file.'}`; }
  if (/(missing|no flash|without flash|report coverage)/.test(lower)) return missing.length ? `Missing Flash reports (${missing.length}):\n${missing.map(project => `• ${project.name}`).join('\n')}` : `All ${projects.length} ${title} projects have at least one Flash report on file.`;
  if (/(highlight|latest update|recent update)/.test(lower)) return latest.length ? `Latest highlights:\n${latest.slice(0, 5).map(({ project, report }) => `• ${project.name} — ${report?.highlights || report?.summary || 'No highlight provided.'}`).join('\n')}` : `No Flash reports are available for this project type.`;

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
  if (/(risk|issue|at risk|off track)/.test(lower)) { const risky = projects.filter(project => project.health !== 'On track'); return risky.length ? `Projects needing attention:\n${risky.map(project => `• ${project.name} (${project.health}) — ${reportsByProject[project.name]?.[0]?.issues || 'No current issue provided.'}`).join('\n')}` : `All ${projects.length} ${title} projects are currently on track.`; }
  return `${title} portfolio summary:\n• ${projects.length} total projects\n• ${projects.filter(project => project.health === 'On track').length} on track\n• ${projects.filter(project => project.health === 'At risk').length} at risk\n• ${projects.filter(project => project.health === 'Off track').length} off track\n\nAsk about status, health, phase, owner, priority, completion, target month, or Flash reports.`;
}

function TypeAgent({ title, projects }: { title: string; projects: PortfolioProject[] }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: `I’m focused on the ${title} portfolio. Ask about project status, health, phase, owner, priority, completion, target dates, or Flash reports.` }]);
  const ask = (event: FormEvent) => { event.preventDefault(); const prompt = question.trim(); if (!prompt) return; const response = getAgentResponse(prompt, title, projects);
    setMessages(current => [...current, { role: 'user', text: prompt }, { role: 'assistant', text: response }]); setQuestion(''); };
  return <aside className="type-agent" aria-label={`${title} PMO Agent`}><header><div><span className="copilot-icon">✦</span><div><strong>PMO Agent</strong><small>{title} portfolio</small></div></div></header><div className="type-agent-context"><span>Portfolio context</span><strong>{projects.length} {title} projects</strong><small>The agent uses only this project type.</small></div><div className="type-agent-chat">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><span>{message.role === 'assistant' ? '✦' : 'KH'}</span><p>{message.text}</p></div>)}</div><form onSubmit={ask}><label className="chat-input"><input value={question} onChange={event => setQuestion(event.target.value)} placeholder={`Ask about ${title}…`} aria-label={`Ask about ${title}`} /><button type="submit" aria-label="Send message">↑</button></label></form></aside>;
}
