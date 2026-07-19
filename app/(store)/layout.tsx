import { CartProvider } from '@/components/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import '@/styles/storefront.css';

export const dynamic = 'force-dynamic';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="storefront-root min-h-screen relative flex flex-col">
        {children}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
