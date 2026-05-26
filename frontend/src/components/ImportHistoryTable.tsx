'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, FileText } from 'lucide-react';
import { api, ImportBatch } from '@/lib/api';

interface Props {
  refreshTrigger: number;
  onBatchDeleted: () => void;
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function ImportHistoryTable({ refreshTrigger, onBatchDeleted }: Props) {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getImportBatches();
      setBatches(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus batch ini dan semua feedback-nya?')) return;
    setDeleting(id);
    try {
      await api.deleteImportBatch(id);
      await load();
      onBatchDeleted();
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  );

  if (batches.length === 0) return null;

  return (
    <div className="table-card" style={{ marginTop: 16 }}>
      <div className="table-header">
        <span className="table-title">Import History</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{batches.length} batch</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Rows</th>
            <th>Status</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="#9CA3AF" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{b.fileName}</span>
                </div>
              </td>
              <td style={{ fontWeight: 600, color: '#059669' }}>{b.importedCount}</td>
              <td>
                <span className="badge badge-positive">{b.status}</span>
              </td>
              <td style={{ fontSize: 12, color: '#9CA3AF' }}>{fmt(b.createdAt)}</td>
              <td>
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handleDelete(b.id)}
                  disabled={deleting === b.id}
                >
                  {deleting === b.id ? (
                    <div className="spinner" style={{ width: 12, height: 12 }} />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
