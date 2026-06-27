import { useState, useEffect } from 'react';
import { fetchAccount } from '../api/lichess';

const CLIENT_ID = import.meta.env.VITE_LICHESS_CLIENT_ID ?? 'chess-ui-local';
const REDIRECT_URI = `${window.location.origin}${window.location.pathname}`;
const LICHESS_OAUTH = 'https://lichess.org/oauth';
const LICHESS_TOKEN = 'https://lichess.org/api/token';

export interface LichessRatings {
  bullet?:    number;
  blitz?:     number;
  rapid?:     number;
  classical?: number;
}

export interface LichessUser {
  id: string;
  username: string;
  rating?: number;
  ratings: LichessRatings;
}

export function useLichessAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lichess_token'));
  const [user, setUser] = useState<LichessUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle OAuth callback (code in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const verifier = sessionStorage.getItem('lichess_cv');
    if (!code || !verifier) return;

    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.removeItem('lichess_cv');
    setLoading(true);

    exchangeCode(code, verifier).then(t => {
      if (t) {
        localStorage.setItem('lichess_token', t);
        setToken(t);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user info when token is present
  useEffect(() => {
    if (!token) { setUser(null); return; }
    fetchAccount(token)
      .then(data => {
        const p = data.perfs ?? {};
        setUser({
          id: data.id,
          username: data.username,
          rating: p.blitz?.rating ?? p.rapid?.rating,
          ratings: {
            bullet:    p.bullet?.rating,
            blitz:     p.blitz?.rating,
            rapid:     p.rapid?.rating,
            classical: p.classical?.rating,
          },
        });
      })
      .catch(() => logout());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function login() {
    const verifier = generateVerifier();
    const challenge = await codeChallenge(verifier);
    sessionStorage.setItem('lichess_cv', verifier);

    const url = new URL(LICHESS_OAUTH);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('scope', 'board:play');
    window.location.href = url.toString();
  }

  function logout() {
    localStorage.removeItem('lichess_token');
    setToken(null);
    setUser(null);
  }

  return { token, user, loading, login, logout };
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
function generateVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function codeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function exchangeCode(code: string, verifier: string): Promise<string | null> {
  const r = await fetch(LICHESS_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const data = await r.json();
  return data.access_token ?? null;
}
