import { cookies } from 'next/headers';
import { verify } from '@/lib/auth';
import Teacher from '@/components/Teacher';
export const dynamic = 'force-dynamic';
export default async function TeacherPage() {
  const authenticated = !!verify((await cookies()).get('galileo_teacher')?.value, 'teacher');
  return <Teacher authenticated={authenticated} />;
}
