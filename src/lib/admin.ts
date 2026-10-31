export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ''
  const adminList = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return adminList.includes(email.toLowerCase())
}
