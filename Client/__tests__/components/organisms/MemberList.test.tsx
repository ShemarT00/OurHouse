import React from 'react';
import { render } from '@testing-library/react-native';
import { MemberList } from '@/components/organisms/MemberList';
import type { Member } from '@/types';

const member = (overrides: Partial<Member>): Member => ({
  OHID: 1,
  userId: 'user-1',
  householdId: 5,
  firstName: 'Jane',
  lastName: 'Doe',
  isAdmin: false,
  createdAt: '2026-10-21T00:00:00Z',
  ...overrides,
});

describe('MemberList', () => {
  it('lists every member by name with initials', () => {
    const { getByText } = render(
      <MemberList
        members={[
          member({ OHID: 1, userId: 'user-1', firstName: 'Jane', lastName: 'Doe', isAdmin: true }),
          member({ OHID: 2, userId: 'user-2', firstName: 'Sam', lastName: 'Lee' }),
        ]}
      />
    );

    expect(getByText(/Jane Doe/)).toBeTruthy();
    expect(getByText(/Sam Lee/)).toBeTruthy();
    expect(getByText('JD')).toBeTruthy();
    expect(getByText('SL')).toBeTruthy();
  });

  it('labels the admin and the current user', () => {
    const { getAllByText, getByText } = render(
      <MemberList
        members={[
          member({ OHID: 1, userId: 'user-1', isAdmin: true }),
          member({ OHID: 2, userId: 'user-2', firstName: 'Sam', lastName: 'Lee' }),
        ]}
        currentUserId="user-2"
      />
    );

    expect(getAllByText('Admin')).toHaveLength(1);
    expect(getByText(/\(You\)/)).toBeTruthy();
  });
});
