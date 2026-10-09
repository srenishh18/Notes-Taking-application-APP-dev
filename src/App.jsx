import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  Check,
  Clock3,
  FileText,
  LoaderCircle,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const colors = [
  { id: 'butter', label: 'Butter', hex: '#f5e8bd' },
  { id: 'mint', label: 'Mint', hex: '#dcebe1' },
  { id: 'rose', label: 'Rose', hex: '#f1deda' },
  { id: 'sky', label: 'Sky', hex: '#dce9ee' },
  { id: 'lilac', label: 'Lilac', hex: '#e9e1ed' },
  { id: 'paper', label: 'Paper', hex: '#eeece5' },
];

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || 'The request could not be completed.');
  }

  return response.status === 204 ? null : response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function App() {
  const [notes, setNotes] = useState([]);
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    request('/api/notes')
      .then(setNotes)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeNote) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) setActiveNote(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, saving]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesView = view === 'all' || note.pinned;
      const matchesQuery = !normalizedQuery || `${note.title} ${note.content}`.toLowerCase().includes(normalizedQuery);
      return matchesView && matchesQuery;
    });
  }, [notes, query, view]);

  async function createNote() {
    setError('');
    const now = new Date().toISOString();
    setActiveNote({ title: '', content: '', color: 'butter', pinned: false, createdAt: now, updatedAt: now });
  }

  async function saveNote(draft) {
    setSaving(true);
    try {
      const savedNote = await request(draft._id ? `/api/notes/${draft._id}` : '/api/notes', {
        method: draft._id ? 'PUT' : 'POST',
        body: JSON.stringify({ title: draft.title.trim(), content: draft.content, color: draft.color, pinned: draft.pinned }),
      });
      setNotes((current) => draft._id
        ? current.map((note) => (note._id === savedNote._id ? savedNote : note))
        : [savedNote, ...current]);
      setActiveNote(null);
      setToast(draft._id ? 'Note saved' : 'Note created');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePinned(note) {
    try {
      const updatedNote = await request(`/api/notes/${note._id}`, {
        method: 'PUT',
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      setNotes((current) => current.map((item) => (item._id === note._id ? updatedNote : item)));
    } catch (pinError) {
      setError(pinError.message);
    }
  }

  async function deleteNote(note) {
    if (!note._id) {
      setActiveNote(null);
      return;
    }
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    try {
      await request(`/api/notes/${note._id}`, { method: 'DELETE' });
      setNotes((current) => current.filter((item) => item._id !== note._id));
      setActiveNote(null);
      setToast('Note deleted');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const greetingDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Little Notes home" onClick={() => setView('all')}>
          <span className="brand-mark"><BookOpenText size={20} strokeWidth={1.8} /></span>
          <span>little notes<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Note views">
          <button className={`nav-item ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
            <FileText size={18} strokeWidth={1.8} />
            <span>All notes</span>
            <span className="nav-count">{notes.length}</span>
          </button>
          <button className={`nav-item ${view === 'pinned' ? 'active' : ''}`} onClick={() => setView('pinned')}>
            <Pin size={18} strokeWidth={1.8} />
            <span>Pinned</span>
            <span className="nav-count">{notes.filter((note) => note.pinned).length}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note-icon"><Sparkles size={16} /></div>
          <p>Your ideas, gathered in one quiet place.</p>
          <span>SYNCED WITH ATLAS</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{view === 'all' ? 'All notes' : 'Pinned'}</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} strokeWidth={1.8} />
              <input aria-label="Search notes" placeholder="Search your notes" value={query} onChange={(event) => setQuery(event.target.value)} />
              {query && <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}
            </label>
            <button className="new-note-button" onClick={createNote}><Plus size={18} /> <span>New note</span></button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-mark" /> A PLACE FOR YOUR THOUGHTS</div>
              <h1>{view === 'all' ? <>Make room<br />for <em>good ideas.</em></> : <>Keep close<br />what <em>matters.</em></>}</h1>
              <p className="heading-date"><Clock3 size={15} strokeWidth={1.7} /> {greetingDate}</p>
            </div>
            <div className="note-summary"><span>{visibleNotes.length.toString().padStart(2, '0')}</span><small>{visibleNotes.length === 1 ? 'NOTE' : 'NOTES'} IN VIEW</small></div>
          </section>

          {error && <div className="notice" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss message"><X size={17} /></button></div>}

          {loading ? (
            <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>Gathering your notes...</span></div>
          ) : visibleNotes.length ? (
            <section className="notes-grid" aria-label={view === 'all' ? 'All notes' : 'Pinned notes'}>
              {visibleNotes.map((note, index) => (
                <article className={`note-card note-${note.color}`} key={note._id} style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}>
                  <div className="note-card-top">
                    <span className="note-date">{formatDate(note.updatedAt)}</span>
                    <button className={`icon-button pin-button ${note.pinned ? 'is-pinned' : ''}`} title={note.pinned ? 'Unpin note' : 'Pin note'} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} onClick={() => togglePinned(note)}>
                      <Pin size={17} strokeWidth={1.8} />
                    </button>
                  </div>
                  <button className="note-open" onClick={() => setActiveNote(note)}>
                    <span className="note-title">{note.title}</span>
                    <span className="note-preview">{note.content || 'A fresh page. Add a thought, a reminder, or anything worth keeping.'}</span>
                  </button>
                  <div className="note-card-bottom"><span>{note.content.length ? `${note.content.trim().split(/\s+/).length} words` : 'Just started'}</span><span className="card-dot" /></div>
                </article>
              ))}
            </section>
          ) : (
            <section className="empty-state">
              <div className="empty-mark"><FileText size={23} strokeWidth={1.5} /></div>
              <h2>{query ? 'No matching notes' : view === 'pinned' ? 'Nothing pinned yet' : 'A fresh page'}</h2>
              <p>{query ? 'Try another phrase or clear your search.' : view === 'pinned' ? 'Pin a note to keep it close at hand.' : 'Start with the thought that is on your mind.'}</p>
              {!query && view === 'all' && <button className="empty-create" onClick={createNote}><Plus size={17} /> Create your first note</button>}
            </section>
          )}

          <footer className="page-footer"><span>Thoughts are better when they have somewhere to land.</span><span><span className="footer-status" /> {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved</span></footer>
        </div>
      </main>

      {activeNote && <NoteEditor note={activeNote} saving={saving} onClose={() => setActiveNote(null)} onSave={saveNote} onDelete={deleteNote} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function NoteEditor({ note, saving, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...note });
  const selectedColor = colors.find((color) => color.id === draft.color)?.hex ?? colors[0].hex;

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onSave(draft);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="editor" role="dialog" aria-modal="true" aria-label="Note editor" style={{ '--editor-color': selectedColor }}>
        <form onSubmit={submit}>
          <header className="editor-toolbar">
            <div className="editor-label"><span className="editor-dot" /> NOTE EDITOR</div>
            <div className="editor-actions">
              <button type="button" className={`icon-button editor-pin ${draft.pinned ? 'is-pinned' : ''}`} title={draft.pinned ? 'Unpin note' : 'Pin note'} aria-label={draft.pinned ? 'Unpin note' : 'Pin note'} onClick={() => update('pinned', !draft.pinned)}><Pin size={18} /></button>
              <button type="button" className="icon-button" title="Close editor" aria-label="Close editor" onClick={onClose}><X size={19} /></button>
            </div>
          </header>
          <input id="editor-heading" className="editor-title" aria-label="Note title" autoFocus maxLength={120} placeholder="Give this note a title" value={draft.title} onChange={(event) => update('title', event.target.value)} />
          <textarea className="editor-content" maxLength={20000} placeholder="Start writing..." value={draft.content} onChange={(event) => update('content', event.target.value)} />
          <footer className="editor-footer">
            <div className="color-picker" role="group" aria-label="Note color">
              {colors.map((color) => <button key={color.id} type="button" className={`color-swatch ${draft.color === color.id ? 'selected' : ''}`} style={{ '--swatch': color.hex }} title={color.label} aria-label={`${color.label} note color`} aria-pressed={draft.color === color.id} onClick={() => update('color', color.id)} />)}
            </div>
            <span className="character-count">{draft.content.length.toLocaleString()} / 20,000</span>
          </footer>
          <div className="editor-bottom">
            <button type="button" className="delete-button" onClick={() => onDelete(note)}><Trash2 size={16} /> Delete</button>
            <div className="editor-bottom-actions">
              <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="save-button" disabled={saving || !draft.title.trim()}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} {saving ? 'Saving' : 'Save note'}</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;