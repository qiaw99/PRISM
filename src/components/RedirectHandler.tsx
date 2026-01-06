'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      // 提取路径部分（去掉 origin）
      const url = new URL(redirect, window.location.origin);
      const path = url.pathname + url.search + url.hash;
      if (path && path !== '/') {
        router.replace(path);
      }
    }
  }, [router]);

  return null;
}