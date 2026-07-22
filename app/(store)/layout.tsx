import { CartProvider } from '@/components/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import '@/styles/storefront.css';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="storefront-root theme-dark min-h-screen relative flex flex-col">
        {children}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
