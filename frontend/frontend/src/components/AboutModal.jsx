import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const AboutModal = ({ onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // portal-ით ვარენდერებთ პირდაპირ document.body-ში, რადგან წინააღმდეგ შემთხვევაში
  // (ნავბარის შიგნით რენდერისას) ნავბარის backdrop-filter ქმნის ახალ "containing block"-ს
  // და position:fixed მოდალს მთელი გვერდის ნაცვლად მხოლოდ ნავბარის არეში ამწყვდევს.
  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <button className="modal-close" onClick={onClose} aria-label="დახურვა">✕</button>

        <div className="modal-header">
          <div>
            <span className="category-badge">ჩვენს შესახებ</span>
            <h2 className="modal-title">ORION — სასწავლო პორტალი</h2>
          </div>
        </div>

        <div className="modal-section">
          <p>
            ORION არის თანამედროვე ონლაინ საგანმანათლებლო პლატფორმა, სადაც მოსწავლეები და
            მასწავლებლები ერთმანეთს ხვდებიან ცოდნის გაზიარებისა და განვითარებისთვის. პლატფორმაზე
            შეგიძლიათ იპოვოთ პროგრამირების, ქსელებისა და სხვა ტექნოლოგიური მიმართულებების კურსები,
            ჩაერთოთ სასწავლო პროცესში და თვალი ადევნოთ თქვენს პროგრესს.
          </p>
        </div>

        <div className="modal-section">
          <h4>ჩვენს შესახებ</h4>
          <p>
            მიზანი გვაქვს ხარისხიანი განათლება გავხადოთ ხელმისაწვდომი ყველასთვის — მიუხედავად
            ადგილმდებარეობისა თუ განრიგისა. მასწავლებლებს ვთავაზობთ მოქნილ ინსტრუმენტებს
            კურსების შესაქმნელად და მართვისთვის, ხოლო მოსწავლეებს — მარტივ გზას სასურველი
            კურსის მოსაძებნად, ჩასარიცხად და გასავლელად.
          </p>
        </div>

        <div className="modal-section">
          <h4>რატომ ORION</h4>
          <p>
            🎯 გადამოწმებული მასწავლებლები და სტრუქტურირებული სილაბუსი<br />
            💻 100% ონლაინ წვდომა ნებისმიერი მოწყობილობიდან<br />
            📈 პირადი კაბინეტი კურსების ისტორიისა და პროგრესის სამართავად
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AboutModal;
