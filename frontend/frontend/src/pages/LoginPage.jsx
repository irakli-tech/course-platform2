import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    API.post('auth/login/', { username, password })
      .then((res) => {
        login(res.data.access, res.data.refresh);
        navigate('/');
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError('მომხმარებლის სახელი ან პაროლი არასწორია');
        } else {
          setError('შესვლისას დაფიქსირდა შეცდომა. სცადეთ მოგვიანებით.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="form-card">
      <h2 style={{fontSize: '1.8rem', marginBottom: '8px'}}>ავტორიზაცია</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>შედით თქვენს ანგარიშზე სისტემაში გასაგრძელებლად</p>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>მომხმარებელი</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>პაროლი</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{width: '100%', marginTop: '12px', padding: '12px'}}>
          {submitting ? 'იტვირთება...' : 'შესვლა'}
        </button>
      </form>

      <p style={{marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
        არ გაქვთ ანგარიში? <Link to="/register" style={{color: 'var(--accent-cyan)'}}>დარეგისტრირდით</Link>
      </p>
    </div>
  );
};

export default LoginPage;
