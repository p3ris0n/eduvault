"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaExternalLinkAlt, FaShoppingBag } from "react-icons/fa";
import Image from "next/image";
import { useAccount } from "wagmi";
import Web3TransactionFallback from "@/components/web3/Web3TransactionFallback";
import ConnectWalletModal from "./ConnectWalletModal";
import TransactionStatusPanel from "@/components/transactions/TransactionStatusPanel";
import { useCreatePurchase } from "@/hooks/api/usePurchases";
import { useTransactionCenter } from "@/providers/TransactionProvider";
import { TransactionStatus } from "@/lib/transactions/transaction";
import { getExplorerTxUrl, ACCEPTED_ASSET } from "@/lib/config/chain";

const SUPPORTED_ASSETS = [
  { code: ACCEPTED_ASSET, issuer: null, label: `Stellar ${ACCEPTED_ASSET}` },
];

function useQuote(materialId, asset, price) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!materialId || !asset) return;
    const loadingTimer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    const timeout = window.setTimeout(() => {
      if (asset.code === "XLM") {
        setQuote({ amount: price, asset: "XLM", fee: 0.1 });
      } else if (asset.code === "USDC") {
        setQuote({
          amount: (parseFloat(price) * 0.5).toFixed(2),
          asset: "USDC",
          fee: 0.05,
        });
      } else {
        setQuote(null);
      }
      setLoading(false);
    }, 700);

    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(timeout);
    };
  }, [materialId, asset, price]);

  return { loading, error, quote, refresh: () => setQuote(null) };
}

function createLocalTxHash() {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function BuyNowModal({ isOpen, onClose, price, materialId, materialTitle, materialCreator }) {
  const { address } = useAccount();
  const createPurchaseMutation = useCreatePurchase();
  const [showWallet, setShowWallet] = useState(false);
  const [email, setEmail] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("idle"); // idle | pending | success | failed
  const [web3Error, setWeb3Error] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const { loading: quoteLoading, error: quoteError, quote, refresh } = useQuote(materialId, selectedAsset, price);

  const handlePay = async () => {
    if (!address) {
      setShowWallet(true);
      return;
    }

    setPurchaseStatus("pending");
    setWeb3Error(null);

    try {
      const simulatedHash = "simulated_hash_" + Math.random().toString(36).substring(7);

      const result = await createPurchaseMutation.mutateAsync({
        buyerAddress: address,
        materialId,
        transactionHash: simulatedHash,
        email,
      });

      setPurchaseResult({
        materialId,
        transactionHash: simulatedHash,
        amount: quote?.amount || price,
        asset: quote?.asset || "XLM",
        purchasedAt: new Date().toISOString(),
        title: materialTitle || `Material #${materialId}`,
        creator: materialCreator || "Unknown",
      });

      setPurchaseStatus("success");
    } catch (err) {
      console.error("Purchase failed:", err);
      setPurchaseStatus("failed");
      setWeb3Error(err instanceof Error ? err : new Error("Purchase failed. Please try again."));
    }
  };

  const handleRetry = () => {
    setPurchaseStatus("idle");
    setWeb3Error(null);
    setPurchaseResult(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-sm p-6 relative">
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                PAYMENT ASSET
              </label>
              <select
                value={selectedAsset.code}
                onChange={(e) =>
                  setSelectedAsset(
                    SUPPORTED_ASSETS.find((asset) => asset.code === e.target.value) ||
                    SUPPORTED_ASSETS[0],
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.code} value={asset.code}>
                    {asset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">You will pay</span>
              {quoteLoading ? (
                <span className="text-slate-400">Loading quote...</span>
              ) : quoteError ? (
                <span className="text-rose-500">Error loading quote</span>
              ) : quote ? (
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Image
                    src={selectedAsset.code === "XLM" ? "/images/stellar.png" : "/images/celo.png"}
                    alt={selectedAsset.label}
                    width={20}
                    height={20}
                  />
                  {quote.amount} {quote.asset}
                  {quote.fee ? (
                    <span className="text-xs text-slate-400">+{quote.fee} fee</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-slate-400">No quote available</span>
              )}
              <button
                type="button"
                onClick={refresh}
                className="ml-2 text-xs font-medium text-blue-600 underline"
              >
                Refresh
              </button>
            </div>

            <TransactionStatusPanel
              transaction={activeTransaction}
              onRetry={handlePay}
              onClear={clearTransaction}
            />

            {web3Error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">Purchase failed</p>
                <p className="mt-1 leading-6">{web3Error.message}</p>
                {explorerHint ? (
                  <a
                    href={explorerHint}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-rose-700 underline"
                  >
                    View transaction
                  </a>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={handlePay}
              disabled={createPurchaseMutation.isPending || quoteLoading || !quote}
              className="mt-5 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {activeTransaction.status === TransactionStatus.PendingConfirmation
                ? "Waiting for confirmation..."
                : createPurchaseMutation.isPending
                  ? "Processing..."
                  : "Pay with wallet"}
            </button>
          </motion.div>

          <ConnectWalletModal
            isOpen={showWallet}
            onClose={() => setShowWallet(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
