import { useDashboard } from '../hooks/useDashboard';
import { ShieldCheck, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function CompliancePage() {
  const { data, isLoading } = useDashboard(30);

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  const compliance = data?.compliance;
  const metrc = data?.metrcSync;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Compliance & Metrc</h1>

      {/* Compliance Score */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            compliance?.compliancePercent === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {compliance?.compliancePercent ?? 0}%
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Compliance</h2>
            <p className="text-sm text-gray-500">
              {compliance?.compliantProducts}/{compliance?.totalProducts} products fully compliant
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {compliance?.missingUid === 0
              ? <CheckCircle size={16} className="text-green-500" />
              : <XCircle size={16} className="text-red-500" />}
            <div>
              <p className="text-sm font-medium">Metrc UIDs</p>
              <p className="text-xs text-gray-500">{compliance?.missingUid ?? 0} missing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compliance?.missingCategory === 0
              ? <CheckCircle size={16} className="text-green-500" />
              : <XCircle size={16} className="text-red-500" />}
            <div>
              <p className="text-sm font-medium">Item Categories</p>
              <p className="text-xs text-gray-500">{compliance?.missingCategory ?? 0} missing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compliance?.missingPackageLabel === 0
              ? <CheckCircle size={16} className="text-green-500" />
              : <XCircle size={16} className="text-red-500" />}
            <div>
              <p className="text-sm font-medium">Package Labels</p>
              <p className="text-xs text-gray-500">{compliance?.missingPackageLabel ?? 0} missing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <div>
              <p className="text-sm font-medium">Approved</p>
              <p className="text-xs text-gray-500">{compliance?.compliantProducts ?? 0} approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrc Sync */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw size={18} /> Metrc Sync Status
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Syncs</p>
            <p className="text-2xl font-bold">{metrc?.totalSyncs ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success</p>
            <p className="text-2xl font-bold text-green-600">{metrc?.successCount ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Failed</p>
            <p className={`text-2xl font-bold ${(metrc?.failedCount ?? 0) > 0 ? 'text-red-600' : ''}`}>
              {metrc?.failedCount ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className={`text-2xl font-bold ${
              (metrc?.successRate ?? 100) >= 90 ? 'text-green-600' :
              (metrc?.successRate ?? 100) >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>{metrc?.successRate ?? 0}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Awaiting Sync</p>
            <p className={`text-2xl font-bold ${(metrc?.ordersAwaitingSync ?? 0) > 0 ? 'text-amber-600' : ''}`}>
              {metrc?.ordersAwaitingSync ?? 0}
            </p>
          </div>
        </div>

        {metrc?.lastSyncAt && (
          <p className="text-xs text-gray-400 mt-4">
            Last successful sync: {new Date(metrc.lastSyncAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
