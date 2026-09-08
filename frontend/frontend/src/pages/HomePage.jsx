import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CourseDetailModal from '../components/CourseDetailModal';
import TeachersCarousel from '../components/TeachersCarousel';
import CourseModal from '../components/CourseModal';

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

const isEnrollmentClosed = (startDateIso) => {
  if (!startDateIso) return false;
  const startDate = new Date(startDateIso);
  const deadline = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  return new Date() >= deadline;
};

const isCourseStarted = (startDateIso) => {
  if (!startDateIso) return false;
  return new Date() >= new Date(startDateIso);
};

const HomePage = () => {
  const { user, isStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [heroExpanded, setHeroExpanded] = useState(false);

  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherCoursesLoading, setTeacherCoursesLoading] = useState(false);

  const [platformStats, setPlatformStats] = useState({ teachers_count: 0, students_count: 0 });

  useEffect(() => {
    API.get('stats/')
      .then((res) => setPlatformStats(res.data))
      .catch(() => {}); // ბანერისთვის არასავალდებულო მონაცემია, შეცდომაზე გვერდს ვუვლით
  }, []);

  useEffect(() => {
    API.get('categories/')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setCategories([]));
  }, []);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    setError('');

    const params = { page, ordering };
    if (activeCategory) params.category = activeCategory;
    if (search.trim()) params.search = search.trim();

    API.get('courses/', { params })
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.results || []);
        setCourses(list);
        setCount(Array.isArray(data) ? list.length : (data.count ?? list.length));
      })
      .catch((err) => {
        console.error('კურსების ნახვის შეცდომა:', err);
        setError('კურსების ჩატვირთვა ვერ მოხერხდა. სცადეთ გვერდის განახლება.');
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [page, ordering, activeCategory, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const handleEnrollToggle = (course) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrollingId(course.id);
    const action = course.is_enrolled ? 'unenroll' : 'enroll';
    API.post(`courses/${course.id}/${action}/`)
      .then(() => {
        setCourses((prev) =>
          prev.map((c) => {
            if (c.id !== course.id) return c;
            const delta = course.is_enrolled ? -1 : 1;
            return {
              ...c,
              is_enrolled: !c.is_enrolled,
              students_count: Math.max(0, c.students_count + delta),
            };
          })
        );
      })
      .catch((err) => {
        alert(err.response?.data?.detail || 'მოხდა შეცდომა, სცადეთ ხელახლა.');
      })
      .finally(() => setEnrollingId(null));
  };

  const getInstructorDisplayName = (instructor) => {
    if (!instructor) return '';
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
    return fullName || instructor.username;
  };

  const handleTeacherClick = (instructor) => {
    const name = getInstructorDisplayName(instructor);
    if (!name || !instructor?.id) return;

    setSelectedTeacherName(name);
    setTeacherCourses([]);
    setTeacherCoursesLoading(true);
    setIsTeacherModalOpen(true);

    API.get(`teachers/${instructor.id}/courses/`)
      .then((res) => {
        const data = res.data;
        setTeacherCourses(Array.isArray(data) ? data : data.results || []);
      })
      .catch((err) => {
        console.error('მასწავლებლის კურსების ჩატვირთვის შეცდომა:', err);
        setTeacherCourses([]);
      })
      .finally(() => setTeacherCoursesLoading(false));
  };

  return (
    <div>
      <TeachersCarousel onSelectTeacher={handleTeacherClick} />

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="მოძებნე კურსი სათაურით ან აღწერით..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control ordering-select"
          value={ordering}
          onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
        >
          <option value="-created_at">უახლესი</option>
          <option value="price">ფასი: დაბლიდან მაღლა</option>
          <option value="-price">ფასი: მაღლიდან დაბლა</option>
        </select>
      </div>

      <div className="category-chips">
        <button
          className={`chip ${activeCategory === '' ? 'active' : ''}`}
          onClick={() => { setActiveCategory(''); setPage(1); }}
        >
          ყველა
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === String(cat.id) ? 'active' : ''}`}
            onClick={() => { setActiveCategory(String(cat.id)); setPage(1); }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <h2 className="section-title">ხელმისაწვდომი კურსები</h2>

      {loading ? (
        <div className="loading-spinner">მონაცემები იტვირთება...</div>
      ) : error ? (
        <div className="alert-error">{error}</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h2>კურსები ვერ მოიძებნა</h2>
          <p>სცადეთ ძიების პარამეტრების შეცვლა ან სხვა კატეგორიის არჩევა.</p>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {courses.map((course) => {
              const isOwner = user && course.instructor?.id === user.id;
              const closed = isEnrollmentClosed(course.start_date);
              const started = isCourseStarted(course.start_date);

              const teacherName = course.teacher_name || getInstructorDisplayName(course.instructor);

              return (
                <div key={course.id} className="card">
                  <div>
                    <div className="card-header">
                      <div className="card-icon-wrapper">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="card-icon" />
                        ) : (
                          <span style={{fontSize: '1.4rem'}}>📘</span>
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
                      {teacherName ? (
                        <span 
                          onClick={() => course.instructor && handleTeacherClick(course.instructor)}
                          style={{ cursor: course.instructor ? 'pointer' : 'default', textDecoration: course.instructor ? 'underline' : 'none' }}
                          title={course.instructor ? "ნახე ამ მასწავლებლის კურსები" : ""}
                        >
                          👨‍🏫 {teacherName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          👨‍🏫 მასწავლებელი მითითებული არ არის
                        </span>
                      )}
                      <span>🎓 {course.students_count} სტუდენტი</span>
                      <span className="price-tag">{Number(course.price) > 0 ? `${course.price} ₾` : 'უფასო'}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="btn btn-outline" onClick={() => setSelectedCourse(course)}>
                      დეტალურად
                    </button>

                    {isOwner ? (
                      <span className="badge-owner">თქვენი კურსი</span>
                    ) : isStudent ? (
                      course.is_enrolled ? (
                        <button
                          className="btn btn-outline"
                          disabled={started || enrollingId === course.id}
                          onClick={() => handleEnrollToggle(course)}
                          style={started ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {enrollingId === course.id ? '...' : '✓ ჩარიცხული ხართ'}
                        </button>
                      ) : closed ? (
                        <button
                          className="btn"
                          disabled
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            borderColor: '#ef4444',
                            opacity: 0.7,
                            cursor: 'not-allowed'
                          }}
                        >
                          მიღება შეწყდა
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          disabled={enrollingId === course.id}
                          onClick={() => handleEnrollToggle(course)}
                        >
                          {enrollingId === course.id ? '...' : 'ჩარიცხვა'}
                        </button>
                      )
                    ) : !user ? (
                      <button className="btn btn-primary" onClick={() => navigate('/login')}>
                        გაიარე ავტორიზაცია
                      </button>
                    ) : (
                      <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                        სხვისი კურსი
                      </span>
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

      <section className={`hero-banner ${heroExpanded ? 'expanded' : ''}`} style={{ marginTop: '40px' }}>
        <button
          type="button"
          className="hero-toggle"
          onClick={() => setHeroExpanded((v) => !v)}
          aria-expanded={heroExpanded}
        >
          <span className="hero-toggle-title">სასწავლო კურსების სტატისტიკა</span>
          <span className={`hero-chevron ${heroExpanded ? 'open' : ''}`}>⌄</span>
        </button>

        <div className="hero-collapsible">
          <div className="hero-collapsible-inner">
            <p>თანამედროვე პლატფორმა პროგრამირების, ქსელებისა და ტექნოლოგიური კურსებისთვის.</p>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{count}</strong>
                <span>კურსი</span>
              </div>
              <div className="hero-stat">
                <strong>{categories.length}</strong>
                <span>კატეგორია</span>
              </div>
              <div className="hero-stat">
                <strong>{platformStats.teachers_count}</strong>
                <span>მასწავლებელი</span>
              </div>
              <div className="hero-stat">
                <strong>{platformStats.students_count}</strong>
                <span>მოსწავლე</span>
              </div>
              <div className="hero-stat">
                <strong>100%</strong>
                <span>ონლაინ წვდომა</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          isOwner={user && selectedCourse.instructor?.id === user.id}
          onClose={() => setSelectedCourse(null)}
        />
      )}

      <CourseModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        teacherName={selectedTeacherName}
        courses={teacherCourses}
        loading={teacherCoursesLoading}
      />
    </div>
  );
};

export default HomePage;
