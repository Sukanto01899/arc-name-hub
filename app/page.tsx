"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { NetworkWarning } from "@/components/NetworkWarning";
import { RegisterModal } from "@/components/RegisterModal";
import { ProfilePanel, addOwnedDomain } from "@/components/ProfilePanel";
import { FAQSection } from "@/components/home/FAQSection";
import { FeatureSection } from "@/components/home/FeatureSection";
import { HeroSection } from "@/components/home/HeroSection";
import { ProtocolSection } from "@/components/home/ProtocolSection";
import { ARCNAMES_ABI, ARCNAMES_ADDRESS } from "@/lib/contracts";
import { validateName } from "@/lib/domain";

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [searchedName, setSearchedName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const qc = useQueryClient();
  const { address } = useAccount();

  useEffect(() => {
    if (!inputValue.trim()) {
      setSearchedName("");
      return;
    }

    const timer = setTimeout(
      () => setSearchedName(inputValue.trim().toLowerCase()),
      500,
    );

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearch = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed) setSearchedName(trimmed);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase());
  };

  const handleRegisterSuccess = useCallback(() => {
    setShowModal(false);
    if (address && searchedName) addOwnedDomain(address, searchedName);
    qc.invalidateQueries();
  }, [address, searchedName, qc]);

  const inputName = inputValue.trim().toLowerCase();
  const inputIsValid = !!inputName && validateName(inputName).valid;

  const { data: inputPrice } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "getPrice",
    args: [inputName],
    query: { enabled: inputIsValid },
  });

  const { data: priceForModal } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "getPrice",
    args: [searchedName],
    query: { enabled: !!searchedName && validateName(searchedName).valid },
  });

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

      <main>
        <HeroSection
          inputValue={inputValue}
          inputName={inputName}
          inputPrice={inputPrice}
          searchedName={searchedName}
          onInputChange={handleInputChange}
          onSearch={handleSearch}
          onRegister={() => setShowModal(true)}
        />
        <FeatureSection />
        <ProtocolSection />
        <FAQSection />
      </main>

      <NetworkWarning />

      {showModal && searchedName && priceForModal !== undefined && (
        <RegisterModal
          name={searchedName}
          pricePerYear={priceForModal}
          isConnected={!!address}
          onSuccess={handleRegisterSuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
