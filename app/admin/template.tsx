// template.tsx re-mounts on every route change inside /admin (unlike
// layout.tsx which persists). That gives us a cheap hook to run a
// subtle fade-in on every navigation so page transitions feel less
// abrupt on mobile — closer to a native app.

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-page-fade">{children}</div>;
}
