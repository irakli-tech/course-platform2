import React, { useContext, useState } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
};

const ProfilePage = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  // პროფილის ფოტო (ავატარი) - განსაკუთრებით მნიშვნელოვანია მასწავლებლისთვის,
  // რადგან ეს სურათი გამოჩნდება მასწავლებლების სექციაში.
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // სტუდენტის კურსების ისტორია - "დეტალურად" ღილაკის მსგავსი toggle,
  // რომელიც ადგილზე იშლება/იკეცება და მონაცემები არ იკარგება (ერთხელ იტვირთება).
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [history, setHistory] = useState([]);

  // სტუდენტის მიერ საკუთარი ხელით შევსებული ისტორია (გავლილი კურსები, რომლებსაც
  // თვითონ შეიყვანს - მაგ. სხვა პლატფორმაზე გავლილი). აკეცვადი სექციაა, პლატფორმის
  // ჩარიცხვის ისტორიისგან დამოუკიდებელი.
  const [myHistoryOpen, setMyHistoryOpen] = useState(false);
  const [myHistoryLoaded, setMyHistoryLoaded] = useState(false);
  const [myHistoryLoading, setMyHistoryLoading] = useState(false);
  const [myHistoryError, setMyHistoryError] = useState('');
  const [myHistory, setMyHistory] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryDate, setNewEntryDate] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);
  const [addEntryError, setAddEntryError] = useState('');
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  const isTeacher = user?.role === 'teacher';

  const toggleHistory = () => {
    const opening = !historyOpen;
    setHistoryOpen(opening);
    if (opening && !historyLoaded) {
      setHistoryLoading(true);
      setHistoryError('');
      API.get('my-courses/', { params: { page_size: 100 } })
        .then((res) => {
          const data = res.data;
          const list = Array.isArray(data) ? data : (data.results || []);
          setHistory(list);
          setHistoryLoaded(true);
        })
        .catch(() => setHistoryError('ისტორიის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.'))
        .finally(() => setHistoryLoading(false));
    }
  };

  const loadMyHistory = () => {
    setMyHistoryLoading(true);
    setMyHistoryError('');
    API.get('history/')
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.results || []);
        setMyHistory(list);
        setMyHistoryLoaded(true);
      })
      .catch(() => setMyHistoryError('ისტორიის ჩატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.'))
      .finally(() => setMyHistoryLoading(false));
  };

  const toggleMyHistory = () => {
    const opening = !myHistoryOpen;
    setMyHistoryOpen(opening);
    if (opening && !myHistoryLoaded) {
      loadMyHistory();
    }
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    setAddEntryError('');

    if (!newEntryTitle.trim()) {
      setAddEntryError('კურსის სახელწოდება სავალდებულოა.');
      return;
    }

    setAddingEntry(true);
    API.post('history/', {
      title: newEntryTitle.trim(),
      description: newEntryDescription.trim(),
      completed_date: newEntryDate || null,
    })
      .then((res) => {
        setMyHistory((prev) => [res.data, ...prev]);
        setMyHistoryLoaded(true);
        setNewEntryTitle('');
        setNewEntryDate('');
        setNewEntryDescription('');
      })
      .catch((err) => {
        const data = err.response?.data;
        setAddEntryError(
          data?.title?.[0] || data?.detail || 'ჩანაწერის დამატებისას დაფიქსირდა შეცდომა.'
        );
      })
      .finally(() => setAddingEntry(false));
  };

  const handleDeleteEntry = (entryId) => {
    setDeletingEntryId(entryId);
    API.delete(`history/${entryId}/`)
      .then(() => {
        setMyHistory((prev) => prev.filter((e) => e.id !== entryId));
      })
      .catch(() => setMyHistoryError('ჩანაწერის წაშლა ვერ მოხერხდა.'))
      .finally(() => setDeletingEntryId(null));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isTeacher && !bio.trim()) {
      setError('მასწავლებლისთვის სტატუსში (განათლება/გამოცდილება) მითითება სავალდებულოა.');
      return;
    }

    setSubmitting(true);

    // FormData გამოგვადგება, რადგან შესაძლოა ფოტოც (ფაილი) იგზავნებოდეს ერთად.
    const formData = new FormData();
    formData.append('username', username);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('phone', phone);

    if (isTeacher) {
      formData.append('bio', bio);
    }

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    API.patch('auth/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        refreshUser(res.data);
        setAvatarFile(null);
        setSuccess('პროფილი წარმატებით განახლდა.');
      })
      .catch((err) => {
        const data = err.response?.data;
        if (data?.username) {
          setError(Array.isArray(data.username) ? data.username[0] : String(data.username));
        } else if (data?.email) {
          setError(Array.isArray(data.email) ? data.email[0] : String(data.email));
        } else if (data?.phone) {
          setError(Array.isArray(data.phone) ? data.phone[0] : String(data.phone));
        } else if (data?.bio) {
          setError(Array.isArray(data.bio) ? data.bio[0] : String(data.bio));
        } else {
          setError('პროფილის განახლებისას დაფიქსირდა შეცდომა.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  if (!user) return null;

  return (
    <div className="form-card">
      <h2 style={{fontSize: '1.8rem', marginBottom: '8px'}}>ჩემი პროფილი</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>
        როლი: <span className={`role-badge ${user.role === 'teacher' ? 'role-badge-teacher' : 'role-badge-student'}`}>
          {user.role === 'teacher' ? '🧑‍🏫 მასწავლებელი' : '🎓 მოსწავლე'}
        </span>
      </p>

      {!isTeacher && (
        <div className="collapsible-section">
          <button
            type="button"
            className="btn btn-outline collapsible-toggle"
            onClick={toggleHistory}
            aria-expanded={historyOpen}
          >
            <span>📖 ჩემი კურსების ისტორია{historyLoaded ? ` (${history.length})` : ''}</span>
            <span className={`hero-chevron ${historyOpen ? 'open' : ''}`}>⌄</span>
          </button>

          <div className={`collapsible-body ${historyOpen ? 'open' : ''}`}>
            <div className="collapsible-body-inner">
              {historyLoading ? (
                <div className="loading-spinner" style={{ padding: '20px 0' }}>იტვირთება...</div>
              ) : historyError ? (
                <div className="alert-error">{historyError}</div>
              ) : historyLoaded && history.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  ჯერ არცერთ კურსზე არ ხართ ჩარიცხული. დაათვალიერეთ ხელმისაწვდომი კურსები მთავარ გვერდზე.
                </p>
              ) : historyLoaded ? (
                <div className="history-cards">
                  {history.map((enrollment) => (
                    <div key={enrollment.id} className="history-card">
                      <strong className="history-card-title">{enrollment.course?.title}</strong>
                      {enrollment.course?.category_name && (
                        <span className="category-badge">{enrollment.course.category_name}</span>
                      )}
                      <span className="history-card-date">
                        ჩარიცხვის თარიღი: {formatDate(enrollment.enrolled_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {!isTeacher && (
        <div className="collapsible-section">
          <button
            type="button"
            className="btn btn-outline collapsible-toggle"
            onClick={toggleMyHistory}
            aria-expanded={myHistoryOpen}
          >
            <span>📝 ჩემი ისტორია{myHistoryLoaded ? ` (${myHistory.length})` : ''}</span>
            <span className={`hero-chevron ${myHistoryOpen ? 'open' : ''}`}>⌄</span>
          </button>

          <div className={`collapsible-body ${myHistoryOpen ? 'open' : ''}`}>
            <div className="collapsible-body-inner">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px' }}>
                აქ თავად შეგიძლიათ დაამატოთ გავლილი კურსები (მაგ. სხვა პლატფორმაზე ან ადრე გავლილი).
              </p>

              <form onSubmit={handleAddEntry} style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>კურსის დასახელება</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="მაგ: JavaScript საფუძვლები"
                    value={newEntryTitle}
                    onChange={(e) => setNewEntryTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>დასრულების თარიღი (არასავალდებულო)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newEntryDate}
                      onChange={(e) => setNewEntryDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>აღწერა (არასავალდებულო)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="მოკლე კომენტარი"
                      value={newEntryDescription}
                      onChange={(e) => setNewEntryDescription(e.target.value)}
                    />
                  </div>
                </div>

                {addEntryError && <div className="alert-error">{addEntryError}</div>}

                <button type="submit" className="btn btn-primary" disabled={addingEntry} style={{ marginTop: '4px' }}>
                  {addingEntry ? 'ინახება...' : '➕ დამატება'}
                </button>
              </form>

              {myHistoryLoading ? (
                <div className="loading-spinner" style={{ padding: '20px 0' }}>იტვირთება...</div>
              ) : myHistoryError ? (
                <div className="alert-error">{myHistoryError}</div>
              ) : myHistoryLoaded && myHistory.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  ჯერ არცერთი ჩანაწერი არ დაგიმატებიათ.
                </p>
              ) : myHistoryLoaded ? (
                <div className="history-cards">
                  {myHistory.map((entry) => (
                    <div key={entry.id} className="history-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <strong className="history-card-title">{entry.title}</strong>
                        <button
                          type="button"
                          className="btn btn-outline btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          disabled={deletingEntryId === entry.id}
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          {deletingEntryId === entry.id ? '...' : '🗑'}
                        </button>
                      </div>
                      {entry.description && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {entry.description}
                        </span>
                      )}
                      <span className="history-card-date">
                        {entry.completed_date ? `დასრულების თარიღი: ${formatDate(entry.completed_date)}` : 'თარიღი მითითებული არ არის'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <label>პროფილის ფოტო {isTeacher ? '(მასწავლებლის ფოტო)' : ''}</label>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="ავატარი"
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-color, #ddd)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2rem'
                }}
              >
                {(username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>მომხმარებლის სახელი (Username)</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>სახელი</label>
            <input
              type="text"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>გვარი</label>
            <input
              type="text"
              className="form-control"
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
          />
        </div>

        {isTeacher && (
          <div className="form-group">
            <label>თქვენს შესახებ (განათლება, გამოცდილება, კვალიფიკაცია)</label>
            <textarea
              className="form-control"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />
            <small style={{color: 'var(--text-secondary)'}}>
              ეს აღწერა წარმოადგენს თქვენს, როგორც მასწავლებლის, მოკლე პრეზენტაციას — მოსწავლეები მას ნახავენ თქვენი კურსების დეტალურ გვერდზე.
            </small>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{width: '100%', marginTop: '12px', padding: '12px'}}>
          {submitting ? 'ინახება...' : 'ცვლილებების შენახვა'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;