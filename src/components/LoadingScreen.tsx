const LoadingScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a6b7a',
      zIndex: 9999,
    }}>
      <img
        src="/icon.png"
        alt="Dispatch"
        style={{
          width: 120,
          borderRadius: 24,
          marginBottom: 28,
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }}
      />
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: '0.08em' }}>
        DISPATCH
      </h1>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#f97316",
              animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-12px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
