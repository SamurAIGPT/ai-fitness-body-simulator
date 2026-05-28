"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { FaBolt, FaCoins, FaCheckCircle, FaStar, FaDumbbell } from "react-icons/fa";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loadingTier, setLoadingTier] = useState(null);

  const tiers = [
    {
      id: "basic",
      name: "Basic Pack",
      credits: 1000,
      price: 5,
      description: "Perfect for testing high-fidelity fitness simulations.",
      features: [
        "1k - 4k Resolution Choice",
        "Full Aspect Ratio Control",
        "Permanent Cloud Backup",
        "Standard Speed Processing",
      ],
      highlight: false,
    },
    {
      id: "standard",
      name: "Standard Pack",
      credits: 2000,
      price: 10,
      description: "Standard load for running multiple physique reconfigurations.",
      features: [
        "Priority Engine Processing",
        "Standard Muscle Tuning",
        "Standard Support Access",
        "100% Secure Checkout",
      ],
      highlight: false,
    },
    {
      id: "pro",
      name: "Professional Pack",
      credits: 4000,
      price: 20,
      description: "High-octane generation for serious transformations.",
      features: [
        "Priority Engine Processing",
        "Advanced Athlete Details",
        "Google Smart Search Refinement",
        "Priority Developer Support",
      ],
      highlight: true,
    },
    {
      id: "business",
      name: "Business Pack",
      credits: 10000,
      price: 50,
      description: "Uncapped configuration capabilities for the fitness elite.",
      features: [
        "Uncapped 4k Multi-Generations",
        "Direct API Integration Access",
        "Bulk Photo Upload Capability",
        "24/7 Concierge Support",
      ],
      highlight: false,
    },
  ];

  const handleCheckout = async (planId, tierName) => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    try {
      setLoadingTier(tierName);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Stripe checkout session error:", err);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="flex-1 bg-transparent overflow-y-auto custom-scrollbar p-4 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 text-center space-y-4 pt-4 md:pt-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-bold tracking-[0.4em] uppercase">
          Fuel your physique engine
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-foreground drop-shadow-sm uppercase">
          CREDIT TIERS
        </h1>
        <p className="text-muted font-bold text-[10px] uppercase tracking-widest max-w-xl mx-auto leading-loose">
          Unlock higher fidelity, faster polling, and permanent storage. <br />
          Choose your kinetic energy.
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-20">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-8 rounded border transition-all flex flex-col ${
              tier.highlight
                ? "bg-glass-bg border-primary-500 shadow-xl shadow-primary-500/5"
                : "bg-glass-bg border-glass-border shadow-sm"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary-500 text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                MOST POTENT
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-black tracking-tight mb-2 text-foreground drop-shadow-sm uppercase">
                {tier.name}
              </h3>
              <p className="text-xs text-muted font-semibold leading-relaxed">
                {tier.description}
              </p>
            </div>

            <div className="mb-8 flex items-end gap-1">
              <span className="text-4xl font-black tracking-tight text-foreground drop-shadow-sm">
                ${tier.price}
              </span>
              <span className="text-[10px] font-bold text-muted mb-1.5 uppercase tracking-widest">
                / One-Time
              </span>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 rounded bg-solid-bg border border-glass-border shadow-inner">
                <FaCoins className="text-yellow-500 text-lg" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-muted uppercase tracking-widest leading-none mb-1">
                    Yields
                  </span>
                  <span className="text-lg font-black text-foreground drop-shadow-sm">
                    {tier.credits} CREDITS
                  </span>
                </div>
              </div>

              <ul className="space-y-3 pt-2">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-3 text-xs font-semibold text-muted"
                  >
                    <FaCheckCircle className="text-primary-500 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleCheckout(tier.id, tier.name)
              }
              disabled={loadingTier === tier.name}
              className={`w-full h-12 rounded font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer ${
                tier.highlight
                  ? "bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20"
                  : "bg-solid-bg text-foreground hover:opacity-80 border border-glass-border"
              } disabled:opacity-20`}
            >
              {loadingTier === tier.name ? (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Purchase Credits{" "}
                  <FaBolt
                    className={
                      tier.highlight ? "text-yellow-400" : "text-muted"
                    }
                  />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Credit Counter stats footer */}
      <footer className="max-w-7xl mx-auto py-12 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-[9px] font-bold tracking-[0.4em] text-muted uppercase">
            Kinetic Balance
          </div>
          <div className="text-lg font-semibold flex items-center gap-3 text-muted">
            Currently Holding:{" "}
            <span className="text-foreground font-black">
              {session?.user?.credits || 0} Credits
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-muted text-[9px] font-bold uppercase tracking-widest text-center">
          <FaStar className="text-yellow-500/30 hidden sm:block animate-spin" /> Secure Encryption via Stripe{" "}
          <FaStar className="text-yellow-500/30 hidden sm:block animate-spin" />
        </div>
      </footer>
    </div>
  );
}
