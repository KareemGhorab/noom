import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { getActiveCurrency } from "@/lib/currency/preference";

/**
 * Resolves the active currency on its own so the static header shell does not
 * have to await cookie / session preference reads before streaming.
 */
export async function HeaderCurrencySwitcher() {
  const currency = await getActiveCurrency();
  return <CurrencySwitcher currency={currency} />;
}
