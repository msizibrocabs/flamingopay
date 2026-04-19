import { I18nProvider } from "../../lib/i18n";
import { PaymentNotifier } from "./_components/PaymentNotifier";

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <PaymentNotifier />
      {children}
    </I18nProvider>
  );
}
