import { useState, useEffect } from 'react'
import { getAllUserNotes, createUserNote, updateUserNote, deleteUserNote } from '../services/api'
import { UserNote } from '../types'
import './NotesModal.css'

interface NotesModalProps {
  userId: string
  courseId: string
  courseTitle: string
  onClose: () => void
}

type View = 'menu' | 'list' | 'create' | 'edit'

export default function NotesModal({ userId, courseId, courseTitle, onClose }: NotesModalProps) {
  const [view, setView] = useState<View>('menu')
  const [notes, setNotes] = useState<UserNote[]>([])
  const [currentNote, setCurrentNote] = useState<UserNote | null>(null)
  const [newTopic, setNewTopic] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (view === 'list') {
      loadNotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const data = await getAllUserNotes(userId, courseId)
      setNotes(data)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newTopic.trim() || !content.trim()) {
      alert('Please enter both topic and content')
      return
    }

    setSaving(true)
    try {
      await createUserNote(userId, courseId, newTopic, content)
      alert('Note created successfully!')
      setView('menu')
      setNewTopic('')
      setContent('')
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Failed to create note')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!currentNote || !content.trim()) {
      alert('Please enter content')
      return
    }

    setSaving(true)
    try {
      await updateUserNote(currentNote.id, content)
      alert('Note updated successfully!')
      setView('list')
      setCurrentNote(null)
      setContent('')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    } finally {
      setSaving(false)
    }
  }

  const handleEditNote = (note: UserNote) => {
    setCurrentNote(note)
    setContent(note.content)
    setView('edit')
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return

    try {
      await deleteUserNote(noteId)
      loadNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Menu View */}
        {view === 'menu' && (
          <>
            <div className="notes-header">
              <div>
                <h2>📝 My Notes</h2>
                <p className="course-name">{courseTitle}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-menu">
              <button 
                className="menu-option"
                onClick={() => setView('create')}
              >
                <span className="menu-icon">✏️</span>
                <div>
                  <h3>Create New Note</h3>
                  <p>Start writing a new note on a specific topic</p>
                </div>
              </button>
              <button 
                className="menu-option"
                onClick={() => setView('list')}
              >
                <span className="menu-icon">📚</span>
                <div>
                  <h3>View Existing Notes</h3>
                  <p>Browse and edit your previously created notes</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* List View */}
        {view === 'list' && (
          <>
            <div className="notes-header">
              <div>
                <h2>📚 My Notes</h2>
                <p className="course-name">{courseTitle}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              {loading ? (
                <p>Loading notes...</p>
              ) : notes.length === 0 ? (
                <div className="empty-notes">
                  <p>No notes yet</p>
                  <button className="btn-primary" onClick={() => setView('create')}>
                    Create Your First Note
                  </button>
                </div>
              ) : (
                <div className="notes-list">
                  {notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-item-header">
                        <h3>{note.topic}</h3>
                        <div className="note-actions">
                          <button onClick={() => handleEditNote(note)}>✏️ Edit</button>
                          <button onClick={() => handleDeleteNote(note.id)}>🗑️ Delete</button>
                        </div>
                      </div>
                      <p className="note-preview">{note.content.substring(0, 100)}...</p>
                      <p className="note-date">Last updated: {new Date(note.updated_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="notes-footer">
              <button className="btn-secondary" onClick={() => setView('menu')}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* Create View */}
        {view === 'create' && (
          <>
            <div className="notes-header">
              <div>
                <h2>✏️ Create New Note</h2>
                <p className="course-name">{courseTitle}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              <div className="form-group">
                <label>Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g., Organic Chemistry Basics"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Your Notes</label>
                <textarea
                  className="notes-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your notes here..."
                />
              </div>
            </div>
            <div className="notes-footer">
              <button className="btn-secondary" onClick={() => setView('menu')}>
                ← Back
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateNote}
                disabled={saving}
              >
                {saving ? 'Creating...' : '💾 Create Note'}
              </button>
            </div>
          </>
        )}

        {/* Edit View */}
        {view === 'edit' && currentNote && (
          <>
            <div className="notes-header">
              <div>
                <h2>✏️ Edit Note</h2>
                <p className="course-name">{currentNote.topic}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              <textarea
                className="notes-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your notes here..."
              />
            </div>
            <div className="notes-footer">
              <div className="last-saved">
                Last saved: {new Date(currentNote.updated_at).toLocaleString()}
              </div>
              <div className="notes-actions">
                <button className="btn-secondary" onClick={() => setView('list')}>
                  ← Back
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleUpdateNote}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
