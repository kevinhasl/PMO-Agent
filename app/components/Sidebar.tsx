'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const inPortfolio = pathname.startsWith('/portfolio') || pathname.startsWith('/business-units');
  const inData = pathname.startsWith('/reports') || pathname.startsWith('/changes');

  return <aside className="global-sidebar"><div className="brand"><span className="brand-mark">IT</span><span>PORTFOLIO</span></div><nav><Link className={`nav-item ${pathname === '/' ? 'active' : ''}`} href="/"><span>▦</span>Overview</Link><div className="nav-group"><Link className={`nav-item ${inPortfolio ? 'active' : ''}`} href="/portfolio"><span>◫</span>Portfolio</Link>{inPortfolio && <Link className={`nav-subitem ${pathname.startsWith('/business-units') ? 'active' : ''}`} href="/business-units">Business Units</Link>}</div><Link className={`nav-item ${pathname.startsWith('/roadmap') ? 'active' : ''}`} href="/roadmap"><span>⌁</span>Roadmap</Link><div className="nav-group"><Link className={`nav-item ${inData ? 'active' : ''}`} href="/reports"><span>▤</span>Data</Link>{inData && <Link className={`nav-subitem ${pathname.startsWith('/changes') ? 'active' : ''}`} href="/changes">Changes</Link>}</div></nav><div className="sidebar-bottom"><div className="agent-pulse">✦</div><div><strong>PMO Agent</strong><small>Portfolio intelligence</small></div></div></aside>;
}
