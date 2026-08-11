import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/shared/components/layout/app-shell';
import { PlaceholderPage } from '@/shared/components/placeholder-page';
import { PageLoader } from '@/shared/components/ui/skeleton';

const HomePage = lazy(() =>
  import('@/features/home/pages/home-page').then((module) => ({
    default: module.HomePage,
  })),
);

const ProductsPage = lazy(() =>
  import('@/features/products/pages/products-page').then((module) => ({
    default: module.ProductsPage,
  })),
);

const ProductDetailPage = lazy(() =>
  import('@/features/products/pages/product-detail-page').then((module) => ({
    default: module.ProductDetailPage,
  })),
);

const SearchPage = lazy(() =>
  import('@/features/products/pages/search-page').then((module) => ({
    default: module.SearchPage,
  })),
);

const CategoriesPage = lazy(() =>
  import('@/features/categories/pages/categories-page').then((module) => ({
    default: module.CategoriesPage,
  })),
);

const CategoryDetailPage = lazy(() =>
  import('@/features/categories/pages/category-detail-page').then((module) => ({
    default: module.CategoryDetailPage,
  })),
);

const WishlistPage = lazy(() =>
  import('@/features/wishlist/pages/wishlist-page').then((module) => ({
    default: module.WishlistPage,
  })),
);

const CartPage = lazy(() =>
  import('@/features/cart/pages/cart-page').then((module) => ({
    default: module.CartPage,
  })),
);

const CheckoutPage = lazy(() =>
  import('@/features/checkout/pages/checkout-page').then((module) => ({
    default: module.CheckoutPage,
  })),
);

const OrderConfirmationPage = lazy(() =>
  import('@/features/checkout/pages/order-confirmation-page').then((module) => ({
    default: module.OrderConfirmationPage,
  })),
);

const OrdersPage = lazy(() =>
  import('@/features/orders/pages/orders-page').then((module) => ({
    default: module.OrdersPage,
  })),
);

const LoginPage = lazy(() =>
  import('@/features/auth/pages/login-page').then((module) => ({
    default: module.LoginPage,
  })),
);

const AccountPage = lazy(() =>
  import('@/features/auth/pages/account-page').then((module) => ({
    default: module.AccountPage,
  })),
);

function RouteFallback() {
  const { t } = useTranslation();
  return <PageLoader label={t('states.loading')} />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:categorySlug" element={<CategoryDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="admin" element={<PlaceholderPage titleKey="nav.admin" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
