"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Navbar from "@/components/Navbar";
import { ProfilePanel } from "@/components/ProfilePanel";

export default function ManageNamePage() {
  const { isConnected } = useAccount();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <Navbar
        onProfileClick={() => setShowProfile((value) => !value)}
        showProfilePanel={showProfile}
      />

      {showProfile && (
        <div className="fixed right-0 top-0 z-40 w-full px-6 pt-20 sm:w-auto sm:px-8 lg:px-10">
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </div>
      )}

      <main className="min-h-screen px-6 pb-16 pt-28 sm:px-8 lg:px-10">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--arc-cream)" }}>
              ArcNames
            </p>
            <h1
              className="mt-3 text-4xl font-medium leading-tight sm:text-5xl"
              style={{ color: "var(--arc-text)" }}
            >
              Manage Names
            </h1>
            <p
              className="mt-4 max-w-2xl text-base leading-relaxed"
              style={{ color: "var(--arc-muted2)" }}
            >
              Review your registered names, set a primary identity, check availability, and manage your wallet session.
            </p>
          </div>

          {isConnected ? (
            <ProfilePanel mode="page" onClose={() => setShowProfile(false)} />
          ) : (
            <div
              className="rounded-[8px] p-6"
              style={{
                background: "rgba(19, 50, 80, 0.72)",
                border: "1px solid var(--arc-border)",
                boxShadow: "0 16px 64px rgba(0,0,0,0.26)",
              }}
            >
              <p className="mb-4 text-sm" style={{ color: "var(--arc-muted2)" }}>
                Connect your wallet to manage your ArcNames.
              </p>
              <ConnectButton />
            </div>
          )}
        </section>
      </main>
    </>
  );
}
