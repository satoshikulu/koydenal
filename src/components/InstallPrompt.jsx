import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // PWA install prompt event listener
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Kullanıcı daha önce reddetmediyse göster
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Zaten yüklü mü kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA yüklendi');
    } else {
      console.log('PWA yükleme reddedildi');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    // 7 gün sonra tekrar göster
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="position-fixed bottom-0 start-0 end-0 p-3" style={{ zIndex: 1050 }}>
      <div className="card shadow-lg border-0">
        <div className="card-body bg-success text-white rounded">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <Download size={32} />
              <div>
                <h6 className="mb-0 fw-bold">KöydenAL'ı Yükle</h6>
                <small className="opacity-75">
                  Uygulamayı ana ekranına ekle, daha hızlı eriş!
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light btn-sm"
                onClick={handleInstall}
              >
                Yükle
              </button>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleDismiss}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
