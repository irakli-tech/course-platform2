import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CourseDetailModal from '../components/CourseDetailModal';

const PAGE_SIZE = 6;

const formatCourseDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ka-GE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return iso;
  }
};

const isCourseStarted = (startDateIso) => {
  if (!startDateIso) return false;
  return new Date() >= new Date(startDateIso);
};

const MyCoursesPage = () => {
  const { isTeacher } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const initialPage = location.state?.fromPage || 1;

  const [courses, setCourses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const getInstructorDisplayName = (instructor) => {
    if (!instructor) return '';
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
    return fullName || instructor.username;
  };

  const loadData = () => {
    setLoading(true);
    setError('');

    const request = isTeacher
      ? API.get('courses/mine/', { params: { page } })
      : API.get('my-courses/', { params: { page } });

    request
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.results || []);
        const normalized = isTeacher ? list : list.map((enrollment) => enrollment.course);
        setCourses(normalized);
        setCount(Array.isArray(data) ? normalized.length : (data.count ?? normalized.length));
      })
      .catch((err) => {
        console.error('ჩემი კურსების წამოღების შეცდომა:', err);
        setError('კურსების ჩატვირთვა ვერ მოხერხდა.');
        setCourses([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const handleUnenroll = (course) => {
    if (isCourseStarted(course.start_date)) {
      alert('კურსი უკვე დაიწყო, ჩარიცხვის გაუქმება შეუძლებელია.');
      return;
    }
    if (!window.confirm(`გსურთ გააუქმოთ ჩარიცხვა კურსზე „${course.title}“?`)) return;
    setBusyId(course.id);
    API.post(`courses/${course.id}/unenroll/`)
      .then(() => {
        if (courses.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          loadData();
        }
      })
      .catch((err) => alert(err.response?.data?.detail || 'ჩარიცხვის გაუქმება ვერ მოხერხდა.'))
      .finally(() => setBusyId(null));
  };

  const handleDelete = (course) => {
    if (!window.confirm(`გსურთ წაშალოთ კურსი „${course.title}“? ეს მოქმედება ვერ გაუქმდება.`)) return;
    setBusyId(course.id);
    API.delete(`courses/${course.id}/`)
      .then(() => {
        if (courses.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          loadData();
        }
      })
      .catch(() => alert('კურსის წაშლა ვერ მოხერხდა.'))
      .finally(() => setBusyId(null));
  };

  return (
    <div>
      <div className="page-header-row">
        <h2 className="section-title">
          {isTeacher ? 'ჩემ მიერ შექმნილი კურსები' : 'ჩემი ჩარიცხული კურსები'}
          {count > 0 && <span className="section-count"> ({count})</span>}
        </h2>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => navigate('/create-course')}>
            + კურსის დამატება
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">მონაცემები იტვირთება...</div>
      ) : error ? (
        <div className="alert-error">{error}</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{isTeacher ? '🧑‍🏫' : '🎓'}</div>
          <h2>{isTeacher ? 'ჯერ არ გაქვთ შექმნილი კურსი' : 'ჯერ არცერთ კურსზე არ ხართ ჩარიცხული'}</h2>
          <p>
            {isTeacher
              ? 'შექმენით პირველი კურსი და გააზიარეთ თქვენი ცოდნა.'
              : 'დაათვალიერეთ ხელმისაწვდომი კურსები და აირჩიეთ ის, რაც გაინტერესებთ.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate(isTeacher ? '/create-course' : '/')}>
            {isTeacher ? 'კურსის შექმნა' : 'კურსების დათვალიერება'}
          </button>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {courses.map((course) => {
              const started = isCourseStarted(course.start_date);

              return (
                <div key={course.id} className="card">
                  <div>
                    <div className="card-header">
                      <div className="card-icon-wrapper">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="card-icon" />
                        ) : (
                          <span style={{ fontSize: '1.4rem' }}>{isTeacher ? '🧑‍🏫' : '🎓'}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="card-title">{course.title}</h3>
                        <span className="category-badge">{course.category_name}</span>
                      </div>
                    </div>
                    <p className="card-body">{course.description}</p>
                    
                    {course.start_date && (
                      <div style={{ margin: '8px 0', fontSize: '0.88rem', color: '#6366f1', fontWeight: '600' }}>
                        📅 კურსის დაწყება: {formatCourseDate(course.start_date)}
                      </div>
                    )}

                    <div className="card-meta">
                      {isTeacher ? (
                        <span>🎓 {course.students_count} ჩარიცხული მოსწავლე</span>
                      ) : (
                        <span>👨‍🏫 {course.teacher_name || getInstructorDisplayName(course.instructor)}</span>
                      )}
                      <span className="price-tag">{Number(course.price) > 0 ? `${course.price} ₾` : 'უფასო'}</span>
                    </div>
                  </div>

                  <div className="card-footer card-footer-wrap">
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedCourse(course)}>
                      დეტალურად
                    </button>
                    {isTeacher ? (
                      <>
                        <button
                          className="btn btn-outline"
                          style={{ flex: 1 }}
                          onClick={() => navigate(`/edit-course/${course.id}`, { state: { fromPage: page } })}
                        >
                          ✏️ ჩასწორება
                        </button>
                        <button
                          className="btn btn-outline btn-danger"
                          disabled={busyId === course.id}
                          onClick={() => handleDelete(course)}
                        >
                          {busyId === course.id ? '...' : '🗑 წაშლა'}
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-outline"
                        style={{
                          flex: 1,
                          ...(started ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#334155', color: '#94a3b8' } : {})
                        }}
                        disabled={started || busyId === course.id}
                        onClick={() => handleUnenroll(course)}
                      >
                        {busyId === course.id ? '...' : started ? 'ჩარიცხვის გაუქმება' : 'გაუქმება'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← წინა
              </button>
              <span className="pagination-info">გვერდი {page} / {totalPages}</span>
              <button
                className="btn btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                შემდეგი →
              </button>
            </div>
          )}
        </>
      )}

      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          isOwner={isTeacher}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default MyCoursesPage;