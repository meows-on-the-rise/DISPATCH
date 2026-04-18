import dispatchLogo from '../assets/apple-touch-icon.png';

const LoadingScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f0f0f',
      zIndex: 9999,
    }}>
      <img
        src={dispatchLogo}
        alt="Dispatch"
        style={{ width: 100, borderRadius: 24, marginBottom: 20 }}
      />
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Dispatch
      </h1>
      <div style={{
        width: 40,
        height: 40,
        border: '4px solid #333',
        borderTop: '4px solid #f97316',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingScreen;
