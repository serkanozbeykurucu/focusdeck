import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { documentsApi } from '../services/api';
import type { DocumentSummary, PromptStrategy } from '../types';

const STRATEGIES: { value: PromptStrategy; label: string }[] = [
  { value: 'ZERO_SHOT', label: 'Zero-shot' },
  { value: 'FEW_SHOT', label: 'Few-shot' },
  { value: 'BLOOM_BASED', label: 'Bloom-based' },
];

export function Documents() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [genDoc, setGenDoc] = useState<DocumentSummary | null>(null);
  const [strategy, setStrategy] = useState<PromptStrategy>('ZERO_SHOT');
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await documentsApi.list();
      setDocuments(data.documents);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm('Delete this document and its flashcards?')) return;
    try {
      await documentsApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function onGenerate() {
    if (!genDoc) return;
    setGenerating(true);
    setGenMessage('');
    try {
      const { data } = await documentsApi.generateFlashcards(genDoc.id, strategy, 10);
      setGenMessage(`Generated ${data.count} flashcards.`);
      await load();
    } catch (err) {
      setGenMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageContainer
      title="Documents"
      subtitle="Upload study material and generate flashcards with Gemini."
      actions={
        <Link to="/upload">
          <Button>
            <Plus size={16} />
            Upload new
          </Button>
        </Link>
      }
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : documents.length === 0 ? (
        <Card>
          <p className="text-ink-muted">No documents yet.</p>
          <Link to="/upload" className="mt-3 inline-block">
            <Button>Upload your first file</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium text-ink">{doc.title}</h2>
                <p className="text-sm text-ink-muted">
                  {doc.wordCount} words · {doc.flashcardCount} cards ·{' '}
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => { setGenDoc(doc); setGenMessage(''); }}>
                  <Sparkles size={16} />
                  Generate flashcards
                </Button>
                {doc.flashcardCount > 0 && (
                  <Link to={`/study/${doc.id}`}>
                    <Button>Study</Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={() => void onDelete(doc.id)} aria-label="Delete">
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!genDoc}
        title="Generate flashcards"
        onClose={() => !generating && setGenDoc(null)}
      >
        <p className="mb-3 text-sm text-ink-muted">
          Strategy for <strong>{genDoc?.title}</strong> (thesis Chapter 4 comparison).
        </p>
        <label className="label">Prompt strategy</label>
        <select
          className="input mb-4"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as PromptStrategy)}
          disabled={generating}
        >
          {STRATEGIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {genMessage && <p className="mb-3 text-sm text-ink">{genMessage}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setGenDoc(null)} disabled={generating}>
            Close
          </Button>
          <Button onClick={() => void onGenerate()} disabled={generating}>
            {generating ? 'Generating…' : 'Generate 10'}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
