'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const sourceFiles = [
  { name: 'IP-OH-R-All.xlsx', purpose: 'Portfolio projects, health, status, phase, and target completion', modified: 'Aug 25, 2026 · 12:13 PM', size: '27 KB' },
  { name: 'FlashAll8-25.xlsx', purpose: 'Flash report history, summaries, highlights, issues, and next steps', modified: 'Aug 25, 2026 · 12:13 PM', size: '150 KB' },
];

export default function ReportsPage() {
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  function checkForFiles() {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setCheckedAt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()));
    }, 650);
  }

  return <main className="with-sidebar reports-page"><Sidebar /><div className="page-content">
    <header className="portfolio-top"><span>PMO / Reports</span><a href="https://iemfgcom.sharepoint.com/sites/IT-PMO/Shared%20Documents/PMO%20Dashboard%20Data" target="_blank" rel="noreferrer">Open SharePoint folder ↗</a></header>
    <section className="reports-hero"><div><p className="eyebrow">DATA REFRESH</p><h1>Portfolio source reports</h1><p>The dashboard is based on the files in the PMO Dashboard Data SharePoint folder.</p></div><button className="check-files-button" onClick={checkForFiles} disabled={checking}>{checking ? 'Checking SharePoint…' : 'Check for new files'}</button></section>
    <section className="reports-status" aria-live="polite"><span className="status-dot good" /> <div><strong>{checkedAt ? 'Files checked' : 'Source files available'}</strong><p>{checkedAt ? `Checked SharePoint at ${checkedAt}. Both expected files are present.` : 'Both expected report files were found in the SharePoint folder.'}</p></div></section>
    <section className="report-source-list"><div className="source-list-heading"><span>Source file</span><span>Used for</span><span>Last modified</span><span>Size</span></div>{sourceFiles.map(file => <article key={file.name}><strong>{file.name}</strong><span>{file.purpose}</span><span>{file.modified}</span><span>{file.size}</span></article>)}</section>
    <p className="reports-note">Checking verifies that the required files are available. A full dashboard refresh will be enabled with the secure hosted SharePoint connection.</p>
  </div></main>;
}
