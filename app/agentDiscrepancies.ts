import { reportsByProject as baselineReports, type FlashReport } from './flashReports';

type ProjectForReview = {
  name: string;
  target: string;
  status: string;
  health: string;
  progress: number;
};

const oneDay = 24 * 60 * 60 * 1000;
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function discrepancyResponse(projects: readonly ProjectForReview[], reportsByProject: Record<string, FlashReport[]> = baselineReports, snapshotDate = new Date()) {
  const dataAsOf = snapshotDate;
  const findings: string[] = [];

  for (const project of projects) {
    if (project.status === 'On hold') continue;
    const target = new Date(project.target);
    const latestReport = reportsByProject[project.name]?.[0];
    const daysToTarget = Math.ceil((target.getTime() - dataAsOf.getTime()) / oneDay);

    if (target < dataAsOf && project.status !== 'Ready') {
      findings.push(`• ${project.name} — target completion was ${formatDate(target)}, but the project is ${project.status} at ${project.progress}% complete.`);
    }
    if (!latestReport) {
      findings.push(`• ${project.name} — no Flash report is on file.`);
    } else {
      const reportDate = new Date(latestReport.date);
      const reportAge = Math.floor((dataAsOf.getTime() - reportDate.getTime()) / oneDay);
      if (reportAge > 21) findings.push(`• ${project.name} — latest Flash report is ${reportAge} days old (${latestReport.date}).`);
    }
    if (project.status !== 'Ready' && project.progress >= 100) {
      findings.push(`• ${project.name} — ${project.progress}% complete but still marked ${project.status}.`);
    }
    if (project.health === 'On track' && project.status === 'On hold') {
      findings.push(`• ${project.name} — health is On track while the project status is On hold.`);
    }
    if (project.status === 'In progress' && daysToTarget >= 0 && daysToTarget <= 30 && project.progress < 50) {
      findings.push(`• ${project.name} — target is within ${daysToTarget} days (${formatDate(target)}) with only ${project.progress}% completion.`);
    }
  }

  return findings.length
    ? `Data discrepancies to review (as of ${formatDate(dataAsOf)}):\n${findings.join('\n')}`
    : `No defined data discrepancies were found in this scope as of ${formatDate(dataAsOf)}.`;
}
