import '@/lib/polyfills';
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}
