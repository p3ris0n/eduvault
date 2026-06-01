"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaExternalLinkAlt, FaShoppingCart } from "react-icons/fa";
import { WalletButton } from "./WalletBtn";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/hooks/useCart";
import { useWallet } from "@/hooks/useWallet";
import { getExplorerAccountUrl } from "@/lib/config/chain";
import { formatAddress } from "@/utils/formatAddress";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { cartItems, setIsCartOpen } = useCart();
  const { address, isConnected, balances, disconnect } = useWallet();
  const balance = balances?.snapshot?.native?.balance;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-[100] flex justify-center px-4 py-4 transition-all duration-300 md:px-0 ${
        scrolled ? "bg-white/20 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-6xl items-center justify-between rounded-full border border-gray-200/60 bg-white/90 px-5 py-2.5 shadow-lg shadow-black/5 backdrop-blur-lg md:w-[90%] md:px-8 lg:w-[85%]"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-stellar-blue/20">
            <Image src="/logo.png" alt="EduVault Logo" fill className="object-cover" />
          </span>
          <span className="text-xl font-bold tracking-tight text-stellar-dark">
            EduVault<span className="text-stellar-blue">.</span>
          </span>
        </Link>

        <div className="hidden items-center space-x-8 text-sm font-semibold text-gray-600 md:flex">
          <Link href="/#howitworks" className="transition hover:text-stellar-blue">
            How It Works
          </Link>
          <Link href="/marketplace" className="transition hover:text-stellar-blue">
            Marketplace
          </Link>
          <Link
            href="https://edu-vault.gitbook.io/edu-vault-docs/"
            target="_blank"
            className="transition hover:text-stellar-blue"
          >
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex shrink-0 items-center justify-center rounded-full border border-gray-200/80 bg-gray-50 p-2.5 text-gray-700 transition hover:bg-gray-100 hover:text-stellar-blue"
            aria-label="Open shopping cart"
          >
            <FaShoppingCart className="h-4 w-4" />
            {cartItems.length > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-stellar-blue text-[9px] font-extrabold text-white">
                {cartItems.length}
              </span>
            )}
          </button>

          {isConnected && address ? (
            <div className="hidden items-center gap-4 md:flex">
              {balance && (
                <div className="hidden flex-col items-end lg:flex">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Balance
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {parseFloat(balance).toFixed(2)} XLM
                  </span>
                </div>
              )}
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 rounded-full bg-stellar-dark px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-stellar-dark/10 transition hover:bg-stellar-dark/90"
                >
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  {formatAddress(address)}
                </button>
                <div className="invisible absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <Link href="/dashboard" className="flex rounded-xl px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50">
                    Dashboard
                  </Link>
                  <a
                    href={getExplorerAccountUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center rounded-xl px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    View on Explorer <FaExternalLinkAlt className="ml-1" size={10} />
                  </a>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="flex w-full rounded-xl px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:block">
              <WalletButton />
            </div>
          )}

          <button
            type="button"
            className="flex flex-col space-y-1.5 p-2 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className={`h-0.5 w-5 bg-stellar-dark transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 bg-stellar-dark transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-stellar-dark transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-0 right-0 top-full z-50 mx-4 mt-4 flex flex-col items-center space-y-4 rounded-3xl border border-gray-100 bg-white py-8 text-gray-700 shadow-2xl md:hidden"
          >
            <Link href="/#howitworks" onClick={() => setMenuOpen(false)} className="text-lg font-bold">
              How It Works
            </Link>
            <Link href="/marketplace" onClick={() => setMenuOpen(false)} className="text-lg font-bold">
              Marketplace
            </Link>
            <Link
              href="https://edu-vault.gitbook.io/edu-vault-docs/"
              onClick={() => setMenuOpen(false)}
              className="text-lg font-bold"
            >
              Docs
            </Link>
            <ThemeToggle />
            {isConnected && address ? (
              <div className="flex w-full flex-col items-center gap-4 px-8">
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-stellar-dark">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {formatAddress(address)}
                </div>
                {balance && <p className="text-xs text-gray-500">{parseFloat(balance).toFixed(2)} XLM</p>}
                <div className="flex w-full gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-2xl bg-stellar-dark px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      disconnect();
                    }}
                    className="flex-1 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <WalletButton />
            )}
          </motion.div>
        )}
      </motion.nav>
    </header>
  );
}
