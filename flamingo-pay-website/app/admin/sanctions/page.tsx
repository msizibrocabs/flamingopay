import { redirect } from "next/navigation";

/**
 * Sanctions & PEP screening has moved to the Compliance portal.
 * This redirect ensures old bookmarks still work.
 */
export default function SanctionsRedirect() {
  redirect("/compliance/sanctions");
}
