import React from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import CourseForm from '../components/CourseForm';

const CreateCoursePage = () => {
  const navigate = useNavigate();

  const handleSubmit = (formData) =>
    API.post('courses/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => navigate('/my-courses'));

  return (
    <div>
      <div style={{maxWidth: '540px', margin: '40px auto 0'}}>
        <h2 style={{fontSize: '1.8rem', marginBottom: '8px'}}>ახალი კურსის დამატება</h2>
        <p style={{color: 'var(--text-secondary)', marginBottom: '0'}}>შეავსეთ კურსის ინფორმაცია და ატვირთეთ ხატულა / სურათი</p>
      </div>
      <CourseForm onSubmit={handleSubmit} submitLabel="შენახვა და გამოქვეყნება" submittingLabel="ინახება..." />
    </div>
  );
};

export default CreateCoursePage;
