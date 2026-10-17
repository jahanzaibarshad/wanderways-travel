import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { AuthContext } from '../context/useAuth.js';
import ToursPage from '../pages/ToursPage.jsx';
import TourPreview from '../components/TourPreview.jsx';
import HelpPage from '../pages/HelpPage.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import ConfirmationPage from '../pages/ConfirmationPage.jsx';
import App from '../App.jsx';
import MyBookingsPage from '../pages/MyBookingsPage.jsx';
import TourDetailPage from '../pages/TourDetailPage.jsx';

vi.mock('../api/client.js', () => ({ api: vi.fn() }));
const future = new Date(Date.now() + 86400000 * 30).toISOString();
const tours = [
  {
    _id: 'hunza',
    title: 'Hunza Mountains',
    destination: 'Hunza',
    description: 'Walk among the peaks',
    duration: 7,
    price: 92000,
    slots: [{ date: future, capacity: 12, bookedSeats: 1 }],
  },
  {
    _id: 'swat',
    title: 'Swat Forests',
    destination: 'Swat',
    description: 'A forest escape',
    duration: 4,
    price: 67000,
    slots: [{ date: future, capacity: 12, bookedSeats: 12 }],
  },
  {
    _id: 'skardu',
    title: 'Skardu Lakes',
    destination: 'Skardu',
    description: 'Alpine lakes',
    duration: 6,
    price: 84000,
    slots: [{ date: '2020-01-01', capacity: 12, bookedSeats: 0 }],
  },
];
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}
function preview(element, path = '/tours', auth = { loading: false, user: null }) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path="/tours" element={element} />
          <Route path="/staff" element={<h1>Staff workspace</h1>} />
          <Route path="/bookings" element={<h1>My reservations</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
beforeEach(() => {
  api.mockReset();
  api.mockResolvedValue(tours);
});
describe('Website completion', () => {
  it('refreshes customer bookings to show a staff status change', async () => {
    const booking = {
      _id: 'booking',
      reference: 'WW-REFRESH',
      tour: tours[0],
      date: future,
      guests: 1,
      totalPrice: 92000,
      status: 'pending',
    };
    api
      .mockResolvedValueOnce([booking])
      .mockResolvedValueOnce([{ ...booking, status: 'confirmed' }]);
    const user = userEvent.setup();
    preview(<MyBookingsPage />);
    await screen.findByText('pending');
    await user.click(screen.getByRole('button', { name: 'Refresh bookings' }));
    await screen.findByText('confirmed');
    expect(api).toHaveBeenCalledTimes(2);
  });
  it('recovers from a failed journey request without leaving the page', async () => {
    api
      .mockRejectedValueOnce(new Error('Connection interrupted'))
      .mockResolvedValueOnce({ ...tours[0], slots: [] });
    const user = userEvent.setup();
    preview(<TourDetailPage />);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry journey' }));
    await screen.findByRole('heading', { name: 'Hunza Mountains' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('connects help navigation, route titles and keyboard focus in the full app', async () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={{ loading: false, user: null }}>
        <MemoryRouter initialEntries={['/help']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(document.title).toBe('WanderWays | Travel & booking help');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('link', { name: 'Help & FAQ' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('link', { name: 'Tours' }));
    await screen.findByRole('heading', { name: 'Find your next story' });
    expect(document.title).toBe('WanderWays | Explore journeys');
    expect(screen.getByRole('main')).toHaveFocus();
    scroll.mockRestore();
  });
  it('searches titles, destinations and descriptions with a no-results state', async () => {
    const user = userEvent.setup();
    preview(<ToursPage />);
    await screen.findByRole('heading', { name: 'Hunza Mountains' });
    await user.type(screen.getByLabelText('Search journeys'), 'forest');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Swat Forests' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search journeys'));
    await user.type(screen.getByLabelText('Search journeys'), 'not-a-destination');
    expect(screen.getByText('No journeys match your search')).toBeInTheDocument();
  });
  it('restores destination filters from the URL and clears them', async () => {
    const user = userEvent.setup();
    preview(<ToursPage />, '/tours?destination=Swat');
    await screen.findByRole('heading', { name: 'Swat Forests' });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/tours$/);
  });
  it('sorts prices in both directions and sorts duration', async () => {
    const user = userEvent.setup();
    preview(<ToursPage />);
    await screen.findByText('Hunza Mountains');
    const sort = screen.getByLabelText('Sort by');
    await user.selectOptions(sort, 'price-asc');
    expect(within(screen.getAllByRole('article')[0]).getByRole('heading')).toHaveTextContent(
      'Swat Forests',
    );
    await user.selectOptions(sort, 'price-desc');
    expect(within(screen.getAllByRole('article')[0]).getByRole('heading')).toHaveTextContent(
      'Hunza Mountains',
    );
    await user.selectOptions(sort, 'duration');
    expect(within(screen.getAllByRole('article')[0]).getByRole('heading')).toHaveTextContent(
      'Swat Forests',
    );
  });
  it('excludes sold-out and past departures when availability is selected', async () => {
    const user = userEvent.setup();
    preview(<ToursPage />);
    await screen.findByText('Hunza Mountains');
    await user.click(screen.getByLabelText('Available departures only'));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByTestId('location')).toHaveTextContent('available=true');
  });
  it('loads homepage tour prices and specific detail links from the API', async () => {
    preview(<TourPreview />);
    await screen.findByText('Hunza Mountains');
    expect(screen.getByRole('link', { name: 'View journey: Hunza Mountains' })).toHaveAttribute(
      'href',
      '/tours/hunza',
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it('recovers from a featured tours network failure', async () => {
    api.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValue(tours);
    const user = userEvent.setup();
    preview(<TourPreview />);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry featured tours' }));
    await screen.findByText('Hunza Mountains');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('provides expandable booking help without claiming a connected support inbox', async () => {
    const user = userEvent.setup();
    preview(<HelpPage />);
    await user.click(screen.getByText('Do I pay online?'));
    expect(screen.getByText('Do I pay online?').closest('details')).toHaveAttribute('open');
    expect(screen.getByText(/does not collect payments or card details/)).toBeInTheDocument();
    expect(screen.getByText(/No support inbox is connected/)).toBeInTheDocument();
  });
  it('toggles password visibility without submitting', async () => {
    const login = vi.fn();
    const user = userEvent.setup();
    preview(<AuthPage mode="login" />, '/tours', { loading: false, user: null, login });
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(login).not.toHaveBeenCalled();
  });
  it('takes staff to their dashboard after sign-in', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'staff' });
    const user = userEvent.setup();
    preview(<AuthPage mode="login" />, '/tours', { loading: false, user: null, login });
    await user.type(screen.getByLabelText('Email address'), 'staff@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password42!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: 'Staff workspace' });
  });
  it('preserves a requested customer page after sign-in', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'customer' });
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={{ loading: false, user: null, login }}>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/bookings' } }]}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/bookings" element={<h1>My reservations</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    await user.type(screen.getByLabelText('Email address'), 'customer@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password42!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: 'My reservations' });
  });
  it('prints the current reservation when requested', async () => {
    api.mockResolvedValue({
      reference: 'WW-PRINT',
      tour: tours[0],
      date: future,
      guests: 1,
      totalPrice: 92000,
      status: 'pending',
    });
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const user = userEvent.setup();
    preview(<ConfirmationPage />);
    await user.click(await screen.findByRole('button', { name: 'Print reservation' }));
    await waitFor(() => expect(print).toHaveBeenCalledOnce());
    print.mockRestore();
  });
});
