import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
}

const BASE_TITLE = 'Jara Daily — Nigeria\'s #1 Content & Rewards Platform';
const BASE_DESC = 'Read, share, and earn on Nigeria\'s premier content platform. Earn XP & Jara Coins by engaging with Money, Hausa, and Gist content.';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo({ title, description, image }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Jara Daily` : BASE_TITLE;
    const desc = description || BASE_DESC;

    document.title = fullTitle;
    setMeta('description', desc);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);

    if (image) {
      setMeta('og:image', image, 'property');
      setMeta('twitter:image', image);
    }

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, image]);
}
