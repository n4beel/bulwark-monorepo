'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import UpgradeForensicModal from '@/shared/components/UpgradeForensicModal';
import { RootState } from '@/store/store';

export default function DashboardNavbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const [openUpgrade, setOpenUpgrade] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      router.replace('/');
      // setTimeout(async () => {
      //   await signOut(auth);
      //   dispatch(logout());
      // }, 300);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <header className="h-20 border-b border-[var(--border-color)] bg-[var(--background)] flex items-center px-6 md:px-10 relative">
        {/* Mobile Hamburger */}
        <button
          className="md:hidden mr-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-color)]"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* LEFT (Desktop Overlap preserved) */}
        <div className="hidden md:flex items-center">
          <button
            className="flex items-center gap-2 -mr-6 px-4 py-2 rounded-full
            bg-[var(--text-secondary)] text-[var(--text-inverse)] text-xs border cursor-pointer shadow-sm transition z-30"
            onClick={() => setOpenUpgrade(true)}
          >
            Upgrade to Forensic
            <Image
              src="/icons/WhiteDiamond.svg"
              alt="upgrade"
              width={15}
              height={15}
            />
          </button>

          <div
            className="flex items-center gap-2 pr-4 pl-6 py-2 rounded-full
            bg-[var(--card-accent)] border border-[var(--blue-secondary)]
            text-xs text-[var(--black)] shadow-sm"
          >
            <Image src="/icons/BlueDot.svg" alt="dot" width={15} height={15} />
            1/5 Scans Left
          </div>
        </div>

        {/* CENTER LOGO */}
        <div
          className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
          onClick={() => {
            router.push('/dashboard');
            handleLogout();
          }}
        >
          <Image
            src="/icons/Bulwark.svg"
            alt="Bulwark"
            width={130}
            height={34}
          />
        </div>

        {/* RIGHT (Desktop Overlap preserved) */}
        {user && (
          <div className="hidden md:flex ml-auto items-center">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-white border border-[var(--blue-light)]
              text-xs text-[var(--text-primary)] shadow-sm -mr-6 z-30"
            >
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="avatar"
                  width={15}
                  height={15}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--blue-primary)] text-white flex items-center justify-center text-[10px] uppercase">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              {user.displayName || user.email}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 pr-4 pl-8 py-2 rounded-full
              bg-red-100 text-red-600 text-xs border shadow-sm
              cursor-pointer hover:opacity-80 transition"
            >
              <Image
                src="/icons/Logout.svg"
                alt="logout"
                width={14}
                height={14}
              />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* ✅ MOBILE MENU */}
      {/* ✅ MOBILE MENU — keeps ALL overlap behavior */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[var(--border-color)] bg-white/95 backdrop-blur p-0 py-2 flex flex-col gap-2">
          {/* LEFT GROUP (Same overlap as desktop) */}
          <div className="flex items-center justify-center gap-3 scale-90">
            <button
              className="flex items-center gap-2 -mr-6 px-4 py-2 rounded-full
        bg-[var(--text-secondary)] text-[var(--text-inverse)] text-xs border cursor-pointer shadow-sm z-30"
              onClick={() => {
                setOpenUpgrade(true);
                setMobileOpen(false);
              }}
            >
              Upgrade to Forensic
              <Image
                src="/icons/WhiteDiamond.svg"
                alt="upgrade"
                width={15}
                height={15}
              />
            </button>

            <div
              className="flex items-center gap-2 pr-4 pl-6 py-2 rounded-full
        bg-[var(--card-accent)] border border-[var(--blue-secondary)]
        text-xs text-[var(--black)] shadow-sm"
            >
              <Image
                src="/icons/BlueDot.svg"
                alt="dot"
                width={15}
                height={15}
              />
              1/5 Scans Left
            </div>
          </div>

          {/* RIGHT GROUP (NOW ALSO OVERLAPS LIKE DESKTOP ✅) */}
          {user && (
            <div className="flex items-center justify-center gap-3 scale-90">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full
          bg-white border border-[var(--blue-light)]
          text-xs text-[var(--text-primary)] shadow-sm -mr-6 z-30"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="avatar"
                    width={15}
                    height={15}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[var(--blue-primary)] text-white flex items-center justify-center text-[10px] uppercase">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                {user.displayName || user.email}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 pr-12 pl-8 py-2 rounded-full
          bg-red-100 text-red-600 text-xs border shadow-sm cursor-pointer hover:opacity-80"
              >
                <Image
                  src="/icons/Logout.svg"
                  alt="logout"
                  width={14}
                  height={14}
                />
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      <UpgradeForensicModal
        open={openUpgrade}
        onClose={() => setOpenUpgrade(false)}
      />
    </>
  );
}
