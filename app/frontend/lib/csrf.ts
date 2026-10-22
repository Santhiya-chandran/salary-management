// Rails renders the session's CSRF token in <meta name="csrf-token">
// (csrf_meta_tags in the layout). Forms and API requests must send it back.
export function csrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (!meta) throw new Error("CSRF token meta tag not found");

  return meta.content;
}
