import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #2563eb, #06b6d4)',
  'linear-gradient(135deg, #7c3aed, #06b6d4)',
  'linear-gradient(135deg, #dc2626, #f59e0b)',
  'linear-gradient(135deg, #059669, #06b6d4)',
  'linear-gradient(135deg, #db2777, #7c3aed)',
];

const getAvatarColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (firstName, lastName, username) => {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  return (username || '?').charAt(0).toUpperCase();
};

const TeachersSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');

  const sliderRef = useRef(null);

  useEffect(() => {
    if (isOpen && teachers.length === 0) {
      API.get('teachers/')
        .then((res) => setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []))
        .catch((err) => console.error('მასწავლებლების ჩატვირთვის შეცდომა:', err));
    }
  }, [isOpen, teachers.length]);

  // ბანერის ჩაკეცვისას ქრება ყველაფერი - მათ შორის არჩეული მასწავლებლის კურსებიც.
  const handleToggleBanner = () => {
    if (isOpen) {
      setSelectedTeacher(null);
      setTeacherCourses([]);
      setCoursesError('');
    }
    setIsOpen((v) => !v);
  };

  // ერთსა და იმავე კარდზე ხელახლა დაჭერით პანელი იკეცება.
  const handleTeacherClick = (teacher) => {
    if (selectedTeacher?.id === teacher.id) {
      setSelectedTeacher(null);
      setTeacherCourses([]);
      return;
    }

    setSelectedTeacher(teacher);
    setLoadingCourses(true);
    setCoursesError('');
    setTeacherCourses([]);

    API.get(`teachers/${teacher.id}/courses/`)
      .then((res) => setTeacherCourses(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch((err) => {
        console.error('კურსების ჩატვირთვის შეცდომა:', err);
        setCoursesError('კურსების ჩატვირთვა ვერ მოხერხდა.');
      })
      .finally(() => setLoadingCourses(false));
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 280;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const selectedTeacherName = selectedTeacher
    ? (`${selectedTeacher.first_name || ''} ${selectedTeacher.last_name || ''}`.trim() || selectedTeacher.username)
    : '';

  return (
    <section className={`hero-banner ${isOpen ? 'expanded' : ''}`} style={{ marginBottom: '32px' }}>
      <button
        type="button"
        className="hero-toggle"
        onClick={handleToggleBanner}
        aria-expanded={isOpen}
      >
        <span className="hero-toggle-title">👨‍🏫 ჩვენი მასწავლებლები</span>
        <span className={`hero-chevron ${isOpen ? 'open' : ''}`}>⌄</span>
      </button>

      <div className="hero-collapsible">
        <div className="hero-collapsible-inner">
          <div className="teachers-carousel">
            <button type="button" className="carousel-arrow" onClick={() => scroll('left')} aria-label="წინა">
              ‹
            </button>

            <div ref={sliderRef} className="teachers-track">
              {teachers.map((t) => {
                const fullName = `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username;
                const avatarUrl = t.avatar;
                const isSelected = selectedTeacher?.id === t.id;

                return (
                  <div
                    key={t.id}
                    className={`teacher-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleTeacherClick(t)}
                  >
                    <div
                      className="teacher-avatar"
                      style={{ background: avatarUrl ? 'transparent' : getAvatarColor(t.username) }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} />
                      ) : (
                        getInitials(t.first_name, t.last_name, t.username)
                      )}
                    </div>
                    <div className="teacher-name">{fullName}</div>
                    <div className="teacher-courses-count">📚 {t.courses_count || 0} კურსი</div>
                    {t.bio && <div className="teacher-bio">{t.bio}</div>}
                  </div>
                );
              })}
            </div>

            <button type="button" className="carousel-arrow" onClick={() => scroll('right')} aria-label="შემდეგი">
              ›
            </button>
          </div>

          {/* არჩეული მასწავლებლის კურსები - პატარა ზომის ინლაინ პანელი, ბანერის სტილში.
              ქრება ჩაკეცვისას, რადგან მთლიანად hero-collapsible-ის შიგნითაა. */}
          {selectedTeacher && (
            <div className="teacher-courses-panel">
              <div className="teacher-courses-panel-header">
                <span>📖 {selectedTeacherName}-ის კურსები</span>
                <button
                  type="button"
                  className="teacher-courses-panel-close"
                  onClick={() => { setSelectedTeacher(null); setTeacherCourses([]); }}
                >
                  ✕
                </button>
              </div>

              {loadingCourses ? (
                <p className="teacher-courses-panel-msg">იტვირთება...</p>
              ) : coursesError ? (
                <p className="teacher-courses-panel-msg teacher-courses-panel-error">{coursesError}</p>
              ) : teacherCourses.length === 0 ? (
                <p className="teacher-courses-panel-msg">ამ მასწავლებელს ჯერ არ აქვს აქტიური კურსი.</p>
              ) : (
                <div className="teacher-courses-panel-grid">
                  {teacherCourses.map((c) => (
                    <div key={c.id} className="teacher-course-chip">
                      <span className="teacher-course-chip-title">{c.title}</span>
                      <span className="teacher-course-chip-price">
                        {Number(c.price) > 0 ? `${c.price} ₾` : 'უფასო'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TeachersSection;
