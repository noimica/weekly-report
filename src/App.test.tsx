import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

describe('App', () => {
  it('退勤時間を時計入力で保存できる', async () => {
    const user = userEvent.setup();

    render(<App />);

    const timeInput = screen.getAllByLabelText('退勤時間')[0];

    await user.clear(timeInput);
    await user.type(timeInput, '18:30');

    expect(timeInput).toHaveValue('18:30');
    expect(screen.getByDisplayValue('18:30')).toBeInTheDocument();
  });
});
