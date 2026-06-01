"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useAccount } from "wagmi";
import ConnectWalletModal from "./ConnectWalletModal";
import Web3TransactionFallback from "@/components/web3/Web3TransactionFallback";
import TransactionStatusPanel from "@/components/transactions/TransactionStatusPanel";
import { useCreatePurchase } from "@/hooks/api/usePurchases";
import { useTransactionCenter } from "@/providers/TransactionProvider";
import { TransactionStatus } from "@/lib/transactions/transaction";
import { ACCEPTED_ASSET } from "@/lib/config/chain";

const SUPPORTED_ASSETS = [
  { code: ACCEPTED_ASSET, issuer: null, label: `Stellar ${ACCEPTED_ASSET}` },
];

function useQuote(materialId, asset, price) {
  const quote = useMemo(() => {
    if (!materialId || !asset) return null;
    return { amount: price, asset: asset.code, fee: 0.1 };
  }, [materialId, asset, price]);

  return { loading: false, quote, refresh: () => undefined };
}

function createLocalTxHash() {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function BuyNowModal({
  isOpen,
  onClose,
  price,
  materialId,
  materialTitle,
  materialCreator,
}) {
  const { address } = useAccount();
  const createPurchaseMutation = useCreatePurchase();
  const {
    activeTransaction,
    beginTransaction,
    markStatus,
    confirmTransaction,
    failTransaction,
    clearTransaction,
  } = useTransactionCenter();

  const [showWallet, setShowWallet] = useState(false);
  const [email, setEmail] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [web3Error, setWeb3Error] = useState(null);
  const [selectedAsset] = useState(SUPPORTED_ASSETS[0]);

  const { loading: quoteLoading, quote, refresh } = useQuote(materialId, selectedAsset, price);
  const explorerHint = useMemo(() => activeTransaction?.explorerUrl || null, [activeTransaction]);
  const isSubmitting = createPurchaseMutation.isPending || activeTransaction?.status === TransactionStatus.Submitting;

  function handleClose() {
    setShowWallet(false);
    setPurchased(false);
    setWeb3Error(null);
    clearTransaction();
    onClose();
  }

  async function handlePay() {
    if (!address) {
      beginTransaction({
        scope: "purchase",
        title: "Wallet approval required",
        message: "Connect your wallet to finish this purchase.",
      });
      setShowWallet(true);
      return;
    }

    const txHash = createLocalTxHash();

    try {
      setWeb3Error(null);
      beginTransaction({
        scope: "purchase",
        title: "Submitting purchase",
        message: "Recording the purchase and preparing entitlement reconciliation.",
      });

      markStatus(TransactionStatus.Submitting, {
        title: "Submitting purchase",
        message: "Saving the purchase request and confirming the payment intent.",
      });

      const result = await createPurchaseMutation.mutateAsync({
        buyerAddress: address,
        materialId,
        transactionHash: txHash,
        email,
      });

      const confirmedHash = result?.purchase?.transactionHash || result?.transactionHash || txHash;

      markStatus(TransactionStatus.PendingConfirmation, {
        txHash: confirmedHash,
        title: "Awaiting confirmation",
        message: "The purchase request has been submitted and is waiting for sync.",
      });

      await new Promise((resolve) => window.setTimeout(resolve, 700));

      confirmTransaction({
        txHash: confirmedHash,
        title: "Purchase confirmed",
        message: "Your access is ready and the material has been added to your library.",
      });

      setPurchased(true);
      window.setTimeout(handleClose, 1800);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Purchase failed. Please try again.");
      setWeb3Error(error);
      failTransaction(error, {
        title: "Purchase failed",
        message: error.message || "We could not complete the purchase.",
        retryable: true,
      });
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close checkout"
              >
                <FaTimes />
              </button>

              {purchased ? (
                <div className="py-8 text-center">
                  <FaCheckCircle className="mx-auto mb-4 text-5xl text-emerald-500" />
                  <h2 className="mb-2 text-xl font-bold text-slate-900">Purchase successful</h2>
                  <p className="text-sm text-slate-600">
                    The material is now in your dashboard and ready to download.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 pr-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Checkout
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Buy now</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {materialTitle || `Material #${materialId}`} by {materialCreator || "Unknown"}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="checkout-email" className="mb-2 block text-xs font-semibold text-slate-600">
                      Email address
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.edu"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {quoteLoading ? "Calculating..." : `${quote?.amount || price} ${quote?.asset || ACCEPTED_ASSET}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={refresh}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                      >
                        Refresh
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Estimated network fee: {quote?.fee ?? 0.1} XLM</p>
                  </div>

                  {web3Error && (
                    <Web3TransactionFallback
                      error={web3Error}
                      onRetry={handlePay}
                      className="mb-4"
                    />
                  )}

                  {activeTransaction && <TransactionStatusPanel transaction={activeTransaction} className="mb-4" />}

                  {explorerHint && (
                    <a
                      href={explorerHint}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      View transaction <FaExternalLinkAlt />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isSubmitting}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isSubmitting ? <FaSpinner className="animate-spin" /> : null}
                    {address ? "Pay with wallet" : "Connect wallet"}
                  </button>

                  <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                    <FaExclamationTriangle className="mt-0.5 text-amber-500" />
                    Purchases are synced after wallet approval so review access can be verified.
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <ConnectWalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
        </>
      )}
    </AnimatePresence>
  );
}
