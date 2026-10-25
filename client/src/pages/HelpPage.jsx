import { Link } from 'react-router-dom';

const questions = [
  [
    'How do I reserve a journey?',
    'Create an account or sign in, open a tour, choose an upcoming departure and enter your guest and contact details. After submitting, you receive a booking reference.',
  ],
  [
    'Do I pay online?',
    'No. This version reserves seats only and does not collect payments or card details. Your total is shown in PKR per booking, based on the number of guests.',
  ],
  [
    'What do the booking statuses mean?',
    'Pending means the reservation is awaiting staff review. Confirmed means staff have accepted it. Both hold your seats. Cancelled reservations no longer hold seats and cannot be reopened.',
  ],
  [
    'Where can I see my reservation?',
    'Sign in with the account used to book, then open My Bookings. Select a reservation to see its reference, departure, guest count, total and current status.',
  ],
  [
    'Why is a departure unavailable?',
    'Departures in the past cannot be booked, and sold-out dates are disabled. Availability is checked again when you submit, so another traveller may reserve the last seats before you.',
  ],
  [
    'How do I change or cancel a booking?',
    'Customers cannot change or cancel a reservation directly in this version. A staff member can cancel it from the dashboard, which releases its seats. Keep your booking reference when discussing a reservation with staff.',
  ],
];

export default function HelpPage() {
  return (
    <section className="section help-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A little clarity before you go</p>
          <h1>Travel & booking help</h1>
        </div>
        <p>Everything you need to know about making and managing a reservation.</p>
      </div>
      <div className="help-layout">
        <div className="faq-list">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <aside className="help-card">
          <p className="eyebrow">Your next step</p>
          <h2>Ready for a new story?</h2>
          <p>Compare journeys, choose a departure and reserve your place.</p>
          <Link className="button button-primary" to="/tours">
            Explore journeys
          </Link>
          <Link className="text-link" to="/account">
            Open your account →
          </Link>
          <p className="field-hint">
            Keep your booking reference handy. Your account shows your latest reservation details
            and status.
          </p>
        </aside>
      </div>
    </section>
  );
}
