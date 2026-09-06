import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="empty-state">
    <div className="empty-state-icon">🧭</div>
    <h2>გვერდი ვერ მოიძებნა</h2>
    <p>საძიებელი გვერდი არ არსებობს ან გადატანილია.</p>
    <Link to="/" className="btn btn-primary">მთავარზე დაბრუნება</Link>
  </div>
);

export default NotFoundPage;
