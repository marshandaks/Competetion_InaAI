'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  onComplete: () => void;
}

export default function CsvUpload({ onComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are accepted');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await api.uploadCsv(file);
      onComplete();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onComplete]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="chart-card" style={{ marginBottom: 16 }}>
      <p className="chart-title">Import CSV Data</p>
      <label
        className={`upload-zone${dragging ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ display: 'block', cursor: 'pointer' }}
      >
        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onInputChange} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {uploading ? (
            <div className="spinner" />
          ) : (
            <UploadCloud size={36} color="#10B981" strokeWidth={1.5} />
          )}
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            {uploading ? 'Uploading…' : 'Drop CSV file here, or click to browse'}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>
            Columns: customer_name, rating, feedback, created_at
          </p>
        </div>
      </label>
      {error && (
        <p style={{ marginTop: 10, fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</p>
      )}
    </div>
  );
}
