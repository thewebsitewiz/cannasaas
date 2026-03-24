export type Locale = 'en' | 'es';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.login': 'Sign In',
    'nav.register': 'Create Account',
    'product.addToCart': 'Add to Cart',
    'product.outOfStock': 'Out of Stock',
    'product.thc': 'THC',
    'product.cbd': 'CBD',
    'product.effects': 'Effects',
    'product.strain': 'Strain',
    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'checkout.pickup': 'Pickup',
    'checkout.delivery': 'Delivery',
    'checkout.cash': 'Cash',
    'checkout.card': 'Card',
    'checkout.placeOrder': 'Place Order',
    'loyalty.points': 'Points',
    'loyalty.tier': 'Tier',
    'loyalty.rewards': 'Rewards',
    'age.title': 'Age Verification',
    'age.confirm': 'I confirm I am 21 or older',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.search': 'Search',
    'common.filter': 'Filter',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.products': 'Productos',
    'nav.cart': 'Carrito',
    'nav.account': 'Mi Cuenta',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Crear Cuenta',
    'product.addToCart': 'Agregar al Carrito',
    'product.outOfStock': 'Agotado',
    'product.thc': 'THC',
    'product.cbd': 'CBD',
    'product.effects': 'Efectos',
    'product.strain': 'Cepa',
    'cart.empty': 'Tu carrito está vacío',
    'cart.subtotal': 'Subtotal',
    'cart.tax': 'Impuestos',
    'cart.total': 'Total',
    'cart.checkout': 'Pagar',
    'checkout.pickup': 'Recoger',
    'checkout.delivery': 'Entrega',
    'checkout.cash': 'Efectivo',
    'checkout.card': 'Tarjeta',
    'checkout.placeOrder': 'Realizar Pedido',
    'loyalty.points': 'Puntos',
    'loyalty.tier': 'Nivel',
    'loyalty.rewards': 'Recompensas',
    'age.title': 'Verificación de Edad',
    'age.confirm': 'Confirmo que tengo 21 años o más',
    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored === 'es') return 'es';
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang === 'es') return 'es';
  }
  return 'en';
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') localStorage.setItem('locale', locale);
}
