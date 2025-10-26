"use client";

import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import UpgradeForensicModal from "../UpgradeForensicModal";
import { useState } from "react";

export default function DashboardNavbar() {
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);

  const [openUpgrade, setOpenUpgrade] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
  };

  return (
    <header className="h-20 border-b border-[var(--border-color)] bg-[var(--background)] flex items-center px-10 relative">
      {/* LEFT SECTION */}
      <div className="flex items-center">
        {/* Upgrade Button */}
        <button
          className="flex items-center gap-2 -mr-6 px-4 py-2 rounded-full
          bg-[var(--text-secondary)]
          text-[var(--text-inverse)] text-xs border cursor-pointer
          shadow-sm  transition z-30"
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

        {/* Scans Left — OVERLAP  */}
        <div
          className="flex items-center gap-2   pr-4 pl-6 py-2 rounded-full
          bg-[var(--card-accent)] border border-[var(--blue-secondary)]
          text-xs text-[var(--black)] shadow-sm"
        >
          <Image src="/icons/BlueDot.svg" alt="dot" width={15} height={15} />
          1/5 Scans Left
        </div>
      </div>

      {/* CENTER LOGO */}
      <div
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer "
        onClick={() => router.push("/")}
      >
        <Image src="/icons/Bulwark.svg" alt="Bulwark" width={130} height={34} />
      </div>

      {/* RIGHT SECTION */}
      {user && (
        <div className="ml-auto flex items-center ">
          {/* User Profile with Photo */}
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
                {user.displayName?.[0] || "U"}
              </div>
            )}

            {user.displayName || user.email}
          </div>

          {/* Logout — OVERLAP */}
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

      <UpgradeForensicModal
        open={openUpgrade}
        onClose={() => setOpenUpgrade(false)}
      />
    </header>
  );
}
