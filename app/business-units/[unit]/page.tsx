'use client';

import Sidebar from '../../components/Sidebar';
import { GroupedPortfolioPage } from '../../portfolio/[type]/page';

export default function BusinessUnitDetailPage() {
  return <div className="with-sidebar"><Sidebar /><div className="page-content"><GroupedPortfolioPage groupBy="unit" pathBase="/business-units" groupLabel="Business unit" /></div></div>;
}
