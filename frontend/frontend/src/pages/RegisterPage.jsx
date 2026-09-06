import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (role === 'teacher' && !bio.trim()) {
      setError('მასწავლებლისთვის სტატუსში (განათლება/გამოცდილება) მითითება სავალდებულოა.');
      return;
    }

    if (role === 'teacher' && !teacherCode.trim()) {
      setError('მასწავლებლად რეგისტრაციისთვის საჭიროა შესვლის კოდი (მიღებული გაქვთ ადმინისტრატორისგან).');
      return;
    }

    setSubmitting(true);

    const payload = {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      phone,
      role
    };

    if (role === 'teacher') {
      payload.bio = bio;
      payload.teacher_code = teacherCode;
    }

    API.post('auth/register/', payload)
      .then(() => {
        navigate('/login');
      })
      .catch((err) => {
        const data = err.response?.data;
        if (data?.username) {
          setError(Array.isArray(data.username) ? data.username[0] : String(data.username));
        } else if (data?.password) {
          setError(Array.isArray(data.password) ? data.password[0] : String(data.password));
        } else if (data?.phone) {
          setError(Array.isArray(data.phone) ? data.phone[0] : String(data.phone));
        } else if (data?.bio) {
          setError(Array.isArray(data.bio) ? data.bio[0] : String(data.bio));
        } else if (data?.teacher_code) {
          setError(Array.isArray(data.teacher_code) ? data.teacher_code[0] : String(data.teacher_code));
        } else {
          setError('რეგისტრაციისას დაფიქსირდა შეცდომა. გთხოვთ სცადოთ ხელახლა.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="form-card">
      <h2 style={{fontSize: '1.8rem', marginBottom: '8px'}}>რეგისტრაცია</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>შექმენით ახალი ანგარიში პორტალზე</p>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>მომხმარებლის სახელი (Username)</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>სახელი</label>
            <input
              type="text"
              className="form-control"
              placeholder="მაგ: სოლომონ"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>გვარი</label>
            <input
              type="text"
              className="form-control"
              placeholder="მაგ: ბართაია"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>ელ. ფოსტა</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>პაროლი</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="form-group">
          <label>ტელეფონის ნომერი</label>
          <input
            type="tel"
            className="form-control"
            placeholder="მაგ: 555 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>რეგისტრირდები როგორც</label>
          <div className="role-select">
            <label className={`role-option ${role === 'student' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => setRole('student')}
              />
              <span className="role-option-icon">🎓</span>
              <span>
                <strong>მოსწავლე</strong>
                <small>კურსებზე ჩარიცხვა და სწავლა</small>
              </span>
            </label>

            <label className={`role-option ${role === 'teacher' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={role === 'teacher'}
                onChange={() => setRole('teacher')}
              />
              <span className="role-option-icon">🧑‍🏫</span>
              <span>
                <strong>მასწავლებელი</strong>
                <small>კურსების შექმნა და მართვა</small>
              </span>
            </label>
          </div>
        </div>

        {role === 'teacher' && (
          <div className="form-group">
            <label>თქვენს შესახებ (განათლება, გამოცდილება, კვალიფიკაცია)</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder={'მაგ: 5 წლიანი გამოცდილება Python-ის სწავლებაში...\nეს ტექსტი გამოჩნდება თქვენი კურსების დეტალების გვერდზე, მოსწავლეებისთვის.'}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />
            <small style={{color: 'var(--text-secondary)'}}>
              ეს აღწერა წარმოადგენს თქვენს, როგორც მასწავლებლის, მოკლე პრეზენტაციას.
            </small>
          </div>
        )}

        {role === 'teacher' && (
          <div className="form-group">
            <label>შესვლის კოდი</label>
            <input
              type="text"
              className="form-control"
              placeholder="მიღებული გაქვთ ადმინისტრატორისგან"
              value={teacherCode}
              onChange={(e) => setTeacherCode(e.target.value)}
              required
            />
            <small style={{color: 'var(--text-secondary)'}}>
              მასწავლებლად რეგისტრაციისთვის საჭიროა საიდუმლო კოდი, რომელსაც ადმინისტრატორი
              ზეპირად გატყობინებთ.
            </small>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{width: '100%', marginTop: '12px', padding: '12px'}}>
          {submitting ? 'იტვირთება...' : 'რეგისტრაცია'}
        </button>
      </form>

      <p style={{marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
        უკვე გაქვთ ანგარიში? <Link to="/login" style={{color: 'var(--accent-cyan)'}}>შესვლა</Link>
      </p>
    </div>
  );
};

export default RegisterPage;