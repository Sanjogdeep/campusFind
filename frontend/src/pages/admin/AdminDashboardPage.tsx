import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Analytics,
  User,
  Dispute,
  CampusLocation,
  Category,
  AuditLog,
} from '../../types';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Tag,
  Settings,
  FileText,
  BarChart3,
  Search,
  Lock,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'users' | 'disputes' | 'locations' | 'categories' | 'settings' | 'audit'
  >('analytics');

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User search query
  const [userSearch, setUserSearch] = useState('');

  // Dispute resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionAction, setResolutionAction] = useState('CLOSE_CASE');
  const [adminNotes, setAdminNotes] = useState('');
  const [suspendUser, setSuspendUser] = useState(false);

  useEffect(() => {
    loadAll();
  }, [activeTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const data = await adminService.getAnalytics();
        setAnalytics(data);
      } else if (activeTab === 'users') {
        const data = await adminService.listUsers({ search: userSearch || undefined });
        setUsers(data);
      } else if (activeTab === 'disputes') {
        const data = await adminService.listDisputes('ALL');
        setDisputes(data);
      } else if (activeTab === 'locations') {
        const data = await adminService.getLocations();
        setLocations(data);
      } else if (activeTab === 'categories') {
        const data = await adminService.getCategories();
        setCategories(data);
      } else if (activeTab === 'settings') {
        if (isSuperAdmin) {
          const data = await adminService.getSettings();
          setSystemSettings(data);
        }
      } else if (activeTab === 'audit') {
        const data = await adminService.getAuditLogs();
        setAuditLogs(data);
      }
    } catch (e: any) {
      error('Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (u: User) => {
    try {
      await adminService.updateUser(u.id, { is_suspended: !u.is_suspended });
      success(`User ${u.email} ${!u.is_suspended ? 'suspended' : 're-activated'}.`);
      loadAll();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Operation failed.');
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      await adminService.resolveDispute(selectedDispute.id, {
        resolution: resolutionAction,
        admin_notes: adminNotes,
        suspend_user_id: suspendUser ? selectedDispute.raised_by_id : undefined,
      });
      success('Dispute resolved successfully.');
      setSelectedDispute(null);
      setAdminNotes('');
      loadAll();
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to resolve dispute.');
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await adminService.updateSetting(key, value);
      success(`Setting ${key} updated.`);
    } catch (err: any) {
      error('Failed to update setting.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md">
              {isSuperAdmin ? 'Super Administrator' : 'Campus Administrator'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            CampusFind Administration Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide reports oversight, dispute investigations, safe meeting points, and security audit logs.
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics & KPIs
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Management
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'disputes'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Disputes & Claims
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'locations'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" /> Campus Safe Points
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" /> Categories
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" /> System Settings
          </button>
        )}

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
          Loading administrative data...
        </div>
      ) : (
        <div>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {analytics.total_users}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                    Lost Reports
                  </span>
                  <div className="text-2xl font-extrabold text-rose-600 mt-1">
                    {analytics.lost_reports_count}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                    Found Reports
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {analytics.found_reports_count}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">
                    Successful Returns
                  </span>
                  <div className="text-2xl font-extrabold text-sky-600 mt-1">
                    {analytics.successful_returns_count}
                  </div>
                </div>
              </div>

              {/* Charts & Categorical Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Reports by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.lost_by_category).map(([cat, count]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>{cat}</span>
                          <span>{count} reports</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (count / Math.max(1, analytics.lost_reports_count)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Reports by Campus Location</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.reports_by_location).map(([loc, count]) => (
                      <div key={loc}>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>{loc}</span>
                          <span>{count} items</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (count / Math.max(1, analytics.lost_reports_count + analytics.found_reports_count)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-72 outline-none focus:border-purple-500"
                />
                <button
                  onClick={loadAll}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Refresh
                </button>
              </div>

              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Found / Returned</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 font-bold rounded text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">{u.department || '—'}</td>
                      <td className="p-3.5">
                        {u.items_found_count} found • {u.items_returned_count} returned
                      </td>
                      <td className="p-3.5">
                        {u.is_suspended ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              u.is_suspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  No disputes reported across campus.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                  {disputes.map((d) => (
                    <div key={d.id} className="p-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                            Dispute #{d.id} • {d.reason}
                          </span>
                          <span className="text-xs text-slate-400">Case #{d.case_id}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Status: {d.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{d.description}</p>
                        {d.admin_notes && (
                          <p className="text-[11px] text-purple-700 mt-1 italic">
                            Admin resolution notes: {d.admin_notes}
                          </p>
                        )}
                      </div>

                      {d.status === 'OPEN' && (
                        <button
                          onClick={() => setSelectedDispute(d)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex-shrink-0"
                        >
                          Resolve Dispute
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Campus Meeting Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{loc.name}</div>
                      <div className="text-[11px] text-slate-500">{loc.zone_code} • {loc.description}</div>
                    </div>
                    {loc.is_meeting_point && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        Safe Point
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Configured Item Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS (Super Admin Only) */}
          {activeTab === 'settings' && isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">University System Settings</h3>
              <div className="space-y-3">
                {systemSettings.map((s) => (
                  <div
                    key={s.key}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">{s.key}</span>
                      <span className="text-[11px] text-slate-500">{s.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={s.value}
                        onBlur={(e) => handleSaveSetting(s.key, e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium outline-none focus:border-purple-500 w-48 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Resource</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">IP</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3.5">{log.resource_type} #{log.resource_id}</td>
                      <td className="p-3.5 text-slate-500">{log.user_email || 'System'}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{log.ip_address || '—'}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dispute Resolver Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Resolve Dispute #{selectedDispute.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reason: {selectedDispute.reason} • Case #{selectedDispute.case_id}
            </p>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Decision
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                >
                  <option value="CLOSE_CASE">Close Case (Dismiss / Unresolved)</option>
                  <option value="RETRY_MEETING">Allow Retry / Reschedule Handover</option>
                  <option value="CONFIRM_RETURN">Confirm Return Manually</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Finding & Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Document the resolution and reason for audit logs..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <input
                  type="checkbox"
                  id="suspend"
                  checked={suspendUser}
                  onChange={(e) => setSuspendUser(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="suspend" className="text-xs font-semibold text-rose-900 cursor-pointer">
                  Suspend user following investigation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
