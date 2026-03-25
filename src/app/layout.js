export const metadata = {
  title: 'Homelab Pipeline Check',
  description: 'Coolify deployment validation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
