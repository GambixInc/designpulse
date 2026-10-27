-- Apply together with the deploy that switches the storefront to
-- start_checkout(). The simulated checkout() created paid orders, license keys
-- and real download tokens without taking any money, so any signed-in user
-- could call it from the browser and receive the real Wix delivery links.
-- Kept (not dropped) so the history stays readable; nobody can execute it.
revoke execute on function public.checkout(uuid[], uuid) from public, anon, authenticated;
