import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { AuthContext } from '../context/useAuth.js';

function preview(user = null, logout = vi.fn()) {
  render(
    <AuthContext.Provider value={{ user, loading: false, logout }}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('Mobile navigation', () => {
  it('opens the navigation and closes after choosing a route', async () => {
    preview();
    const user = userEvent.setup();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(toggle.getAttribute('aria-controls'))).toHaveClass('is-open');
    await user.click(screen.getByRole('link', { name: 'Help & FAQ' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes with Escape and returns keyboard focus to the toggle', async () => {
    preview();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    screen.getByRole('link', { name: 'Tours' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps staff navigation and sign out available inside the menu', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    preview({ name: 'Staff Member', role: 'staff' }, logout);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/staff');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logout).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
