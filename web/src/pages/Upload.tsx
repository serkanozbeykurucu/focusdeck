import { DragEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { documentsApi } from '../services/api';

export function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function acceptFile(f: File | undefined) {
    if (!f) return;
    const ok =
      f.type === 'application/pdf' ||
      f.type === 'text/plain' ||
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.txt');
    if (!ok) {
      setError('Please upload a PDF or .txt file');
      return;
    }
    setError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a file first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await documentsApi.upload(file, title || file.name);
      navigate('/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer title="Upload" subtitle="PDF or plain text — we extract the content for flashcard generation.">
      <Card className="mx-auto max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition ${
              dragOver ? 'border-accent bg-accent-soft/40' : 'border-surface-border bg-surface-muted'
            }`}
          >
            <UploadIcon className="mb-3 text-accent" size={28} />
            <p className="text-sm text-ink">Drag & drop a file here</p>
            <p className="mt-1 text-xs text-ink-faint">or</p>
            <label className="mt-3 cursor-pointer">
              <span className="btn-secondary">Browse files</span>
              <input
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </label>
            {file && (
              <p className="mt-4 text-sm font-medium text-accent-dark">{file.name}</p>
            )}
          </div>

          <Input
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Algorithms Week 3"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || !file}>
            {loading ? 'Uploading…' : 'Upload document'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
