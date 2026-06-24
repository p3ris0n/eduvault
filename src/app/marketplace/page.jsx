// Marketplace page: discovery filters are reflected in the URL for shareable searches.

"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaExchangeAlt,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaFilter,
  FaHeart,
  FaRegClock,
  FaSearch,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import SaveMaterialButton from "@/components/materials/SaveMaterialButton";
import RecentlyViewedMaterials from "@/components/materials/RecentlyViewedMaterials";
import { useMarketplaceMaterials } from "@/hooks/api/useMaterials";
import { useCart } from "@/hooks/useCart";
import { useComparison } from "@/hooks/useComparison";

export const dynamic = "force-dynamic";

const ALL_SUBJECT = { id: "all", label: "All" };

const DEFAULT_SUBJECTS = [
  ALL_SUBJECT,
  { id: "mathematics", label: "Math" },
  { id: "science", label: "Science" },
  { id: "law", label: "Law" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "medicine", label: "Medicine" },
  { id: "arts", label: "Arts" },
];

const LEVEL_OPTIONS = [
  { id: "", label: "Any level" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "all-levels", label: "All Levels" },
];

const CONTENT_TYPE_OPTIONS = [
  { id: "", label: "Any type" },
  { id: "pdf", label: "PDF" },
  { id: "word", label: "Word" },
  { id: "presentation", label: "Presentation" },
  { id: "spreadsheet", label: "Spreadsheet" },
  { id: "text", label: "Text" },
  { id: "zip", label: "ZIP" },
];

const LICENSE_OPTIONS = [
  { id: "", label: "Any license" },
  { id: "standard", label: "Standard License", value: "Standard License (download only)" },
  { id: "creative-commons", label: "Creative Commons", value: "Creative Commons" },
  { id: "private-use", label: "Private Use Only", value: "Private Use Only" },
];

const RATING_OPTIONS = [
  { id: "", label: "Any rating" },
  { id: "4", label: "4+ stars" },
  { id: "3", label: "3+ stars" },
  { id: "2", label: "2+ stars" },
  { id: "1", label: "1+ star" },
];

const NEWEST_OPTIONS = [
  { id: "", label: "Any date" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "popular", label: "Popular" },
  { id: "rating_desc", label: "Highest rated" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
];

function getPreviewImage(material) {
  return material.coverImageUrl || material.thumbnailUrl || material.image || "/images/image1.jpg";
}

function normalizeSubjectOptions(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return DEFAULT_SUBJECTS;

  const seen = new Set(["all"]);
  const normalized = subjects
    .map((subject) => {
      if (typeof subject === "string") {
        return subject.toLowerCase() === "all" ? ALL_SUBJECT : { id: subject, label: subject };
      }

      return {
        id: subject?.id || subject?.label,
        label: subject?.label || subject?.id,
      };
    })
    .filter((subject) => subject.id && subject.label)
    .filter((subject) => {
      const key = subject.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return [ALL_SUBJECT, ...normalized];
}

function findLabel(options, value, fallback = value) {
  return options.find((option) => option.id === value)?.label || fallback;
}

function normalizeSortParam(value) {
  switch (value) {
    case "Popular":
      return "popular";
    case "Price: Low to High":
      return "price_asc";
    case "Price: High to Low":
      return "price_desc";
    default:
      return SORT_OPTIONS.some((option) => option.id === value) ? value : "newest";
  }
}

function normalizeLicenseParam(value) {
  if (!value) return "";
  return LICENSE_OPTIONS.find((option) => option.id === value || option.value === value || option.label === value)?.id || "";
}

function getFileIcon(value) {
  const type = String(value || "").toLowerCase();

  if (type.includes("word") || type.includes("doc")) {
    return <FaFileWord className="text-blue-500" />;
  }

  if (type.includes("ppt") || type.includes("presentation") || type.includes("powerpoint")) {
    return <FaFilePowerpoint className="text-orange-500" />;
  }

  if (type.includes("pdf")) {
    return <FaFilePdf className="text-red-500" />;
  }

  return <FaFilePdf className="text-gray-500" />;
}

function getContentType(material) {
  return material.fileType || material.contentType || material.mimeType || material.fileName || material.storageKey || "pdf";
}

function formatContentType(material) {
  const value = String(getContentType(material)).toLowerCase();
  if (value.includes("doc")) return "DOC";
  if (value.includes("ppt") || value.includes("presentation")) return "PPT";
  if (value.includes("xls") || value.includes("spreadsheet")) return "XLS";
  if (value.includes("zip")) return "ZIP";
  if (value.includes("text") || value.includes("txt")) return "TXT";
  return "PDF";
}

function formatPrice(price) {
  const amount = Number(price ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return "Free";
  return `${amount} XLM`;
}

function formatRating(rating) {
  const value = Number(rating);
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "New";
}

export default function MarketPage() {
  const { addToCart, cartItems } = useCart();
  const { addToComparison, comparedItems } = useComparison();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeSubject, setActiveSubject] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [level, setLevel] = useState("");
  const [contentType, setContentType] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [minRating, setMinRating] = useState("");
  const [newest, setNewest] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  const itemsPerPage = 12;
  const subjectLabel = findLabel(subjects, activeSubject, "All");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setSearchQuery(params.get("search") || "");
    const subjectParam = params.get("subject");
    setActiveSubject(!subjectParam || subjectParam.toLowerCase() === "all" ? "all" : subjectParam);
    setSortBy(normalizeSortParam(params.get("sortBy")));
    setLevel(params.get("level") || "");
    setContentType(params.get("contentType") || "");
    setLicenseType(normalizeLicenseParam(params.get("licenseType") || params.get("usageRights")));
    setMinRating(params.get("minRating") || "");
    setNewest(params.get("newest") || "");
    setMinPrice(params.get("minPrice") || "");
    setMaxPrice(params.get("maxPrice") || "");
    setCurrentPage(Number(params.get("page") || 1));
    setHydrated(true);
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      try {
        setSubjectsLoading(true);
        const response = await fetch("/api/subjects");

        if (response.ok) {
          const data = await response.json();
          setSubjects(normalizeSubjectOptions(data.subjects));
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
        setSubjects(DEFAULT_SUBJECTS);
      } finally {
        setSubjectsLoading(false);
      }
    }

    loadSubjects();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (activeSubject !== "all") params.set("subject", activeSubject);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (level) params.set("level", level);
    if (contentType) params.set("contentType", contentType);
    if (licenseType) params.set("licenseType", licenseType);
    if (minRating) params.set("minRating", minRating);
    if (newest) params.set("newest", newest);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (currentPage > 1) params.set("page", String(currentPage));

    const query = params.toString();
    router.replace(query ? `/marketplace?${query}` : "/marketplace", { scroll: false });
  }, [
    hydrated,
    searchQuery,
    activeSubject,
    sortBy,
    level,
    contentType,
    licenseType,
    minRating,
    newest,
    minPrice,
    maxPrice,
    currentPage,
    router,
  ]);

  const queryParams = useMemo(
    () => ({
      search: deferredSearchQuery || undefined,
      subject: activeSubject !== "all" ? activeSubject : undefined,
      sortBy,
      level: level || undefined,
      contentType: contentType || undefined,
      licenseType: licenseType || undefined,
      minRating: minRating || undefined,
      newest: newest || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page: currentPage,
      pageSize: itemsPerPage,
    }),
    [
      deferredSearchQuery,
      activeSubject,
      sortBy,
      level,
      contentType,
      licenseType,
      minRating,
      newest,
      minPrice,
      maxPrice,
      currentPage,
    ]
  );

  const { data, isLoading, isFetching, isError, error } = useMarketplaceMaterials(queryParams);
  const materials = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const isRefreshing = isFetching && !isLoading;

  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchQuery) filters.push({ key: "search", label: `Search: ${searchQuery}` });
    if (activeSubject !== "all") filters.push({ key: "subject", label: `Subject: ${subjectLabel}` });
    if (level) filters.push({ key: "level", label: `Level: ${findLabel(LEVEL_OPTIONS, level)}` });
    if (contentType) filters.push({ key: "contentType", label: `Type: ${findLabel(CONTENT_TYPE_OPTIONS, contentType)}` });
    if (licenseType) filters.push({ key: "licenseType", label: `License: ${findLabel(LICENSE_OPTIONS, licenseType)}` });
    if (minRating) filters.push({ key: "minRating", label: `Rating: ${findLabel(RATING_OPTIONS, minRating)}` });
    if (newest) filters.push({ key: "newest", label: `Added: ${findLabel(NEWEST_OPTIONS, newest)}` });
    if (minPrice || maxPrice) filters.push({ key: "price", label: `Price: ${minPrice || "0"}-${maxPrice || "any"} XLM` });
    return filters;
  }, [activeSubject, contentType, level, licenseType, maxPrice, minPrice, minRating, newest, searchQuery, subjectLabel]);

  const updateFilter = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActiveSubject("all");
    setSortBy("newest");
    setLevel("");
    setContentType("");
    setLicenseType("");
    setMinRating("");
    setNewest("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar />

      <section className="flex min-h-screen flex-col bg-[#fffaf6] lg:flex-row">
        <nav aria-label="Subject filters" className="flex w-full gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          {subjectsLoading ? (
            <div className="px-4 py-1.5 text-sm text-gray-500">Loading subjects...</div>
          ) : (
            subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => updateFilter(setActiveSubject)(subject.id)}
                aria-pressed={activeSubject === subject.id}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeSubject === subject.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {subject.label}
              </button>
            ))
          )}
        </nav>

        <aside className="sticky top-0 hidden h-screen w-72 overflow-y-auto border-r border-gray-200 bg-white px-6 py-10 lg:block">
          <nav aria-label="Subject filters">
            <h2 className="mb-6 text-sm font-bold uppercase tracking-wide text-gray-900">Subjects</h2>
            <ul className="space-y-1">
              {subjectsLoading ? (
                <li className="px-3 py-2 text-sm text-gray-500">Loading subjects...</li>
              ) : (
                subjects.map((subject) => (
                  <li key={subject.id}>
                    <button
                      type="button"
                      onClick={() => updateFilter(setActiveSubject)(subject.id)}
                      aria-pressed={activeSubject === subject.id}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        activeSubject === subject.id
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {subject.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 overflow-x-hidden px-4 py-8 md:px-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="mb-2 text-xl font-bold text-gray-900 md:text-2xl">Academic Marketplace</h1>
                <p className="text-sm text-gray-600">Find materials by subject, level, type, license, rating, price, and recency.</p>
              </div>

              <Link
                href="/dashboard/upload"
                className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Share Your Notes
              </Link>
            </div>
          </motion.div>

          <RecentlyViewedMaterials />

          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Marketplace discovery filters">
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</span>
                <span className="relative block">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</span>
                <select
                  value={activeSubject}
                  onChange={(event) => updateFilter(setActiveSubject)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.id === "all" ? "All subjects" : subject.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Level</span>
                <select
                  value={level}
                  onChange={(event) => updateFilter(setLevel)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.id || "any-level"} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Content type</span>
                <select
                  value={contentType}
                  onChange={(event) => updateFilter(setContentType)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.id || "any-type"} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">License</span>
                <select
                  value={licenseType}
                  onChange={(event) => updateFilter(setLicenseType)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {LICENSE_OPTIONS.map((option) => (
                    <option key={option.id || "any-license"} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Rating</span>
                <select
                  value={minRating}
                  onChange={(event) => updateFilter(setMinRating)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {RATING_OPTIONS.map((option) => (
                    <option key={option.id || "any-rating"} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Added</span>
                <select
                  value={newest}
                  onChange={(event) => updateFilter(setNewest)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {NEWEST_OPTIONS.map((option) => (
                    <option key={option.id || "any-date"} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Min price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(event) => updateFilter(setMinPrice)(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Max price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(event) => updateFilter(setMaxPrice)(event.target.value)}
                  placeholder="Any"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) => updateFilter(setSortBy)(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaFilter className="text-gray-400" />
                  {activeFilters.length ? "Active filters" : "No filters selected"}
                </span>
                {activeFilters.map((filter) => (
                  <span key={filter.key} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {filter.label}
                  </span>
                ))}
              </div>

              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-fit text-sm font-semibold text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </section>

          <div className="mb-4 flex items-end justify-between px-1">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {activeSubject === "all" ? "All Materials" : `${subjectLabel} Materials`}
              </h2>
              <p className="text-sm text-gray-500" aria-live="polite">
                {isRefreshing ? "Updating results..." : `${data?.total || 0} results`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div aria-live="polite" aria-busy="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-xl border border-gray-200 bg-white p-5" />
              ))}
            </div>
          ) : isError ? (
            <div aria-live="polite" className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-red-600">Error loading materials</h3>
              <p className="text-gray-500">{error?.message || "Something went wrong."}</p>
            </div>
          ) : materials.length === 0 ? (
            <div aria-live="polite" className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-gray-900">No resources match these filters</h3>
              <p className="mx-auto mb-5 max-w-md text-sm text-gray-500">
                Try a broader subject, wider price range, lower rating, or a different content type.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                role="list"
                aria-busy={isRefreshing}
                aria-live="polite"
                className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                  isRefreshing ? "opacity-70" : "opacity-100"
                }`}
              >
                {materials.map((material) => {
                  const materialId = material._id || material.id;
                  const isAlreadyInCart = cartItems.some((item) => (item._id || item.id) === materialId);
                  const isAlreadyInComp = comparedItems.some((item) => (item._id || item.id) === materialId);
                  const creatorAddress = material.userAddress || material.ownerAddress || "default";
                  const materialSubject = findLabel(subjects, material.subject, material.subject || "Material");
                  const contentValue = getContentType(material);

                  return (
                    <article
                      key={materialId}
                      role="listitem"
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                    >
                      <SaveMaterialButton material={material} />

                      <Link href={`/marketplace/${materialId}`} className="relative block h-36 w-full overflow-hidden bg-gray-100">
                        <Image
                          src={getPreviewImage(material)}
                          alt={material.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {material.subject && (
                          <span className="absolute left-2 top-2 rounded-md border border-gray-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                            {materialSubject}
                          </span>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <Link href={`/marketplace/${materialId}`}>
                          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors hover:text-blue-600">
                            {material.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-gray-500">
                          by{" "}
                          <Link href={`/creator/${creatorAddress}`} className="font-semibold text-blue-600 hover:underline">
                            {material.author || "Anonymous"}
                          </Link>
                        </p>

                        <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">
                          {material.shortSummary || material.description || "No description"}
                        </p>

                        <div className="mt-auto space-y-3 border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <FaStar className="h-3.5 w-3.5 text-yellow-400" />
                              <span className="text-xs font-semibold text-gray-700">{formatRating(material.rating)}</span>
                            </div>

                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                              {formatPrice(material.price)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                {getFileIcon(contentValue)}
                                <span className="font-medium uppercase">{formatContentType(material)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <FaHeart className="h-3 w-3" />
                                {material.likes || 0}
                              </span>
                              {material.level && (
                                <span className="flex items-center gap-1">
                                  <FaRegClock className="h-3 w-3" />
                                  {findLabel(LEVEL_OPTIONS, material.level, material.level)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => addToComparison(material)}
                              className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                isAlreadyInComp
                                  ? "border-amber-600 bg-amber-500 text-white"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <FaExchangeAlt className="h-3 w-3" />
                              {isAlreadyInComp ? "Contrasted" : "Contrast"}
                            </button>

                            <button
                              type="button"
                              onClick={() => addToCart(material)}
                              className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                isAlreadyInCart
                                  ? "border-emerald-700 bg-emerald-600 text-white"
                                  : "border-blue-700 bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              <FaShoppingCart className="h-3 w-3" />
                              {isAlreadyInCart ? "In Cart" : "Add to Cart"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </motion.div>

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentPage(index + 1)}
                      aria-current={currentPage === index + 1 ? "page" : undefined}
                      className={`rounded px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        currentPage === index + 1
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </main>
      </section>
    </>
  );
}
