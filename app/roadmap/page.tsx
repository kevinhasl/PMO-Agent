 'use client';
import Link from 'next/link';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useDashboardData } from '../components/DashboardDataProvider';

const healthClass: Record<string, string> = { 'On track': 'good', 'At risk': 'risk', 'Off track': 'watch' };
const targetWindow = (target: string) => { const date = new Date(target); const period = date.getDate() <= 10 ? 'Early' : date.getDate() <= 20 ? 'Mid' : 'Late'; return `${period} ${date.toLocaleString('en-US', { month: 'short' })}`; };

export default function RoadmapPage() {
  const { projects: portfolioProjects } = useDashboardData();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showOnHold, setShowOnHold] = useState(false);
  const types = Array.from(new Set(portfolioProjects.map(project => project.type))).sort();
  const grouped = Object.entries(portfolioProjects.filter(project => (showOnHold || project.status !== 'On hold') && (selectedTypes.length === 0 || selectedTypes.includes(project.type))).reduce<Record<string, typeof portfolioProjects>>((groups, project) => { const month = new Date(project.target).toLocaleString('en-US', { month: 'long', year: 'numeric' }); (groups[month] ??= []).push(project); return groups; }, {})).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  const toggleType = (type: string) => setSelectedTypes(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  return <main className="roadmap-page with-sidebar"><Sidebar /><div className="page-content"><header className="portfolio-top"><Link href="/" className="back-link">← Executive overview</Link><span>PMO / Roadmap</span></header><section className="roadmap-hero"><p className="eyebrow">PORTFOLIO ROADMAP</p><h1>Estimated project completion</h1><p>Initiatives grouped by their target completion month from the current IP export. Dates are shown as Early, Mid, or Late month.</p><div className="roadmap-filters"><button className={showOnHold ? 'selected' : ''} onClick={() => setShowOnHold(current => !current)}>{showOnHold ? 'Hide on hold' : 'Show on hold'}</button><button className={selectedTypes.length === 0 ? 'selected' : ''} onClick={() => setSelectedTypes([])}>All</button>{types.map(type => <button key={type} className={selectedTypes.includes(type) ? 'selected' : ''} onClick={() => toggleType(type)}>{type}</button>)}</div></section><section className="roadmap-timeline">{grouped.map(([month, projects]) => <article className="roadmap-month" key={month}><header><span>{month}</span><b>{projects.length} projects</b></header><div>{projects.sort((a, b) => new Date(a.target).getTime() - new Date(b.target).getTime()).map(project => <Link href={`/portfolio/${project.typeSlug}`} className="roadmap-project" key={project.code}><span className={`status-dot ${healthClass[project.health]}`} /><div><strong>{project.name}</strong><small>{project.type} · {project.owner}</small></div><span className="roadmap-progress"><span><b>{project.progress}%</b> complete</span><i><em style={{ width: `${project.progress}%` }} /></i></span><span className="roadmap-window">{targetWindow(project.target)}</span><span className="roadmap-status">{project.status}</span><span className={`health-badge ${healthClass[project.health]}`}>{project.health}</span></Link>)}</div></article>)}</section></div></main>;
}
