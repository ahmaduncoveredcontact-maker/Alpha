import { cookies } from 'next/headers';

export function setAdminSession() {
  const cookieStore = cookies();
  cookieStore.set('admin_session', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export function clearAdminSession() {
  const cookieStore = cookies();
  cookieStore.delete('admin_session');
}

export function getAdminSession() {
  const cookieStore = cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}

export function setClientSession(slug: string) {
  const cookieStore = cookies();
  cookieStore.set(`client_session_${slug}`, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: `/live/${slug}`,
  });
}

export function clearClientSession(slug: string) {
  const cookieStore = cookies();
  cookieStore.delete(`client_session_${slug}`);
}

export function getClientSession(slug: string) {
  const cookieStore = cookies();
  return cookieStore.get(`client_session_${slug}`)?.value === 'true';
}
