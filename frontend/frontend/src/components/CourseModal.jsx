import React from 'react';
import './CourseModal.css'; // სტილებისთვის

const CourseModal = ({ isOpen, onClose, teacherName, courses, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{teacherName}-ს კურსები</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <p>იტვირთება...</p>
          ) : courses.length === 0 ? (
            <p>ამ მასწავლებელს ჯერ არ აქვს აქტიური კურსები.</p>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="course-card">
                  {course.image && (
                    <img src={course.image} alt={course.title} className="course-img" />
                  )}
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  {course.price !== undefined && (
                    <span className="course-price-tag">
                      {Number(course.price) > 0 ? `${course.price} ₾` : 'უფასო'}
                    </span>
                  )}
                  {course.duration_weeks && <span>ხანგრძლივობა: {course.duration_weeks} კვირა</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseModal;