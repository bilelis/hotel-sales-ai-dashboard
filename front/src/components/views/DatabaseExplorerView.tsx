import React, { useEffect, useState } from 'react';
import type { TableMeta } from '../../types';
import { getTablesMetadata, getTableData } from '../../api';
import { IconSearch, IconRefresh, IconX } from '../icons';

export const DatabaseExplorerView: React.FC<{ onToast: (msg: string, type?: 'success' | 'error') => void }> = ({ onToast }) => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('reservations');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [inspectedDoc, setInspectedDoc] = useState<any | null>(null);

  // Fetch tables metadata
  useEffect(() => {
    getTablesMetadata()
      .then((res) => {
        setTables(res.tables || []);
      })
      .catch((err) => {
        onToast(err.message || 'Failed to list database tables', 'error');
      });
  }, []);

  // Fetch rows for selected table
  const fetchTableRows = () => {
    setLoading(true);
    getTableData(selectedTable, { page, limit, search })
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setLoading(false);
      })
      .catch((err) => {
        onToast(err.message || 'Error fetching table data', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTableRows();
  }, [selectedTable, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTableRows();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Determine headers from items
  const headers = items.length > 0
    ? Object.keys(items[0]).filter((k) => k !== 'charges' && k !== 'payments')
    : [];

  const formatCellValue = (val: any): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') {
      if ('number' in val && 'type' in val) return `Room ${val.number} (${val.type})`;
      if ('name' in val) return String(val.name);
      return JSON.stringify(val).slice(0, 35) + '...';
    }
    return String(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Hotel Database Hub & Raw Records
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              {tables.length} Collections • {tables.reduce((acc, t) => acc + t.count, 0).toLocaleString()} Total Rows
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise data browser: direct query access into MongoDB collections, schema structures, and historical logs.
          </p>
        </div>

        <button
          onClick={fetchTableRows}
          className="p-2 self-start md:self-auto rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Refresh table"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      {/* Table Selector Pills */}
      <div className="glass-panel p-4">
        <span className="text-xs font-semibold text-slate-400 block mb-2.5">
          Select Database Collection:
        </span>
        <div className="flex flex-wrap gap-2">
          {tables.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setSelectedTable(t.name);
                setPage(1);
                setSearch('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                selectedTable === t.name
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{t.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedTable === t.name
                    ? 'bg-slate-950 text-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {t.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400 text-sm">{selectedTable}</span>
            <span className="text-xs text-slate-400">
              ({total.toLocaleString()} records matched)
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={`Filter records in ${selectedTable}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                {headers.map((h) => (
                  <th key={h} className="py-3 px-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={headers.length + 2} className="py-20 text-center text-slate-400">
                    Querying collection records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 2} className="py-20 text-center text-slate-500">
                    No documents found in this table matching current query.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr
                    key={row._id ?? idx}
                    onClick={() => setInspectedDoc(row)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    {headers.map((h) => (
                      <td key={h} className="py-2.5 px-4 max-w-xs truncate text-slate-300 font-mono text-[11px]">
                        {formatCellValue(row[h])}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedDoc(row);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 text-[10px] font-bold transition"
                      >
                        JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
            <span>rows (Page {page} of {totalPages})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition font-medium"
            >
              Previous
            </button>
            <span className="font-mono font-bold text-slate-200 px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Raw Document Inspector Modal */}
      {inspectedDoc && (
        <div className="modal-overlay" onClick={() => setInspectedDoc(null)}>
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-fade-in text-slate-100 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Document Inspector: <span className="font-mono text-amber-400">{selectedTable}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  ID: {inspectedDoc._id ?? 'Unknown'}
                </span>
              </div>
              <button
                onClick={() => setInspectedDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300">
              <pre className="whitespace-pre-wrap word-break-all">
                {JSON.stringify(inspectedDoc, null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => setInspectedDoc(null)} className="btn-secondary">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
