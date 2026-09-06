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
  
  const sliderRef = useRef(null);

  useEffect(() => {
    if (isOpen && teachers.length === 0) {
      API.get('teachers/')
        .then((res) => setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []))
        .catch((err) => console.error('მასწავლებლების ჩატვირთვის შეცდომა:', err));
    }
  }, [isOpen, teachers.length]);

  const handleToggleBanner = () => {
    if (isOpen) {
      setSelectedTeacher(null);
      setTeacherCourses([]);
    }
    setIsOpen(!isOpen);
  };

  const handleTeacherClick = async (teacher) => {
    if (selectedTeacher?.id === teacher.id) {
      setSelectedTeacher(null);
      setTeacherCourses([]);
      return;
    }

    setSelectedTeacher(teacher);
    setLoadingCourses(true);
    setTeacherCourses([]);

    try {
      // 1. ჯერ ვცდით პირდაპირ გაფილტრული კურსების წამოღებას backend-იდან
      let res = await API.get(`courses/?teacher=${teacher.id}`);
      let courses = Array.isArray(res.data) ? res.data : res.data.results || [];
      
      if (courses.length === 0) {
        res = await API.get(`courses/?author=${teacher.id}`);
        courses = Array.isArray(res.data) ? res.data : res.data.results || [];
      }

      // 2. თუ სერვერული ფილტრი ცარიელს აბრუნებს, მოვქაჩავთ ყველა კურსს და JS-ით გადავფილტრავთ ID / Username-ის მიხედვით
      if (courses.length === 0) {
        const allRes = await API.get('courses/');
        const allCourses = Array.isArray(allRes.data) ? allRes.data : allRes.data.results || [];

        courses = allCourses.filter((c) => {
          const tId = c.teacher?.id || c.teacher || c.author?.id || c.author || c.instructor?.id || c.instructor;
          const tName = c.teacher_name || c.author_name || c.teacher?.username;
          return tId === teacher.id || tName === teacher.username;
        });
      }

      setTeacherCourses(courses);
    } catch (err) {
      console.error('კურსების ჩატვირთვის შეცდომა:', err);
    } finally {
      setLoadingCourses(false);
    }
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

  return (
    <div style={{ margin: '30px 0', width: '100%' }}>
      {/* აკორდეონ ბანერის Header */}
      <div 
        onClick={handleToggleBanner}
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: '600',
          fontSize: '1.2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          👨‍🏫 ჩვენი მასწავლებლები
        </span>
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          {isOpen ? '▲ ჩაკეცვა' : '▼ გაშლა'}
        </span>
      </div>

      {/* ყველა შიგთავსი (კარდებიცა და არჩეული მასწავლებლის ბლოკიც) ჩასმულია isOpen-ში */}
      {isOpen && (
        <div style={{ marginTop: '20px', position: 'relative' }}>
          {/* ისრები */}
          {teachers.length > 3 && (
            <>
              <button 
                onClick={() => scroll('left')}
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: '#0f172a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ‹
              </button>
              <button 
                onClick={() => scroll('right')}
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: '#0f172a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ›
              </button>
            </>
          )}

          {/* მასწავლებლების კარდები */}
          <div 
            ref={sliderRef}
            style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              padding: '10px 5px',
              scrollbarWidth: 'none'
            }}
          >
            {teachers.map((t) => {
              const fullName = `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username;
              const isSelected = selectedTeacher?.id === t.id;

              return (
                <div 
                  key={t.id} 
                  className={`teacher-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTeacherClick(t)}
                >
                  <div 
                    className="teacher-avatar"
                    style={{ background: t.avatar ? 'transparent' : getAvatarColor(t.username) }}
                  >
                    {t.avatar ? (
                      <img src={t.avatar} alt={fullName} />
                    ) : (
                      getInitials(t.first_name, t.last_name, t.username)
                    )}
                  </div>

                  <h3 className="teacher-name">{fullName}</h3>
                  
                  <div className="teacher-courses-count">
                    📚 {t.courses_count || 0} კურსი
                  </div>

                  <p className="teacher-bio">
                    {t.bio || 'ინფორმაცია არ არის'}
                  </p>

                  <div className="teacher-contact">
                    {t.email && <div>✉️ {t.email}</div>}
                    {t.phone && <div>📞 {t.phone}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* არჩეული მასწავლებლის კურსების ინლაინ ბანერი (მხოლოდ isOpen = true-ს დროს) */}
          {selectedTeacher && (
            <div 
              style={{ 
                marginTop: '20px', 
                backgroundColor: '#0f172a', 
                border: '1px solid #38bdf8', 
                borderRadius: '16px', 
                padding: '20px 24px',
                color: '#ffffff',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem' }}>
                  📖 {`${selectedTeacher.first_name || ''} ${selectedTeacher.last_name || ''}`.trim() || selectedTeacher.username}-ის კურსები:
                </h4>
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              {loadingCourses ? (
                <p style={{ color: '#94a3b8', margin: 0 }}>იტვირთება კურსები...</p>
              ) : teacherCourses.length === 0 ? (
                <p style={{ color: '#94a3b8', margin: 0 }}>ამ მასწავლებელს ჯერ არ აქვს აქტიური კურსი.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {teacherCourses.map((c) => (
                    <div 
                      key={c.id} 
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        padding: '12px 16px', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(255,255,255,0.1)' 
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '6px', color: '#fff' }}>{c.title}</div>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                        {Number(c.price) > 0 ? `${c.price} ₾` : 'უფასო'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeachersSection;