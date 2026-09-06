import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CourseForm from '../components/CourseForm';

// ISO თარიღს გარდაქმნის <input type="datetime-local">-ის მოსალოდნელ ლოკალურ ფორმატში
const toLocalDatetimeInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditCoursePage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ვიღებთ იმ გვერდის ნომერს, საიდანაც მომხმარებელი გადმოვიდა
  const fromPage = location.state?.fromPage || 1;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    API.get(`courses/${id}/`)
      .then((res) => {
        if (user && res.data.instructor?.id !== user.id) {
          setForbidden(true);
          return;
        }
        setCourse(res.data);
      })
      .catch(() => setLoadError('კურსი ვერ მოიძებნა.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = (formData) =>
    API.patch(`courses/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => navigate('/my-courses', { state: { fromPage } }));

  if (loading) {
    return <div className="loading-spinner">იტვირთება...</div>;
  }

  if (forbidden) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚫</div>
        <h2>წვდომა შეზღუდულია</h2>
        <p>ამ კურსის რედაქტირება მხოლოდ მისი ავტორისთვისაა შესაძლებელი.</p>
        <Link to="/my-courses" state={{ fromPage }} className="btn btn-primary">ჩემს კურსებში დაბრუნება</Link>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>{loadError || 'კურსი ვერ მოიძებნა'}</h2>
        <Link to="/my-courses" state={{ fromPage }} className="btn btn-primary">ჩემს კურსებში დაბრუნება</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{maxWidth: '540px', margin: '40px auto 0'}}>
        <h2 style={{fontSize: '1.8rem', marginBottom: '8px'}}>კურსის რედაქტირება</h2>
        <p style={{color: 'var(--text-secondary)', marginBottom: '0'}}>„{course.title}“ — შეასწორეთ საჭირო ველები</p>
      </div>
      <CourseForm
        initialValues={{
          title: course.title,
          description: course.description,
          price: course.price,
          category: course.category,
          syllabus: course.syllabus,
          start_date_local: toLocalDatetimeInput(course.start_date),
          duration_weeks: course.duration_weeks,
          image: course.image,
        }}
        onSubmit={handleSubmit}
        submitLabel="ცვლილებების შენახვა"
        submittingLabel="ინახება..."
      />
    </div>
  );
};

export default EditCoursePage;