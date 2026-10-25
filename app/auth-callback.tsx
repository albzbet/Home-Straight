import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';

// Landing spot for sign-in links and Apple/Google. The AuthProvider reads the link; once signed in, start again from the top.
export default function AuthCallback() {
  const { session } = useAuth();
  if (session) return <Redirect href="/" />;
  return <Loading />;
}
