import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { formatCurrency } from "../utils/export";
import { useAlert } from "../context/AlertContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Star,
  Github,
  MessageSquare,
  Send,
  CheckCircle2,
  User,
  TrendingDown,
  TrendingUp,
  Terminal,
  Camera,
  ChevronDown,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  comment: string;
  date: string;
}

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { t, language } = useLanguage();

  // User Profile Customization state (stored in localStorage)
  const [userName, setUserName] = useState<string>("Player 1");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  // Financial summary stats
  const [allTimeExpense, setAllTimeExpense] = useState<number>(0);
  const [allTimeIncome, setAllTimeIncome] = useState<number>(0);

  // Questionnaire state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<string>(
    "Fitur & Fungsionalitas",
  );
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    // Load local profile data
    try {
      const storedName = localStorage.getItem("cointomb_user_name");
      const storedAvatar = localStorage.getItem("cointomb_user_avatar");
      if (storedName) {
        setUserName(storedName);
        setTempName(storedName);
      } else if (user?.email) {
        const defaultName = user.email.split("@")[0];
        setUserName(defaultName);
        setTempName(defaultName);
      }
      if (storedAvatar) {
        setUserAvatar(storedAvatar);
      }

      const storedFeedbacks = localStorage.getItem("cointomb_feedbacks");
      if (storedFeedbacks) {
        setFeedbackList(JSON.parse(storedFeedbacks));
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch all-time summary numbers
    api
      .get<any>("/analytics/summary")
      .then((data) => {
        if (data.allTime) {
          setAllTimeExpense(data.allTime.expense || 0);
          setAllTimeIncome(data.allTime.income || 0);
        } else {
          setAllTimeExpense(data.month?.expense || 0);
          setAllTimeIncome(data.month?.income || 0);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  // Handle Avatar Image Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: "UKURAN FOTO TERLALU BESAR",
        message: "Maksimal ukuran foto adalah 2 MB.",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setUserAvatar(base64);
      localStorage.setItem("cointomb_user_avatar", base64);
      showAlert({
        title: "FOTO BERHASIL DIPERBARUI",
        message: "Foto profil kustom kamu berhasil diunggah!",
        type: "success",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    localStorage.setItem("cointomb_user_name", tempName.trim());
    setIsEditingName(false);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showAlert("Komentar tidak boleh kosong.");
      return;
    }

    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      rating,
      category: feedbackCategory,
      comment: comment.trim(),
      date: new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    const updated = [newFeedback, ...feedbackList];
    setFeedbackList(updated);
    localStorage.setItem("cointomb_feedbacks", JSON.stringify(updated));

    setComment("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const ratingDescriptions: Record<number, string> =
    language === "en"
      ? {
          1: "1/5 - Needs Significant Improvement",
          2: "2/5 - Below Expectations",
          3: "3/5 - Good & Adequate",
          4: "4/5 - Very Good & Helpful",
          5: "5/5 - Perfect! Absolutely Love It",
        }
      : {
          1: "1/5 - Perlu Banyak Perbaikan",
          2: "2/5 - Kurang Memuaskan",
          3: "3/5 - Cukup Baik",
          4: "4/5 - Sangat Bagus & Membantu",
          5: "5/5 - Sempurna! Suka Banget",
        };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Title */}
      <div className="retro-box p-4">
        <h1 className="font-pixel text-xs sm:text-base text-[var(--text-primary)]">
          {t("profile_title")}
        </h1>
        <p className="font-arcade text-base text-[var(--text-muted)] mt-0.5">
          {t("profile_sub")}
        </p>
      </div>

      {/* ============================================================
          SECTION 1: USER PROFILE (Top Section)
          ============================================================ */}
      <div className="retro-box p-5">
        <div className="pb-3 border-b-2 border-[var(--border-color)] flex items-center justify-between mb-4">
          <span className="font-pixel text-[9px] text-[var(--text-muted)] uppercase">
            {t("user_account_overview")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Upload Button */}
          <div className="relative group shrink-0">
            <div className="h-24 w-24 border-[3px] border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center justify-center overflow-hidden shadow-[var(--glow-shadow)]">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-[var(--text-primary)]" />
              )}
            </div>

            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 p-1.5 border-2 border-[var(--border-color)] bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 transition cursor-pointer shadow-[var(--glow-shadow-sm)]"
              title="Unggah Foto Profil"
            >
              <Camera className="h-3.5 w-3.5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            {isEditingName ? (
              <div className="flex items-center gap-2 max-w-xs justify-center sm:justify-start">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="retro-input text-xs py-1 px-2 font-pixel"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="retro-btn-accent text-[8px] py-1 px-2"
                >
                  {t("save_btn")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="font-pixel text-sm sm:text-base text-[var(--text-primary)]">
                  {userName}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="font-arcade text-xs text-[var(--text-muted)] underline hover:text-[var(--text-primary)]"
                >
                  {t("change_name")}
                </button>
              </div>
            )}
            <span className="font-mono text-xs text-[var(--text-muted)] block mt-1 truncate">
              {user?.email}
            </span>

            {/* Semantic Summary Arus Kas (Red & Green) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t-2 border-[var(--border-color)] font-mono text-xs">
              <div className="p-2.5 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] min-w-0">
                <div className="flex items-center gap-1.5 text-green-600 font-pixel text-[8px] uppercase">
                  <TrendingUp className="h-3 w-3 stroke-[3] shrink-0" />
                  <span className="truncate">{t("stat_total_income")}</span>
                </div>
                <div className="font-arcade text-lg sm:text-xl md:text-2xl font-bold tracking-wider text-green-600 mt-1 truncate">
                  +{formatCurrency(allTimeIncome)}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono block truncate">
                  {t("cumulative_all_wallets")}
                </span>
              </div>

              <div className="p-2.5 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] min-w-0">
                <div className="flex items-center gap-1.5 text-red-600 font-pixel text-[8px] uppercase">
                  <TrendingDown className="h-3 w-3 stroke-[3] shrink-0" />
                  <span className="truncate">{t("stat_total_expense")}</span>
                </div>
                <div className="font-arcade text-lg sm:text-xl md:text-2xl font-bold tracking-wider text-red-600 mt-1 truncate">
                  -{formatCurrency(allTimeExpense)}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono block truncate">
                  {t("cumulative_all_wallets")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          SECTION 2: QUESTIONNAIRE & FEEDBACK (Middle Section)
          ============================================================ */}
      <div className="retro-box p-5">
        <div className="pb-3 border-b-2 border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[var(--text-primary)]" />
            <h2 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)]">
              {t("feedback_section_title")}
            </h2>
          </div>
          <span className="retro-badge text-[7px]">{t("feedback_badge")}</span>
        </div>

        {submitted && (
          <div className="my-4 p-3 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center gap-2 font-mono text-xs text-[var(--text-primary)] shadow-[var(--glow-shadow-sm)]">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 stroke-[2.5]" />
            <span>{t("feedback_success_msg")}</span>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-4">
          {/* Star Rating Selection */}
          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-2 uppercase">
              {t("star_rating_label")}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1.5 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition transform active:scale-95"
                    title={`${star} Bintang`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        isFilled
                          ? "fill-current text-amber-500"
                          : "text-[var(--text-muted)] opacity-30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="font-arcade text-base text-[var(--text-muted)] mt-1.5 block">
              {ratingDescriptions[hoverRating !== null ? hoverRating : rating]}
            </span>
          </div>

          {/* Topic */}
          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              {t("review_topic_label")}
            </label>
            <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full appearance-none bg-transparent pl-3 pr-8 py-2 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="Fitur & Fungsionalitas">
                  {t("topic_features")}
                </option>
                <option value="Tampilan & Desain 8-Bit">
                  {t("topic_design")}
                </option>
                <option value="Kemudahan Penggunaan PWA">
                  {t("topic_pwa")}
                </option>
                <option value="Laporan Masalah / Bug">{t("topic_bug")}</option>
                <option value="Saran Fitur Baru">{t("topic_ideas")}</option>
              </select>
              <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              {t("review_comments_label")}
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("review_comments_placeholder")}
              className="retro-input w-full font-mono text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            className="retro-btn-accent w-full py-2 px-4 text-xs flex items-center justify-center gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {t("btn_submit_review")}
          </button>
        </form>

        {/* Feedback History */}
        {feedbackList.length > 0 && (
          <div className="mt-5 pt-4 border-t-2 border-[var(--border-color)]">
            <h4 className="font-pixel text-[9px] text-[var(--text-muted)] mb-2 uppercase">
              {t("user_reviews_history")} ({feedbackList.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 border border-[var(--border-color)] bg-[var(--bg-card-subtle)] font-mono text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            item.rating >= s
                              ? "fill-current text-amber-500"
                              : "text-gray-400 opacity-30"
                          }`}
                        />
                      ))}
                      <span className="retro-badge text-[7px] ml-1.5">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-arcade text-xs text-[var(--text-muted)]">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-[var(--text-primary)] text-xs mt-1">
                    "{item.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          SECTION 3: DEV PROFILE (Bottom Section - Inisial DZ saja)
          ============================================================ */}
      <div className="retro-box p-5">
        <div className="pb-3 border-b-2 border-[var(--border-color)] flex items-center justify-between">
          <span className="font-pixel text-[9px] text-[var(--text-muted)] uppercase">
            {t("dev_profile_section")}
          </span>
          <Terminal className="h-4 w-4 text-[var(--text-primary)]" />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="h-16 w-16 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center justify-center shrink-0 shadow-[var(--glow-shadow-sm)]">
            <span className="font-pixel text-xl font-bold text-[var(--text-primary)]">
              DZ
            </span>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)]">
              {t("dev_name")}
            </h3>
            <p className="font-arcade text-sm sm:text-base text-[var(--text-muted)] mt-0.5 leading-snug">
              {t("dev_role")}
            </p>

            <div className="mt-3 p-2.5 border border-[var(--border-color)] bg-[var(--bg-card-subtle)] inline-block max-w-full">
              <span className="font-pixel text-[7px] text-[var(--text-muted)] block mb-1 uppercase">
                {t("dev_github_heading")}
              </span>
              <a
                href="https://github.com/Fadhli12-zak"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold flex items-center justify-center sm:justify-start gap-1.5 text-[var(--text-primary)] hover:underline text-xs font-mono truncate"
              >
                <Github className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  GitHub Developer DZ (github.com/dz)
                </span>
              </a>
            </div>

            <p className="font-pixel text-[7px] sm:text-[8px] text-[var(--text-muted)] mt-3">
              © 2026 dz. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
