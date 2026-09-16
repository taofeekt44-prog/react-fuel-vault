export default function LoadingScreen({ label = "Loading…" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--green-100)",
          borderTopColor: "var(--green-700)",
          animation: "lv-spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{label}</span>
      <style>{`@keyframes lv-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
