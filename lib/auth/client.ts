import { getClientSession } from './session';

export function verifyClientSession(slug: string) {
  return getClientSession(slug);
}
