import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Users, Award, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const EMPLOYEES_QUERY = `query($id: ID!) { employees(dispensaryId: $id) {
  profileId firstName lastName email positionName department employeeNumber hourlyRate
  employmentType employmentStatus payType activeCerts expiringCerts
}}`;

const COMPLIANCE_QUERY = `query($id: ID!) { staffComplianceOverview(dispensaryId: $id) {
  totalEmployees activeEmployees totalCerts activeCerts expiredCerts expiringSoon pendingCerts
}}`;

const EXPIRING_QUERY = `query($id: ID!, $days: Int!) { expiringCertifications(dispensaryId: $id, daysAhead: $days) {
  certificationId status expirationDate
}}`;

export function StaffingPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', dispensaryId],
    queryFn: () => gqlRequest<any>(EMPLOYEES_QUERY, { id: dispensaryId }),
    select: (d) => d.employees,
    enabled: !!dispensaryId,
  });

  const { data: compliance } = useQuery({
    queryKey: ['staffCompliance', dispensaryId],
    queryFn: () => gqlRequest<any>(COMPLIANCE_QUERY, { id: dispensaryId }),
    select: (d) => d.staffComplianceOverview,
    enabled: !!dispensaryId,
  });

  if (isLoading) return <div className="text-gray-400 p-8">Loading staff...</div>;

  const active = employees?.filter((e: any) => e.employmentStatus === 'active') ?? [];
  const totalPayroll = active.reduce((s: number, e: any) => s + (e.hourlyRate ?? 0) * 40, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Staffing</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Users size={18} className="mx-auto text-brand-600 mb-1" />
          <p className="text-2xl font-bold">{compliance?.activeEmployees ?? 0}</p>
          <p className="text-xs text-gray-500">Active Staff</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Award size={18} className="mx-auto text-green-600 mb-1" />
          <p className="text-2xl font-bold">{compliance?.activeCerts ?? 0}</p>
          <p className="text-xs text-gray-500">Active Certs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <AlertTriangle size={18} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-amber-600">{compliance?.expiringSoon ?? 0}</p>
          <p className="text-xs text-gray-500">Expiring Soon</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Shield size={18} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">{compliance?.expiredCerts ?? 0}</p>
          <p className="text-xs text-gray-500">Expired</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Est. Weekly Payroll</p>
        </div>
      </div>

      {/* Employee Roster */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Employee Roster</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Employee</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Position</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Type</th>
              <th className="text-right px-4 py-2 font-medium text-gray-500">Rate</th>
              <th className="text-center px-4 py-2 font-medium text-gray-500">Certs</th>
              <th className="text-center px-4 py-2 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(employees ?? []).map((emp: any) => (
              <tr key={emp.profileId}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === emp.profileId ? null : emp.profileId)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {expandedId === emp.profileId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <div>
                      <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-400">{emp.employeeNumber} · {emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{emp.positionName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${emp.employmentType === 'full_time' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {emp.employmentType === 'full_time' ? 'Full-time' : 'Part-time'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">${emp.hourlyRate?.toFixed(2) ?? '-'}/hr</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-green-600 font-medium">{emp.activeCerts}</span>
                  {emp.expiringCerts > 0 && <span className="text-amber-500 ml-1">({emp.expiringCerts}⚠)</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${emp.employmentStatus === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {emp.employmentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
