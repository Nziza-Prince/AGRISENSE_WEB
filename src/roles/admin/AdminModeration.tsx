import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, EyeOff, Eye, Trash2, Loader2, Info } from "lucide-react";
import { IconAction } from "./users/IconAction";
import { EmptyState } from "@/components/EmptyState";
import RoleLayout from "../RoleLayout";
import { Panel, PaginationControls, getPaginationMeta } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type AdminReportItem } from "@/api";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

function getReports(data: unknown): AdminReportItem[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.posts ?? record.reports ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as AdminReportItem[]) : [];
}

function resolvePostId(item: AdminReportItem): string | null {
  if (item.postId) return String(item.postId);
  if (item.id) return String(item.id);
  return null;
}

const AdminModeration = () => {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Moderation | Admin | AGRISENSE";
  }, []);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      let res: unknown;
      try {
        res = await adminService.getReportedPosts(nextPage, PAGE_SIZE);
      } catch {
        res = await adminService.getReports(nextPage, PAGE_SIZE);
      }
      const rows = getReports(res);
      const meta = getPaginationMeta(res, nextPage, PAGE_SIZE, rows.length);
      setReports(rows);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; load is recreated each render
  }, []);

  const moderate = async (item: AdminReportItem, action: "hide" | "unhide" | "delete") => {
    const postId = resolvePostId(item);
    if (!postId) {
      setError("Missing post id for this report.");
      return;
    }
    try {
      await adminService.moderatePost(postId, { action });
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Moderation action failed.");
    }
  };

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Content Moderation"
      subtitle="Review reported community content and take action."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Panel title={`Reported items (${total || reports.length})`} className="xl:col-span-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#4338CA]" />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState art="calm" title="The community is calm" text="No post is waiting for a decision. Reported posts appear here the moment a member flags one." />
          ) : (
            <>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {reports.map((m) => (
                    <motion.li
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-3 rounded-xl border border-l-4 border-l-red-400 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{m.reason || "Reported post"}</p>
                          <p className="mt-0.5 text-sm text-gray-600">&quot;{m.excerpt || m.description || "No description"}&quot;</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {getUserDisplayName(m.author) || "Unknown user"} · reported {m.createdAt ? new Date(m.createdAt).toLocaleString() : "recently"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconAction icon={EyeOff} label="Hide post" tone="warn" onClick={() => moderate(m, "hide")} />
                        <IconAction icon={Eye} label="Show post again" tone="good" onClick={() => moderate(m, "unhide")} />
                        <IconAction icon={Trash2} label="Delete post" tone="danger" onClick={() => moderate(m, "delete")} confirm />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <PaginationControls page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE} disabled={loading} onPageChange={(next) => load(next)} />
            </>
          )}
        </Panel>

        <Panel title="How to decide">
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              [EyeOff, "Hide", "Removes the post from the community but keeps it, so you can show it again if the report was wrong."],
              [Eye, "Show again", "Brings a hidden post back after review."],
              [Trash2, "Delete", "Permanent. Use it for spam, abuse or anything illegal. Needs a second click."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Info;
              return (
                <li key={title as string} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <I className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-gray-800">{title as string}</span>
                    {text as string}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs text-indigo-900">
            To pause a person, not a post, use Suspend or Ban on the Users page.
          </p>
        </Panel>
      </div>
    </RoleLayout>
  );
};

export default AdminModeration;
