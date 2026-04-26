// app/dashboard/applicants/page.js
import { redirect } from 'next/navigation'

export default function ApplicantsPage() {
  redirect('/dashboard/applicants/pending')
}