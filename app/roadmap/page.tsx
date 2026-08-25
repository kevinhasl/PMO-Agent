 'use client';
import Link from 'next/link';
import { useState } from 'react';
import { portfolioProjects } from '../portfolioData';
import Sidebar from '../components/Sidebar';

const healthClass: Record<string, string> = { 'On track': 'good', 'At risk': 'risk', 'Off track': 'watch' };
const targetWindow = (target: string) => { const date = new Date(target); const period = date.getDate() <= 10 ? 'Early' : date.getDate() <= 20 ? 'Mid' : 'Late'; return `${period} ${date.toLocaleString('en-US', { month: 'short' })}`; };

export default function RoadmapPage() {
  const [selectedType, setSelectedType] = useState('All');
  const types = Array.from(new Set(portfolioProjects.map(project => project.type))).sort();
  const grouped = Object.entries(portfolioProjects.filter(project => selectedType === 'All' || project.type === selectedType).reduce<Record<string, typeof portfolioProjects>>((groups, project) => { const month = new Date(project.target).toLocaleString('en-US', { month: 'long', year: 'numeric' }); (groups[month] ??= []).push(project); return groups; }, {})).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  return <main className="roadmap-page with-sidebar"><Sidebar /><div className="page-content"><header className="portfolio-top"><Link href="/" className="back-link">← Executive overview</Link><span>PMO / Roadmap</span></header><section className="roadmap-hero"><p className="eyebrow">PORTFOLIO ROADMAP</p><h1>Estimated project completion</h1><p>Initiatives grouped by their target completion month from the current IP export. Dates are shown as Early, Mid, or Late month.</p><div className="roadmap-filters">{['All', ...types].map(type => <button key={type} className={selectedType === type ? 'selected' : ''} onClick={() => setSelectedType(type)}>{type}</button>)}</div></section><section className="roadmap-timeline">{grouped.map(([month, projects]) => <article className="roadmap-month" key={month}><header><span>{month}</span><b>{projects.length} projects</b></header><div>{projects.sort((a, b) => new Date(a.target).getTime() - new Date(b.target).getTime()).map(project => <Link href={`/portfolio/${project.typeSlug}`} className="roadmap-project" key={project.code}><span className={`status-dot ${healthClass[project.health]}`} /><div><strong>{project.name}</strong><small>{project.type} · {project.owner}</small></div><span className="roadmap-window">{targetWindow(project.target)}</span><span className="roadmap-status">{project.status}</span><span className={`health-badge ${healthClass[project.health]}`}>{project.health}</span></Link>)}</div></article>)}</section></div></main>;
}
