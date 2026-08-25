'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { reportsByProject } from './flashReports';
import { portfolioProjects } from './portfolioData';

type Health = 'At risk' | 'Off track';
const projects = [
  { name: 'SalesForce Field Services Module', owner: 'Paul McCabe', health: 'At risk' as Health, progress: 83, milestone: 'Execution · Apr 13, 2026', variance: 'High priority' },
  { name: 'Order Entry Migration to Salesforce', owner: 'Michelle Tipton', health: 'At risk' as Health, progress: 47, milestone: 'Requirements · Sep 18, 2026', variance: 'Trend down' },
  { name: 'Factory Track V7.x Implementation', owner: 'Amber Porter', health: 'At risk' as Health, progress: 80, milestone: 'Initiation · Jan 14, 2027', variance: 'Medium priority' },
  { name: 'AP Automation - Medius Implementation', owner: 'Jennifer Peterson', health: 'Off track' as Health, progress: 75, milestone: 'Design · Oct 09, 2026', variance: 'Trend down' },
  { name: 'New IT Build - VAN 6 Manufacturing', owner: 'Easton Korver', health: 'Off track' as Health, progress: 85, milestone: 'Execution · Oct 30, 2026', variance: 'Highest priority' },
  { name: 'New IT Build - Ridgeland, MS', owner: 'Easton Korver', health: 'Off track' as Health, progress: 52, milestone: 'Execution · Oct 09, 2026', variance: 'High priority' },
  { name: 'Mechanical Design Scheduling', owner: 'Jennifer Peterson', health: 'Off track' as Health, progress: 74, milestone: 'Initiation · Aug 31, 2026', variance: 'Medium priority' },
  { name: 'Vendor Master Data Clean-up', owner: 'Jennifer Peterson', health: 'Off track' as Health, progress: 27, milestone: 'Initiation · Jan 26, 2027', variance: 'Medium priority' },
  { name: 'IEM - PIU Vision Inspection Development', owner: 'Jennifer Peterson', health: 'Off track' as Health, progress: 42, milestone: 'Initiation · Jan 27, 2027', variance: 'Medium priority' },
  { name: 'Simplify SOLI Process', owner: 'Michelle Tipton', health: 'Off track' as Health, progress: 38, milestone: 'Initiation · Jan 15, 2027', variance: 'Medium priority' },
  { name: 'The Work Number Implementation', owner: 'Easton Korver', health: 'At risk' as Health, progress: 37, milestone: 'Initiation · Dec 04, 2026', variance: 'On hold' },
];
const healthClass: Record<Health, string> = { 'At risk': 'risk', 'Off track': 'watch' };
const healthRank: Record<Health, number> = { 'At risk': 0, 'Off track': 1 };
const statusByProjectName = new Map(portfolioProjects.map(project => [project.name, project.status]));
const targetWindow = (target: string) => { const date = new Date(target); const period = date.getDate() <= 10 ? 'Early' : date.getDate() <= 20 ? 'Mid' : 'Late'; return `${period} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]} ${date.getFullYear()}`; };
const targetWindowByProjectName = new Map(portfolioProjects.map(project => [project.name, targetWindow(project.target)]));

export default function Home() {
  const [filter, setFilter] = useState<'All' | Health>('All');
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Good morning, Kevin. The August 25 portfolio export has 11 initiatives needing attention: 4 at risk and 7 off track. I can prepare a steering summary, surface risks, or answer questions about a project.' }]);
  const [question, setQuestion] = useState('');
  const [selected, setSelected] = useState('SalesForce Field Services Module');
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const visible = useMemo(() => (filter === 'All' ? projects : projects.filter(p => p.health === filter)).slice().sort((a, b) => healthRank[a.health] - healthRank[b.health] || a.name.localeCompare(b.name)), [filter]);
  function askAgent(event: FormEvent) { event.preventDefault(); const prompt = question.trim(); if (!prompt) return; const project = projects.find(p => p.name === selected); setMessages(current => [...current, { role: 'user', text: prompt }, { role: 'assistant', text: `Based on the portfolio snapshot, ${selected} is ${project?.health.toLowerCase()}. I recommend confirming its next decision owner, unblocking the milestone, and highlighting any schedule impact in Friday's steering pack.` }]); setQuestion(''); }
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">P</span><span>PORTFOLIO</span></div><nav aria-label="Primary navigation"><a className="nav-item active" href="#overview"><span>▦</span>Overview</a><Link className="nav-item" href="/portfolio"><span>◫</span>Portfolio</Link><Link className="nav-item" href="/roadmap"><span>⌁</span>Roadmap</Link><a className="nav-item" href="#reports"><span>▤</span>Reports</a></nav><div className="sidebar-bottom"><div className="agent-pulse">✦</div><div><strong>PMO Agent</strong><small>Portfolio intelligence</small></div></div></aside>
    <section className="workspace" id="overview"><header className="topbar"><div className="crumb">PMO / <strong>Executive overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">◌<i /></button><button className="avatar" aria-label="User menu">KH</button></div></header><div className="content">
      <section className="hero"><div><p className="eyebrow">TUESDAY, AUGUST 25, 2026</p><h1>Portfolio health, at a glance.</h1><p className="lede">Updated from the August 25 project portfolio and Flash reporting exports.</p></div></section>
      <section className="metrics" aria-label="Portfolio health summary"><article><span className="metric-label">Active initiatives</span><strong>93</strong><span className="subtle">73 in progress · 16 on hold</span></article><article><span className="metric-label">On track</span><strong className="positive">82</strong><span className="subtle">88% of portfolio</span></article><article><span className="metric-label">Needs attention</span><strong className="warning">11</strong><span className="subtle">4 at risk · 7 off track</span></article><article><span className="metric-label">Latest Flash reports</span><strong>74</strong><span className="subtle">From 188 report snapshots</span></article></section>
      <section className="portfolio-section" id="portfolio"><div className="section-heading"><div><p className="eyebrow">PORTFOLIO PULSE</p><h2>Projects requiring your attention</h2></div><div className="filters">{(['All', 'At risk', 'Off track'] as const).map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="project-list">{visible.map(project => <button key={project.name} className={`project-row ${selected === project.name ? 'focused' : ''}`} onClick={() => { setSelected(project.name); setDetailOpen(true); }}><span className={`status-dot ${healthClass[project.health]}`} /><span className="project-main"><strong>{project.name}</strong><small>Owner · {project.owner}</small></span><span className="project-progress"><span><b>{project.progress}%</b> complete</span><em><i style={{ width: `${project.progress}%` }} /></em></span><span className={`health-badge ${healthClass[project.health]}`}>{project.health}</span><span className="milestone"><small>Target completion</small><b>{targetWindowByProjectName.get(project.name) ?? '—'}</b></span><span className="variance">{statusByProjectName.get(project.name) ?? '—'}</span></button>)}</div></section>
      <section className="decision-strip"><div className="decision-number">11</div><div><p className="eyebrow">ATTENTION REQUIRED</p><strong>Four initiatives are trending down, and one is currently on hold.</strong></div><button>Review projects →</button></section>
    </div></section>
    <aside className="copilot" aria-label="PMO AI Agent">{detailOpen ? <ProjectHistory projectName={selected} onClose={() => setDetailOpen(false)} /> : <><header><div><span className="copilot-icon">✦</span><div><strong>PMO Agent</strong><small>AI portfolio partner</small></div></div><button aria-label="Close agent">×</button></header><div className="copilot-context"><span>Context</span><strong>{selected}</strong><small>Portfolio data refreshed today at 8:30 AM</small></div><div className="chat">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><span>{message.role === 'assistant' ? '✦' : 'KH'}</span><p>{message.text}</p></div>)}</div><div className="suggestions"><button onClick={() => setQuestion('Summarize risks for the executive team')}>Summarize portfolio risks</button><button onClick={() => setQuestion('What decisions are overdue?')}>Find overdue decisions</button></div><form onSubmit={askAgent}><label className="chat-input"><input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask the PMO Agent…" aria-label="Ask PMO Agent" /><button type="submit" aria-label="Send message">↑</button></label><small className="disclaimer">Agent uses your approved portfolio data.</small></form></>}</aside>
  </main>;
}

function ProjectHistory({ projectName, onClose }: { projectName: string; onClose: () => void }) {
  const reports = reportsByProject[projectName] ?? [];
  return <div className="project-history"><header><div><p className="eyebrow">FLASH REPORT HISTORY</p><strong>{projectName}</strong><small>Most recent report first · up to five reports</small></div><button onClick={onClose} aria-label="Return to PMO Agent">×</button></header>{reports.length === 0 ? <div className="empty-history"><span>◌</span><strong>No Flash reports on file</strong><p>This project has no matching report history in the August 25 Flash export.</p></div> : <div className="history-scroll">{reports.map((report, index) => <article className="report-card" key={`${report.date}-${index}`}><div className="report-head"><div><span className="report-sequence">{index === 0 ? 'LATEST' : `REPORT ${index + 1}`}</span><strong>{report.date}</strong></div><div><span className={`health-badge ${report.health === 'Off track' ? 'watch' : report.health === 'At risk' ? 'risk' : 'good'}`}>{report.health}</span><small>{report.complete ?? '—'}% complete</small></div></div><ReportField label="Summary" text={report.summary} /><ReportField label="Highlights" text={report.highlights} /><ReportField label="Issues" text={report.issues} /><ReportField label="Next steps" text={report.nextSteps} /></article>)}</div>}</div>;
}

function ReportField({ label, text }: { label: string; text: string }) {
  return text ? <div className="report-field"><span>{label}</span><p>{text}</p></div> : null;
}
