import { render, screen, waitFor } from '@testing-library/react';
import AddItem from '@/app/admin/add/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: [
        { slug: 'liste-1', label: 'Liste 1', owner_id: 1, owner_name: 'Alice', is_common: false, enabled: true },
        { slug: 'commune', label: 'Liste commune', owner_id: null, owner_name: null, is_common: true, enabled: true },
      ],
    }),
    post: jest.fn(),
  },
}));

describe('AddItem list dropdown', () => {
  it('renders options fetched from the API', async () => {
    render(<AddItem />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Liste 1' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Liste commune' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Bob' })).toBeNull();
  });
});
