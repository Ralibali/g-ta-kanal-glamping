import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getSessionId(): string {
  let sid = sessionStorage.getItem('_track_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('_track_sid', sid);
  }
  return sid;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const sessionId = getSessionId();

    supabase.from('page_views').insert({
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: sessionId,
      device_type: getDeviceType(),
    } as any).then(() => {});
  }, [location.pathname]);
}

export function trackClick(eventName: string, opts?: {
  elementId?: string;
  elementText?: string;
  metadata?: Record<string, any>;
}) {
  const sessionId = getSessionId();
  supabase.from('click_events').insert({
    event_name: eventName,
    element_id: opts?.elementId,
    element_text: opts?.elementText,
    path: window.location.pathname,
    session_id: sessionId,
    metadata: opts?.metadata || {},
  } as any).then(() => {});
}

const CTA_KEYWORDS = [
  'boka', 'bokning', 'reservera', 'kontakta', 'läs mer', 'visa mer',
  'kom igång', 'skicka', 'beställ', 'köp', 'checka in',
];

const TRACKED_ROLES = ['button', 'link', 'menuitem'];

export function useAutoClickTracking() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      let el: HTMLElement | null = target;
      let depth = 0;
      while (el && depth < 6) {
        const tag = el.tagName?.toLowerCase();
        const role = el.getAttribute('role');
        if (tag === 'button' || tag === 'a' || (role && TRACKED_ROLES.includes(role))) break;
        el = el.parentElement;
        depth++;
      }

      if (!el || depth >= 6) return;

      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().substring(0, 80);
      const textLower = text.toLowerCase();

      if (!text || text.length < 2) return;

      let eventName = 'click';
      const href = el.getAttribute('href') || '';

      const isCta = CTA_KEYWORDS.some(kw => textLower.includes(kw));
      if (isCta) {
        eventName = 'cta_click';
      } else if (tag === 'a' && href.startsWith('/blogg/')) {
        eventName = 'blog_link_click';
      } else if (tag === 'a' && (href.startsWith('http') || href.startsWith('//'))) {
        eventName = 'external_link_click';
      } else if (tag === 'a') {
        eventName = 'nav_click';
      } else {
        eventName = 'button_click';
      }

      trackClick(eventName, {
        elementId: el.id || el.getAttribute('data-track') || undefined,
        elementText: text,
        metadata: { tag, href: href || undefined, isCta },
      });
    };

    document.addEventListener('click', handler, { passive: true, capture: true });
    return () => document.removeEventListener('click', handler, true);
  }, []);
}
