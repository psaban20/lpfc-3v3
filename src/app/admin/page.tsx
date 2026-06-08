import Masthead from "@/components/Masthead";
import LoginForm from "@/components/LoginForm";
import AdminPanel from "@/components/AdminPanel";
import { isAuthed } from "@/lib/auth";
import { getPresentDivisions } from "@/lib/present";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthed();
  if (!authed) {
    return (
      <>
        <Masthead />
        <LoginForm />
      </>
    );
  }
  const divisions = await getPresentDivisions();
  return (
    <>
      <Masthead />
      <AdminPanel divisions={divisions} />
    </>
  );
}
