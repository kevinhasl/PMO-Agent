import Link from 'next/link';
import { portfolioProjects } from '../portfolioData';
import Sidebar from '../components/Sidebar';

const healthOrder = ['Off track', 'At risk', 'On track'];

export default function PortfolioPage() {
  const types = Array.from(new Set(portfolioProjects.map(project => project.type))).map(type => {
    const items = portfolioProjects.filter(project => project.type === type);
    return { type, slug: items[0].typeSlug, total: items.length, counts: healthOrder.map(health => items.filter(project => project.health === health).length) };
  }).sort((a, b) => b.total - a.total);
  return <main className="portfolio-page with-sidebar"><Sidebar /><div className="page-content"><header className="portfolio-top"><Link href="/" className="back-link">← Executive overview</Link><span>PMO / Portfolio</span></header><section className="portfolio-hero"><p className="eyebrow">AUGUST 25, 2026 PORTFOLIO</p><h1>Project health by type</h1><p>Each bar represents the active initiatives in that project type. Select a bar to open the project portfolio.</p><div className="legend"><span><i className="legend-red" />Off track</span><span><i className="legend-amber" />At risk</span><span><i className="legend-green" />On track</span></div></section><section className="type-chart">{types.map(item => <Link className="type-row" href={`/portfolio/${item.slug}`} key={item.type}><div className="type-label"><strong>{item.type}</strong><span>{item.total} projects</span></div><div className="stacked-bar" aria-label={`${item.type}: ${item.counts[0]} off track, ${item.counts[1]} at risk, ${item.counts[2]} on track`}>{item.counts.map((count, index) => count ? <i key={healthOrder[index]} className={`segment segment-${index}`} style={{ width: `${(count / item.total) * 100}%` }} /> : null)}</div><div className="type-counts"><b>{item.counts[0]}</b><b>{item.counts[1]}</b><b>{item.counts[2]}</b><span>→</span></div></Link>)}</section></div></main>;
}
