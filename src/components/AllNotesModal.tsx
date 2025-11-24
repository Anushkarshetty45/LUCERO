import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { UserNote } from '../types'
import './AllNotesModal.css'

interface AllNotesModalProps {
  userId: string
  onClose: () => void
  onOpenNote: (courseId: string, noteId: string) => void
}

export default function AllNotesModal({ userId, onClose, onOpenNote }: AllNotesModalProps) {
  const [notes, setNotes] = useState<(UserNote & { course_title?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAllNotes()
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
          course_title: courseTitles?.[note.course_id] || 'Unknown Course'
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
    if (!window.confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const filteredNotes = notes.filter(note =>
    note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content all-notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📝 All My Notes</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-small"></div>
              <p>Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-notes">
              <p>📚 No notes found</p>
              {searchQuery && <p className="hint">Try a different search term</p>}
              {!searchQuery && <p className="hint">Create notes from your courses</p>}
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
                        onClick={() => onOpenNote(note.course_id, note.id)}
                      >
                        Open
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
        </div>

        <div className="modal-footer">
          <p className="notes-count">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} found
          </p>
        </div>
      </div>
    </div>
  )
}

