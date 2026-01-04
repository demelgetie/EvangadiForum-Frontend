import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../App";
import styles from "./Home.module.css";
import Pagination from "../../components/Pagination/Pagination";

export default function Home() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [serverPaging, setServerPaging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const formatTimeAgo = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    const units = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
      ["second", 1],
    ];
    const rtf = new Intl.RelativeTimeFormat(navigator.language || "en", {
      numeric: "auto",
    });
    for (const [unit, sec] of units) {
      if (diffSec >= sec) {
        const value = Math.floor(diffSec / sec);
        return rtf.format(-value, unit);
      }
    }
    return "";
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    try {
      return new Intl.DateTimeFormat(navigator.language || "en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(ts));
    } catch (_) {
      return "";
    }
  };

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `/api/questions?page=${page}&limit=${pageSize}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const list = res.data.questions || [];
        setQuestions(list);
        const serverTotalPages = res.data.totalPages;
        const serverPageSize = res.data.pageSize;
        const hasServerPaging =
          Number.isFinite(serverTotalPages) && Number.isFinite(serverPageSize);
        setServerPaging(hasServerPaging);
        setTotalPages(
          hasServerPaging
            ? serverTotalPages
            : Math.ceil(list.length / pageSize) || 1
        );
      } catch (err) {
        setError("load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, page]);

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        {token ? (
          <button className={styles.primary} onClick={() => navigate("/ask")}>
            {t("home.askQuestion")}
          </button>
        ) : (
          <button className={styles.primary} onClick={() => navigate("/login")}>
            {t("home.signIn")}
          </button>
        )}
      </div>
      <h2>{t("home.questions")}</h2>
      <div className={styles.filters}>
        <input
          className={styles.input}
          placeholder={t("home.search") || "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.input}
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="">{t("home.allTags") || "All tags"}</option>
          {[...new Set(questions.map((q) => q.tag).filter(Boolean))].map(
            (tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            )
          )}
        </select>
      </div>
      {loading && <div className={styles.user}>{t("common.loading")}</div>}
      {!loading && questions.length === 0 && (
        <div className={styles.user}>{t("home.empty")}</div>
      )}
      {error && <div className={styles.user}>{t("common.error")}</div>}
      <ul className={styles.list}>
        {(serverPaging
          ? questions
          : questions.slice((page - 1) * pageSize, page * pageSize)
        )
          .filter(
            (q) =>
              (selectedTag ? q.tag === selectedTag : true) &&
              (search
                ? q.title?.toLowerCase().includes(search.toLowerCase()) ||
                  q.description?.toLowerCase().includes(search.toLowerCase())
                : true)
          )
          .map((q) => (
            <li key={q.questionid} className={styles.item}>
              <div className={styles.avatar} />
              <div>
                <div className={styles.title}>{q.title}</div>
                <div className={styles.user}>
                  {q.username} • {formatTimeAgo(q.created_at)} •{" "}
                  {formatDate(q.created_at)}
                </div>
                {q.tag && <div className={styles.tag}>#{q.tag}</div>}
              </div>
              <Link to={`/question/${q.questionid}`} className={styles.arrow}>
                ›
              </Link>
            </li>
          ))}
      </ul>
      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        labels={{ prev: t("pagination.prev"), next: t("pagination.next") }}
      />
    </div>
  );
}
