export const dashboardSummary = {
  revenue30d: 428600,
  ordersInProgress: 37,
  productsCount: 84,
  pendingReviews: 19
};

export const orders = [
  {
    id: "KRX-1024",
    customer: "Илья Волков",
    status: "new",
    amount: 7480,
    deliveryMethod: "СДЭК"
  },
  {
    id: "KRX-1025",
    customer: "Анна Жукова",
    status: "assembling",
    amount: 4990,
    deliveryMethod: "Почта РФ"
  },
  {
    id: "KRX-1026",
    customer: "Максим Карпов",
    status: "shipped",
    amount: 1180,
    deliveryMethod: "Boxberry"
  }
];

export const products = [
  {
    sku: "KR30",
    title: "Мультитул KaiRox KR30",
    category: "Мультитулы",
    price: 4990,
    stock: 37,
    reviews: 214
  },
  {
    sku: "KR13",
    title: "Мультитул KaiRox KR13",
    category: "Мультитулы",
    price: 3990,
    stock: 21,
    reviews: 96
  },
  {
    sku: "BTM-16",
    title: "Набор магнитных бит KaiRox",
    category: "Комплектующие",
    price: 290,
    stock: 114,
    reviews: 53
  }
];

export const reviews = [
  {
    id: 1,
    product: "Мультитул KaiRox KR30",
    source: "ozon",
    rating: 5,
    status: "pending",
    text: "Муж в восторге. Отвертка фиксируется, ножницы острые."
  },
  {
    id: 2,
    product: "Набор бит KaiRox",
    source: "ozon",
    rating: 2,
    status: "pending",
    text: "Не понял совместимость с моей моделью."
  }
];

export const deliverySettings = {
  freeFromAmount: 7000,
  methods: [
    { name: "СДЭК", enabled: true, calculationMode: "api", etaDays: "2-5" },
    { name: "Boxberry", enabled: true, calculationMode: "api", etaDays: "2-6" },
    { name: "Почта РФ", enabled: true, calculationMode: "zone", etaDays: "3-9" }
  ]
};

export const promotionOverview = {
  activeBanners: 3,
  activeCoupons: 2,
  landingPages: 4
};

export const customers = [
  { id: 1, name: "Илья Волков", city: "Москва", orders: 5, revenue: 24360 },
  { id: 2, name: "Анна Жукова", city: "Казань", orders: 2, revenue: 8980 }
];

export const dialogChannels = [
  { code: "ozon_reviews", title: "Отзывы Ozon", status: "connected" },
  { code: "wb_reviews", title: "Отзывы Wildberries", status: "queued" }
];

export const dialogTemplates = [
  { id: 1, title: "Позитивный отзыв", scope: "marketplaces" },
  { id: 2, title: "Негативный отзыв", scope: "marketplaces" }
];

export const siteSettings = {
  brandName: "KaiRox",
  colors: {
    bg: "#0b1020",
    panel: "#121a2e",
    primary: "#d69b00",
    primaryStrong: "#b88100",

    text: "#f8fafc",
    textSoft: "#9fb0d1"
  },
  appearance: {
    pageUseGradient: true,
    pageBg: "#0b1020",
    pageBgTo: "#121a2e",
    pageGradientAngle: 180,
    pageGlowEnabled: true,
    pageGlowColor: "#d69b00",

    headerUseGradient: false,
    headerBg: "#0b1020",
    headerBgTo: "#121a2e",
    headerGradientAngle: 180,

    surfaceUseGradient: false,
    surfaceBg: "#121a2e",
    surfaceBgTo: "#17213a",
    surfaceGradientAngle: 180,

    buttonUseGradient: false,
    buttonBg: "#d69b00",
    buttonBgTo: "#b88100",
    buttonGradientAngle: 90,
    buttonText: "#0b1020"
  },
  typography: {
    pageHeadingColor: "#f8fafc",
    pageTextColor: "#9fb0d1",
    blockHeadingColor: "#f8fafc",
    blockTextColor: "#9fb0d1",

    bodyFontFamily: "Arial, Helvetica, sans-serif",
    headingFontFamily: "Arial, Helvetica, sans-serif",
    bodyFontUrl: null as string | null,
    headingFontUrl: null as string | null
  },
  modules: {
    hero: true,
    categories: true,
    benefits: true,
    featuredProducts: true,
    articles: false
  },
  assets: {
    logoUrl: null as string | null,
    faviconUrl: null as string | null
  },
  adminTheme: {
    shellBg: "#08111f",
    sidebarBg: "#0a1220",
    panel: "#121a2e",
    panelStrong: "#17213a",
    primary: "#d69b00",
    primaryStrong: "#b88100",
    buttonUseGradient: false,
    buttonBg: "#d69b00",
    buttonBgTo: "#b88100",
    buttonGradientAngle: 90,
    buttonText: "#0b1020",
    text: "#f8fafc",
    textSoft: "#9fb0d1",
    inputText: "#f8fafc",
    headingText: "#f8fafc",

    inputBg: "#0b1020",
    layoutGap: 12,
    panelPadding: 12,
    controlPaddingX: 12,
    controlPaddingY: 8,
    controlHeight: 42,

    bodyFontFamily: "Arial, Helvetica, sans-serif",
    headingFontFamily: "Arial, Helvetica, sans-serif",
    bodyFontUrl: null as string | null,
    headingFontUrl: null as string | null
  }
};
