import Masthead from "@/components/Masthead";
import PublicView from "@/components/PublicView";
import { getPresentDivisions } from "@/lib/present";

export const dynamic = "force-dynamic"; // always show the latest scores

export default async function Page() {
  const divisions = await getPresentDivisions();
  return (
    <>
      <Masthead live />
      <PublicView divisions={divisions} />
    </>
  );
}
