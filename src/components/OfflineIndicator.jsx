import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`position-fixed top-0 start-0 end-0 p-3 ${
        isOnline ? 'bg-success' : 'bg-warning'
      } text-white`}
      style={{ zIndex: 1060 }}
    >
      <div className="d-flex align-items-center justify-content-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={20} />
            <span>İnternet bağlantısı yenilendi</span>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <span>İnternet bağlantısı yok - Çevrimdışı modda çalışıyorsunuz</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
