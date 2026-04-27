import { redirect } from 'next/navigation'

export default function ApplicantsPage() {
  redirect('/dashboard/applicants/pending')
}