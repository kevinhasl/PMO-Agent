'use client';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useDashboardData } from '../components/DashboardDataProvider';

const healthOrder = ['Off track', 'At risk', 'On track'];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BusinessUnitsPage() {
  const { projects: portfolioProjects } = useDashboardData();
  const units = Array.from(new Set(portfolioProjects.map(project => project.unit))).map(unit => {
    const items = portfolioProjects.filter(project => project.unit === unit);
    return { unit, slug: slugify(unit), total: items.length, counts: healthOrder.map(health => items.filter(project => project.health === health).length) };
  }).sort((a, b) => b.total - a.total || a.unit.localeCompare(b.unit));
  return <main className="portfolio-page with-sidebar"><Sidebar /><div className="page-content"><header className="portfolio-top"><Link href="/" className="back-link">← Executive overview</Link><span>PMO / Business Units</span></header><section className="portfolio-hero"><p className="eyebrow">AUGUST 25, 2026 PORTFOLIO</p><h1>Project health by business unit</h1><p>Each bar represents the active initiatives in that business unit. Select a bar to open the unit portfolio.</p><div className="legend"><span><i className="legend-red" />Off track</span><span><i className="legend-amber" />At risk</span><span><i className="legend-green" />On track</span></div></section><section className="type-chart">{units.map(item => <Link className="type-row" href={`/business-units/${item.slug}`} key={item.unit}><div className="type-label"><strong>{item.unit}</strong><span>{item.total} projects</span></div><div className="stacked-bar" aria-label={`${item.unit}: ${item.counts[0]} off track, ${item.counts[1]} at risk, ${item.counts[2]} on track`}>{item.counts.map((count, index) => count ? <i key={healthOrder[index]} className={`segment segment-${index}`} style={{ width: `${(count / item.total) * 100}%` }} /> : null)}</div><div className="type-counts"><b>{item.counts[0]}</b><b>{item.counts[1]}</b><b>{item.counts[2]}</b><span>→</span></div></Link>)}</section></div></main>;
}
