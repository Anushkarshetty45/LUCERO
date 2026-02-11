import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAllUserNotes, createUserNote, updateUserNote, deleteUserNote } from '../services/api'
import { UserNote } from '../types'
import { useSettings } from '../contexts/SettingsContext'
import { useAutoSave } from '../hooks/useAutoSave'
import { useSoundEffects } from '../hooks/useSoundEffects'
import './NotesModal.css'

interface NotesModalProps {
  userId: string
  courseId: string
  courseTitle: string
  onClose: () => void
}

type View = 'menu' | 'list' | 'create' | 'edit'

export default function NotesModal({ userId, courseId, courseTitle, onClose }: NotesModalProps) {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { playSuccess, playError } = useSoundEffects()
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
      playError()
      alert(t('notesModal.errorBothFields'))
      return
    }

    setSaving(true)
    try {
      await createUserNote(userId, courseId, newTopic, content)
      playSuccess()
      alert(t('notesModal.successCreate'))
      setView('menu')
      setNewTopic('')
      setContent('')
    } catch (error) {
      console.error('Error creating note:', error)
      playError()
      alert(t('notesModal.errorCreate'))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!currentNote || !content.trim()) {
      playError()
      alert(t('notesModal.errorContent'))
      return
    }

    setSaving(true)
    try {
      await updateUserNote(currentNote.id, content)
      playSuccess()
      alert(t('notesModal.successUpdate'))
      setView('list')
      setCurrentNote(null)
      setContent('')
    } catch (error) {
      console.error('Error updating note:', error)
      playError()
      alert(t('notesModal.errorUpdate'))
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSave = async () => {
    if (!currentNote || !content.trim()) {
      return
    }

    try {
      await updateUserNote(currentNote.id, content)
      // Update the current note's timestamp
      if (currentNote) {
        setCurrentNote({ ...currentNote, updated_at: new Date().toISOString() })
      }
    } catch (error) {
      console.error('Error auto-saving note:', error)
    }
  }

  const { triggerAutoSave, isSaving: isAutoSaving, lastSaved, autoSaveEnabled } = useAutoSave({
    onSave: handleAutoSave,
    delay: 2000
  })

  const handleEditNote = (note: UserNote) => {
    setCurrentNote(note)
    setContent(note.content)
    setView('edit')
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm(t('notesModal.confirmDelete'))) return

    try {
      await deleteUserNote(noteId)
      playSuccess()
      loadNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      playError()
      alert(t('notesModal.errorDelete'))
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
                <h2>{t('notesModal.title')}</h2>
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
                  <h3>{t('notesModal.createNewNote')}</h3>
                  <p>{t('notesModal.createDescription')}</p>
                </div>
              </button>
              <button
                className="menu-option"
                onClick={() => setView('list')}
              >
                <span className="menu-icon">📚</span>
                <div>
                  <h3>{t('notesModal.viewExisting')}</h3>
                  <p>{t('notesModal.viewDescription')}</p>
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
                <h2>{t('notesModal.listTitle')}</h2>
                <p className="course-name">{courseTitle}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              {loading ? (
                <p>{t('notesModal.loading')}</p>
              ) : notes.length === 0 ? (
                <div className="empty-notes">
                  <p>{t('notesModal.noNotes')}</p>
                  <button className="btn-primary" onClick={() => setView('create')}>
                    {t('notesModal.createFirst')}
                  </button>
                </div>
              ) : (
                <div className="notes-list">
                  {notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-item-header">
                        <h3>{note.topic}</h3>
                        <div className="note-actions">
                          <button onClick={() => handleEditNote(note)}>{t('notesModal.edit')}</button>
                          <button onClick={() => handleDeleteNote(note.id)}>{t('notesModal.delete')}</button>
                        </div>
                      </div>
                      <p className={`note-preview font-${settings.note_font_size}`}>{note.content.substring(0, 100)}...</p>
                      <p className="note-date">{t('notesModal.lastUpdated')} {new Date(note.updated_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="notes-footer">
              <button className="btn-secondary" onClick={() => setView('menu')}>
                {t('notesModal.back')}
              </button>
            </div>
          </>
        )}

        {/* Create View */}
        {view === 'create' && (
          <>
            <div className="notes-header">
              <div>
                <h2>{t('notesModal.createNewNote')}</h2>
                <p className="course-name">{courseTitle}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              <div className="form-group">
                <label>{t('notesModal.topicName')}</label>
                <input
                  type="text"
                  placeholder={t('notesModal.topicPlaceholder')}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('notesModal.yourNotes')}</label>
                <textarea
                  className={`notes-textarea font-${settings.note_font_size}`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('notesModal.notesPlaceholder')}
                />
              </div>
            </div>
            <div className="notes-footer">
              <button className="btn-secondary" onClick={() => setView('menu')}>
                {t('notesModal.back')}
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateNote}
                disabled={saving}
              >
                {saving ? t('notesModal.creating') : t('notesModal.createButton')}
              </button>
            </div>
          </>
        )}

        {/* Edit View */}
        {view === 'edit' && currentNote && (
          <>
            <div className="notes-header">
              <div>
                <h2>{t('notesModal.editNote')}</h2>
                <p className="course-name">{currentNote.topic}</p>
              </div>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="notes-body">
              <textarea
                className={`notes-textarea font-${settings.note_font_size}`}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  triggerAutoSave()
                }}
                placeholder={t('notesModal.notesPlaceholder')}
              />
            </div>
            <div className="notes-footer">
              <div className="last-saved">
                {isAutoSaving && autoSaveEnabled ? (
                  <>{t('notesModal.autoSaving')}</>
                ) : lastSaved && autoSaveEnabled ? (
                  <>{t('notesModal.autoSaved')} {lastSaved.toLocaleTimeString()}</>
                ) : (
                  <>{t('notesModal.lastSaved')} {new Date(currentNote.updated_at).toLocaleString()}</>
                )}
              </div>
              <div className="notes-actions">
                <button className="btn-secondary" onClick={() => setView('list')}>
                  {t('notesModal.back')}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUpdateNote}
                  disabled={saving}
                >
                  {saving ? t('notesModal.saving') : t('notesModal.saveButton')}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
