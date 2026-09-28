'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { subscribeToPushAction, unsubscribeFromPushAction } from '@/app/actions/push';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function EnablePushButton() {
  const t = useTranslations('notifications.push');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch (err) {
      console.error('checkSubscription failed', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setSupported(false);
      return;
    }

    navigator.serviceWorker.register('/sw.js').then(() => checkSubscription()).catch((err) => {
      console.error('serviceWorker registration failed', err);
    });
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setError('');

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError(t('permissionDenied'));
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError(t('notConfigured'));
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        setError(t('error'));
        return;
      }

      const result = await subscribeToPushAction({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth),
        },
        userAgent: navigator.userAgent,
      });

      if (result.success) setIsSubscribed(true);
      else setError(result.message ?? t('error'));
    } catch (err) {
      console.error('handleEnable failed', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError('');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeFromPushAction(endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('handleDisable failed', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">⚠️ {t('notSupported')}</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#222]">{t('title')}</h3>
          <p className="mt-1 text-sm text-slate-500">{isSubscribed ? t('enabled') : t('disabled')}</p>
        </div>
        <button
          type="button"
          onClick={isSubscribed ? handleDisable : handleEnable}
          disabled={loading}
          className={`rounded-xl px-6 py-3 font-bold text-white transition ${
            isSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2386c8] hover:bg-[#1a6da8]'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading ? t('loading') : isSubscribed ? t('disable') : t('enable')}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
