import { Navigate, useParams } from 'react-router-dom';
import ReportView from '../components/report/ReportView';
import { REPORTS } from '../reports/registry';

export default function ReportPage() {
  const { reportName } = useParams();
  const report = REPORTS[reportName];
  if (!report) return <Navigate to="/app/dashboard" replace />;
  return <ReportView key={reportName} report={report} />;
}
