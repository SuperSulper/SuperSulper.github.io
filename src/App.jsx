import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import './styles.css';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ label: '', detail: '' });
  const [status, setStatus] = useState(hasSupabaseConfig ? 'Supabase 연결 중' : 'Supabase 설정 필요');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const totalEntries = entries.length;
  const latestEntry = entries[0]?.label ?? '없음';
  const latestUpdatedAt = useMemo(() => formatDate(entries[0]?.created_at), [entries]);

  const loadEntries = useCallback(async () => {
    if (!hasSupabaseConfig) {
      return;
    }

    setIsLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('entries')
      .select('id, label, detail, created_at')
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setStatus('Supabase 연결 실패');
      setIsLoading(false);
      return;
    }

    setEntries(data ?? []);
    setStatus('Supabase 연결됨');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasSupabaseConfig || !form.label.trim() || !form.detail.trim()) {
      return;
    }

    setIsSaving(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('entries')
      .insert({
        label: form.label.trim(),
        detail: form.detail.trim()
      })
      .select('id, label, detail, created_at')
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setEntries((current) => [data, ...current]);
    setForm({ label: '', detail: '' });
    setIsSaving(false);
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">React + Supabase</p>
          <h1>Hi, 슈퍼설퍼</h1>
        </div>
        <span className="status-pill">{status}</span>
      </section>

      <section className="metrics-grid" aria-label="Supabase 요약">
        <article>
          <span>rows</span>
          <strong>{totalEntries}</strong>
        </article>
        <article>
          <span>latest</span>
          <strong>{latestEntry}</strong>
        </article>
        <article>
          <span>updated</span>
          <strong>{latestUpdatedAt}</strong>
        </article>
      </section>

      {!hasSupabaseConfig ? (
        <section className="setup-panel">
          <h2>환경변수 설정</h2>
          <pre>{'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...'}</pre>
        </section>
      ) : null}

      <section className="workspace-grid">
        <form className="tool-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>새 레코드</h2>
            <button type="submit" disabled={isSaving || !hasSupabaseConfig}>
              {isSaving ? '저장 중' : '저장'}
            </button>
          </div>

          <label>
            이름
            <input
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="예: 슈퍼설퍼"
            />
          </label>

          <label>
            내용
            <textarea
              value={form.detail}
              onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))}
              placeholder="Supabase에 저장할 내용을 입력하세요"
              rows="5"
            />
          </label>
        </form>

        <section className="tool-panel">
          <div className="panel-heading">
            <h2>Supabase</h2>
            <button
              type="button"
              className="secondary-button"
              disabled={isLoading || !hasSupabaseConfig}
              onClick={loadEntries}
            >
              {isLoading ? '불러오는 중' : '새로고침'}
            </button>
          </div>

          <div className="connection-summary">
            <span>table</span>
            <strong>entries</strong>
          </div>
          <div className="connection-summary">
            <span>client</span>
            <strong>{hasSupabaseConfig ? 'configured' : 'missing env'}</strong>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </section>
      </section>

      <section className="data-section">
        <div className="panel-heading">
          <h2>entries 테이블</h2>
        </div>

        {entries.length ? (
          <div className="entry-list">
            {entries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <span>#{entry.id}</span>
                <h3>{entry.label}</h3>
                <p>{entry.detail}</p>
                <time>{formatDate(entry.created_at)}</time>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{isLoading ? '불러오는 중입니다.' : '저장된 레코드가 없습니다.'}</p>
        )}
      </section>
    </main>
  );
}
