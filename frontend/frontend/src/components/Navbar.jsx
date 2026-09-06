import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SocialIcon, { SOCIAL_LINKS } from './socialLinks';
import AboutModal from './AboutModal';

const Navbar = () => {
  const { user, isTeacher, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* "ORION" ღილაკზე დაჭერისას იხსნება პორტალის შესახებ ინფორმაციის ფანჯარა */}
      <button
        type="button"
        className="nav-brand"
        onClick={() => setAboutOpen(true)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span className="brand-badge">ORION</span>
        <span>სასწავლო პორტალი</span>
      </button>

      <button className="nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="მენიუ">
        ☰
      </button>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li><Link to="/" onClick={() => setMenuOpen(false)}>მთავარი</Link></li>
        {user ? (
          <>
            <li><Link to="/my-courses" onClick={() => setMenuOpen(false)}>ჩემი კურსები</Link></li>
            {isTeacher && (
              <li><Link to="/create-course" className="nav-btn" onClick={() => setMenuOpen(false)}>+ კურსის დამატება</Link></li>
            )}
            <li>
              <Link
                to="/profile"
                className={`role-badge ${isTeacher ? 'role-badge-teacher' : 'role-badge-student'}`}
                onClick={() => setMenuOpen(false)}
                title="ჩემი პროფილის რედაქტირება"
              >
                {isTeacher ? '🧑‍🏫 ' : '🎓 '}{user.username}
              </Link>
            </li>
            <li><button onClick={handleLogout} className="btn btn-outline" style={{padding: '6px 14px'}}>გამოსვლა</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login" onClick={() => setMenuOpen(false)}>შესვლა</Link></li>
            <li><Link to="/register" className="nav-btn" onClick={() => setMenuOpen(false)}>რეგისტრაცია</Link></li>
          </>
        )}
        {/* <li className="nav-socials">
          {SOCIAL_LINKS.map((social) => (
            <SocialIcon key={social.name} social={social} className="nav-social-link" />
          ))}
        </li> */}
      </ul>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </nav>
  );
};

export default Navbar;
