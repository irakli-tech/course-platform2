import React, { useEffect, useState } from 'react';
import API from '../services/api';

/**
 * საერთო ფორმა კურსის შესაქმნელად და სარედაქტირებლად.
 * initialValues - თუ გადმოეცემა, ფორმა წინასწარ ივსება (edit რეჟიმი).
 * onSubmit(formData) - უნდა დააბრუნოს Promise (axios request).
 */
const CourseForm = ({ initialValues, onSubmit, submitLabel, submittingLabel }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [price, setPrice] = useState(initialValues?.price ?? '');
  const [startDate, setStartDate] = useState(initialValues?.start_date_local || '');
  const [durationWeeks, setDurationWeeks] = useState(initialValues?.duration_weeks ?? '');
  const [syllabus, setSyllabus] = useState(initialValues?.syllabus || '');
  const [categoryId, setCategoryId] = useState(initialValues?.category ? String(initialValues.category) : '');
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialValues?.image || null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get('categories/')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setCategories(list);
        if (!categoryId && list.length > 0) setCategoryId(String(list[0].id));
      })
      .catch(() => setError('კატეგორიების ჩატვირთვა ვერ მოხერხდა.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file || null);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('გთხოვთ აირჩიოთ კატეგორია.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price || '0');
    formData.append('category', categoryId);
    formData.append('syllabus', syllabus);
    if (startDate) {
      formData.append('start_date', startDate);
    }
    if (durationWeeks !== '' && durationWeeks !== null) {
      formData.append('duration_weeks', durationWeeks);
    }
    if (image) {
      formData.append('image', image);
    }

    onSubmit(formData)
      .catch((err) => {
        if (err.response?.status === 403) {
          setError('ამ მოქმედების შესრულების უფლება არ გაქვთ.');
        } else {
          setError('შენახვისას დაფიქსირდა შეცდომა. შეამოწმეთ შევსებული ველები.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="form-card">
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>კურსის სათაური</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>აღწერა</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>რას ისწავლიან მოსწავლეები (თითო თემა ახალ ხაზზე)</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder={'მაგ:\nცვლადები და მონაცემთა ტიპები\nფუნქციები\nსაბოლოო პროექტი'}
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>კატეგორია</label>
            <select
              className="form-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.length === 0 && <option value="">კატეგორია ვერ მოიძებნა</option>}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>ფასი (₾)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              placeholder="0 = უფასო"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>დაწყების თარიღი და დრო (არასავალდებულო)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>ხანგრძლივობა (კვირებში)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="form-control"
              placeholder="მაგ: 8"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>ხატულა / ატვირთეთ სურათი</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <img src={imagePreview} alt="გადახედვა" className="image-preview" />
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{width: '100%', marginTop: '12px', padding: '12px'}}>
          {submitting ? (submittingLabel || 'ინახება...') : submitLabel}
        </button>
      </form>
    </div>
  );
};

export default CourseForm;
