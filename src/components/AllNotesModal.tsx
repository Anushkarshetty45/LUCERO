import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/supabase'
import { UserNote } from '../types'
import CreateNoteModal from './CreateNoteModal'
import './AllNotesModal.css'

interface AllNotesModalProps {
  userId: string
  onClose: () => void
  onOpenNote: (courseId: string, noteId: string) => void
}

export default function AllNotesModal({ userId, onClose, onOpenNote }: AllNotesModalProps) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<(UserNote & { course_title?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<(UserNote & { course_title?: string }) | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadAllNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadAllNotes = async () => {
    try {
      setLoading(true)
      
      // Get all notes for the user
      const { data: notesData, error: notesError } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (notesError) throw notesError

      // Get course titles for each note
      if (notesData && notesData.length > 0) {
        const courseIds = Array.from(new Set(notesData.map(n => n.course_id)))
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds)

        if (coursesError) throw coursesError

        const courseTitles = coursesData?.reduce((acc, course) => {
          acc[course.id] = course.title
          return acc
        }, {} as Record<string, string>)

        const notesWithCourses = notesData.map(note => ({
          ...note,
          course_title: courseTitles?.[note.course_id] || t('notes.unknownCourse')
        }))

        setNotes(notesWithCourses)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!window.confirm(t('notes.deleteConfirm'))) return

    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert(t('notes.errorDelete'))
    }
  }

  const handleNoteCreated = () => {
    loadAllNotes()
  }

  const handleOpenNote = (note: UserNote & { course_title?: string }) => {
    setSelectedNote(note)
    setNoteContent(note.content)
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('user_notes')
        .update({ content: noteContent, updated_at: new Date().toISOString() })
        .eq('id', selectedNote.id)

      if (error) throw error

      // Update the note in the local state
      setNotes(notes.map(n =>
        n.id === selectedNote.id
          ? { ...n, content: noteContent, updated_at: new Date().toISOString() }
          : n
      ))

      setSelectedNote(null)
      setNoteContent('')
    } catch (error) {
      console.error('Error saving note:', error)
      alert(t('notes.errorSave'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackToList = () => {
    setSelectedNote(null)
    setNoteContent('')
  }

  const filteredNotes = notes.filter(note =>
    note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content all-notes-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('notes.allNotes')}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="btn-create-note" onClick={() => setShowCreateModal(true)}>
                <span>+</span> {t('notes.newNote')}
              </button>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>

        <div className="modal-body">
          {selectedNote ? (
            /* Note Editor View */
            <div className="note-editor-view">
              <div className="note-editor-header">
                <div>
                  <h3>{selectedNote.topic}</h3>
                  <span className="course-badge">{selectedNote.course_title}</span>
                </div>
              </div>
              <textarea
                className="note-editor-textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={t('notes.notesPlaceholder')}
              />
              <div className="note-editor-footer">
                <span className="last-saved">
                  {t('notes.lastSaved')}: {new Date(selectedNote.updated_at).toLocaleString()}
                </span>
                <div className="note-editor-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleBackToList}
                    disabled={isSaving}
                  >
                    {t('notes.back')}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveNote}
                    disabled={isSaving}
                  >
                    {isSaving ? t('notes.saving') : t('notes.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Notes List View */
            <>
              <div className="search-box">
                <input
                  type="text"
                  placeholder={t('notes.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner-small"></div>
                  <p>{t('notes.loadingNotes')}</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="empty-notes">
                  <p>{t('notes.noNotesFound')}</p>
                  {searchQuery && <p className="hint">{t('notes.tryDifferentSearch')}</p>}
                  {!searchQuery && <p className="hint">{t('notes.createNotesHint')}</p>}
                </div>
              ) : (
                <div className="notes-grid">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="note-card">
                      <div className="note-card-header">
                        <h3>{note.topic}</h3>
                        <span className="course-badge">{note.course_title}</span>
                      </div>
                      <div className="note-card-preview">
                        {note.content.slice(0, 150)}...
                      </div>
                      <div className="note-card-footer">
                        <span className="note-date">
                          {new Date(note.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <div className="note-actions">
                          <button
                            className="btn-view"
                            onClick={() => handleOpenNote(note)}
                          >
                            {t('notes.open')}
                          </button>
                          <button
                            className="btn-delete-note"
                            onClick={() => handleDelete(note.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <p className="notes-count">
            {t('notes.notesCount', { count: filteredNotes.length })}
          </p>
        </div>
      </div>
    </div>

    {showCreateModal && (
      <CreateNoteModal
        userId={userId}
        onClose={() => setShowCreateModal(false)}
        onNoteCreated={handleNoteCreated}
      />
    )}
    </>
  )
}

