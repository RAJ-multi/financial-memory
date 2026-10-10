import test from 'node:test';
import assert from 'node:assert/strict';
import { isSupabaseConfigured, getAuthState, subscribeAuth, signOut } from '../src/auth.js';
import { SUPABASE_CONFIG } from '../src/supabase-config.js';
import { renderSettings } from '../src/ui.js';
import { store } from '../src/store.js';

test('auth module initializes in guest mode when unauthenticated', () => {
  const state = getAuthState();
  assert.equal(state.user, null);
  assert.equal(state.mode, 'guest');
});

test('renderSettings renders Guest mode UI with Google sign-in button', () => {
  const dummyData = store.getData();
  const guestState = {
    user: null,
    session: null,
    mode: 'guest',
    isLoading: false,
    error: null,
    isConfigured: false
  };

  const html = renderSettings(dummyData, false, null, guestState);
  assert.ok(html.includes('Guest Mode'), 'Should display Guest Mode badge');
  assert.ok(html.includes('Continue with Google'), 'Should include Continue with Google button');
  assert.ok(html.includes('btn-google-signin'), 'Should have id btn-google-signin');
});

test('renderSettings renders Signed In mode UI with account information and Sign Out button', () => {
  const dummyData = store.getData();
  const signedInState = {
    user: {
      id: 'usr_1234567890',
      email: 'student@example.edu',
      user_metadata: {
        full_name: 'Alex Student',
        avatar_url: 'https://example.com/avatar.png'
      }
    },
    session: { access_token: 'fake_jwt_token' },
    mode: 'signed_in',
    isLoading: false,
    error: null,
    isConfigured: true
  };

  const html = renderSettings(dummyData, false, null, signedInState);
  assert.ok(html.includes('Signed In'), 'Should display Signed In badge');
  assert.ok(html.includes('Alex Student'), 'Should display user name');
  assert.ok(html.includes('student@example.edu'), 'Should display user email');
  assert.ok(html.includes('Sign Out'), 'Should display Sign Out button');
  assert.ok(html.includes('btn-auth-signout'), 'Should have id btn-auth-signout');
  assert.ok(!html.includes('Continue with Google'), 'Should not display Continue with Google when already signed in');
});

test('guest data remains intact when sign out is called', async () => {
  store.deleteAllLocalData();
  const exp = store.addExpense({
    amount: 15.0,
    category: 'Food & Drinks',
    date: '2026-10-10',
    description: 'Local test expense'
  });

  await signOut();

  const expenses = store.getExpenses();
  assert.equal(expenses.length, 1);
  assert.equal(expenses[0].id, exp.id);
  assert.equal(expenses[0].amount, 15.0);
});

test('isSupabaseConfigured returns false when URL or anonKey are empty or invalid', () => {
  SUPABASE_CONFIG.url = '';
  SUPABASE_CONFIG.anonKey = '';
  assert.equal(isSupabaseConfigured(), false);

  SUPABASE_CONFIG.url = 'https://demo.supabase.co';
  SUPABASE_CONFIG.anonKey = '';
  assert.equal(isSupabaseConfigured(), false);

  SUPABASE_CONFIG.url = 'https://demo.supabase.co';
  SUPABASE_CONFIG.anonKey = 'sample-public-anon-key';
  assert.equal(isSupabaseConfigured(), true);

  // Clean back
  SUPABASE_CONFIG.url = '';
  SUPABASE_CONFIG.anonKey = '';
});
