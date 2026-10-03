import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { caseService } from '../../services/caseService';
import { Notification } from '../../types';
import {
  Compass,
  Bell,
  Search,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  MapPin,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const res = await caseService.getUnreadCount();
      setUnreadCount(res.unread_count);
    } catch (e) {
      // ignore silent fail
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      try {
        const notifs = await caseService.getNotifications();
        setNotifications(notifs.slice(0, 5));
      } catch (e) {}
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await caseService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                Campus<span className="text-sky-600">Find</span>
              </span>
              <span className="text-[10px] block font-semibold text-sky-700 -mt-0.5 tracking-wider uppercase">
                LPU Phagwara Campus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/search"
              className={`px-3 py-2 rounded-lg hover:text-sky-600 hover:bg-sky-50 transition flex items-center gap-1.5 ${
                location.pathname === '/search' ? 'text-sky-600 bg-sky-50 font-semibold' : ''
              }`}
            >
              <Search className="w-4 h-4" /> Browse Items
            </Link>
            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg hover:text-sky-600 hover:bg-sky-50 transition flex items-center gap-1.5 ${
                location.pathname === '/map' ? 'text-sky-600 bg-sky-50 font-semibold' : ''
              }`}
            >
              <MapPin className="w-4 h-4" /> Campus Map
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg hover:text-sky-600 hover:bg-sky-50 transition ${
                    location.pathname === '/dashboard' ? 'text-sky-600 bg-sky-50 font-semibold' : ''
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  to="/report-lost"
                  className={`px-3 py-2 rounded-lg hover:text-sky-600 hover:bg-sky-50 transition flex items-center gap-1 text-rose-600 hover:text-rose-700 ${
                    location.pathname === '/report-lost' ? 'bg-rose-50 font-semibold' : ''
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> Report Lost
                </Link>
                <Link
                  to="/report-found"
                  className={`px-3 py-2 rounded-lg hover:text-sky-600 hover:bg-sky-50 transition flex items-center gap-1 text-emerald-600 hover:text-emerald-700 ${
                    location.pathname === '/report-found' ? 'bg-emerald-50 font-semibold' : ''
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> Report Found
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg hover:text-purple-600 hover:bg-purple-50 transition flex items-center gap-1.5 text-purple-700 font-semibold ${
                  location.pathname.startsWith('/admin') ? 'bg-purple-100' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Admin Portal
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Notifications dropdown */}
                <div className="relative">
                  <button
                    onClick={handleOpenNotifications}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              to={n.link || '/dashboard'}
                              onClick={() => setShowNotifs(false)}
                              className={`block px-4 py-3 hover:bg-slate-50 transition text-left ${
                                !n.is_read ? 'bg-sky-50/50' : ''
                              }`}
                            >
                              <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {n.message}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu / profile pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-900 leading-none">{user?.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role?.toLowerCase()}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Items
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Campus Map
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/report-lost"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Report Lost Item
              </Link>
              <Link
                to="/report-found"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50"
              >
                Report Found Item
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50"
                >
                  Admin Portal
                </Link>
              )}
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl"
              >
                Sign Up with College Email
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
