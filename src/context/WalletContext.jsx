/**
 * context/WalletContext.jsx
 * ---------------------------------------------------------------------------
 * A second, differently-shaped Context example, on purpose — AuthContext
 * manages "who is logged in" (restored once from a cookie). WalletContext
 * manages "what does the server currently say my balance is" — data that
 * several unrelated screens need to read AND that changes as a side effect
 * of actions taken on OTHER screens:
 *
 *   - Dashboard shows the balance.
 *   - Buy Litres changes it (after a successful payment).
 *   - Redeem Fuel needs the current balance to validate the litres input,
 *     and changes it again (after a successful redemption).
 *
 * Without a shared context, BuyLitres and RedeemFuel would each hold their
 * own stale copy of "available litres" fetched on mount, and there'd be no
 * clean way for a purchase on one screen to update the number on another
 * without a full page reload. Wrapping it in Context + a `refreshWallet()`
 * function solves that: any screen that changes the balance just calls
 * `refreshWallet()` and every other screen reading `wallet` re-renders with
 * the new number automatically.
 *
 * This only needs to wrap the authenticated part of the app — it depends on
 * a valid session, so mount it inside <AuthProvider>, not around it.
 * ---------------------------------------------------------------------------
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWallet } from "../api/wallet";
import { useAuth } from "./AuthContext";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState(null); // { balance, available_litres }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWallet();
      setWallet(data.wallet);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the wallet once the user is authenticated; clear it the moment
  // they log out so a subsequent login by someone else never shows a
  // leftover balance from the previous session.
  useEffect(() => {
    if (isAuthenticated) {
      refreshWallet();
    } else {
      setWallet(null);
    }
  }, [isAuthenticated, refreshWallet]);

  const availableLitres = wallet ? Number(wallet.available_litres) : 0;

  return (
    <WalletContext.Provider value={{ wallet, availableLitres, isLoading, error, refreshWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Practical usage after any action that changes the balance:
 *
 *   const { availableLitres, refreshWallet } = useWallet();
 *   await verifyPayment(reference);
 *   await refreshWallet();  // <-- dashboard, redeem page, etc. all update
 */
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet() must be called inside a <WalletProvider>. Check src/App.js.");
  }
  return ctx;
}
