import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import API from '../services/api';

const formatDateTime = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('ka-GE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const CourseDetailModal = ({ course, isOwner, onClose }) => {
  const [students, setStudents] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    setStudentsLoading(true);
    setStudentsError('');
    API.get(`courses/${course.id}/students/`)
      .then((res) => setStudents(res.data))
      .catch(() => setStudentsError('მოსწავლეების სიის ჩატვირთვა ვერ მოხერხდა.'))
      .finally(() => setStudentsLoading(false));
  }, [course.id, isOwner]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDateText = formatDateTime(course.start_date);

  const getInstructorDisplayName = (instructor) => {
    if (!instructor) return 'უცნობი მასწავლებელი';
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
    return fullName || instructor.username;
  };

  const getStudentDisplayName = (student) => {
    if (!student) return '—';
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    return fullName || student.username;
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="დახურვა">✕</button>

        <div className="modal-header">
          {course.image && (
            <img src={course.image} alt={course.title} className="modal-image" />
          )}
          <div>
            <span className="category-badge">{course.category_name}</span>
            <h2 className="modal-title">{course.title}</h2>
            <span className="price-tag">{Number(course.price) > 0 ? `${course.price} ₾` : 'უფასო'}</span>
          </div>
        </div>

        <div className="modal-section">
          <h4>აღწერა</h4>
          <p>{course.description}</p>
        </div>

        {course.syllabus && (
          <div className="modal-section">
            <h4>სილაბუსი — რას ისწავლით</h4>
            <p style={{whiteSpace: 'pre-line'}}>{course.syllabus}</p>
          </div>
        )}

        <div className="modal-info-grid">
          <div className="modal-info-item">
            <span className="modal-info-label">📅 დაწყების თარიღი</span>
            <span className="modal-info-value">{startDateText || 'ჯერ დაუზუსტებელია'}</span>
          </div>
          <div className="modal-info-item">
            <span className="modal-info-label">⏳ ხანგრძლივობა</span>
            <span className="modal-info-value">
              {course.duration_weeks ? `${course.duration_weeks} კვირა` : 'დაუზუსტებელია'}
            </span>
          </div>
          <div className="modal-info-item">
            <span className="modal-info-label">🎓 ჩარიცხული მოსწავლეები</span>
            <span className="modal-info-value">{course.students_count}</span>
          </div>
        </div>

        {isOwner ? (
          <div className="modal-section">
            <h4>ჩარიცხული მოსწავლეები ({course.students_count})</h4>
            {studentsLoading ? (
              <div className="loading-spinner" style={{padding: '20px 0'}}>იტვირთება...</div>
            ) : studentsError ? (
              <div className="alert-error">{studentsError}</div>
            ) : students && students.length === 0 ? (
              <p style={{color: 'var(--text-secondary)'}}>ჯერ არავინ ჩარიცხულა ამ კურსზე.</p>
            ) : students ? (
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>სტუდენტი</th>
                      <th>ელ. ფოსტა</th>
                      <th>ტელეფონი</th>
                      <th>ჩარიცხვის თარიღი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>{getStudentDisplayName(enrollment.student)}</td>
                        <td>{enrollment.student.email || '—'}</td>
                        <td>{enrollment.student.phone || '—'}</td>
                        <td>{formatDateTime(enrollment.enrolled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="modal-section">
            <h4>მასწავლებელი</h4>
            <div className="instructor-info">
              <span className="instructor-avatar">🧑‍🏫</span>
              <div>
                <strong>{getInstructorDisplayName(course.instructor)}</strong>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                  ✉️ {course.instructor?.email || 'ელფოსტა მითითებული არ არის'}
                </div>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                  📞 {course.instructor?.phone || 'ტელეფონი მითითებული არ არის'}
                </div>
                {/* bio გამოდის პირდაპირ ტელეფონის ქვემოთ "სტატუსი:" პრეფიქსით */}
                {course.instructor?.bio && (
                  <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px'}}>
                    🎓 <strong>სტატუსი:</strong> {course.instructor.bio}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CourseDetailModal;
