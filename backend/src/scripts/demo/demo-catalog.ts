/** Catálogo de demostración de TecnoBray. Marcas y modelos ficticios. */

export type DemoIcon = 'phone' | 'laptop' | 'monitor' | 'headphones' | 'speaker' | 'charger' | 'case' | 'watch' | 'gamepad' | 'tablet' | 'earbuds' | 'keyboard';

export interface DemoCategory {
  slug: string;
  name: string;
  description: string;
  icon: DemoIcon;
  color: [string, string];
  children?: Array<{ slug: string; name: string; description: string }>;
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    slug: 'celulares', name: 'Celulares', icon: 'phone', color: ['#0F62FE', '#6929C4'],
    description: 'Smartphones 4G y 5G con garantía y envío a toda Colombia.',
    children: [
      { slug: 'celulares-gama-alta', name: 'Gama alta', description: 'Lo último en cámaras, pantallas y rendimiento.' },
      { slug: 'celulares-gama-media', name: 'Gama media', description: 'El mejor equilibrio entre precio y prestaciones.' },
    ],
  },
  {
    slug: 'computadores', name: 'Computadores', icon: 'laptop', color: ['#005D5D', '#0F62FE'],
    description: 'Portátiles y monitores para estudio, trabajo y creación.',
    children: [
      { slug: 'portatiles', name: 'Portátiles', description: 'Portátiles livianos y potentes.' },
      { slug: 'monitores', name: 'Monitores', description: 'Monitores Full HD, 2K y 4K.' },
    ],
  },
  {
    slug: 'audio', name: 'Audio', icon: 'headphones', color: ['#9F1853', '#FA4D56'],
    description: 'Audífonos, earbuds y parlantes con sonido envolvente.',
    children: [
      { slug: 'audifonos', name: 'Audífonos', description: 'Diadema y true wireless con cancelación de ruido.' },
      { slug: 'parlantes', name: 'Parlantes', description: 'Parlantes portátiles y para el hogar.' },
    ],
  },
  {
    slug: 'accesorios', name: 'Accesorios', icon: 'charger', color: ['#B28600', '#FF832B'],
    description: 'Cargadores, cables, fundas y todo para tus equipos.',
    children: [
      { slug: 'cargadores-y-cables', name: 'Cargadores y cables', description: 'Carga rápida USB-C y cables certificados.' },
      { slug: 'fundas-y-protectores', name: 'Fundas y protectores', description: 'Protección para celular y tablet.' },
    ],
  },
  { slug: 'smartwatches', name: 'Smartwatches', icon: 'watch', color: ['#198038', '#08BDBA'], description: 'Relojes inteligentes y bandas deportivas.' },
  { slug: 'gaming', name: 'Gaming', icon: 'gamepad', color: ['#491D8B', '#D12771'], description: 'Controles, teclados y accesorios gamer.' },
  { slug: 'tablets', name: 'Tablets', icon: 'tablet', color: ['#1192E8', '#33B1FF'], description: 'Tablets para estudiar, trabajar y entretenerte.' },
];

export const DEMO_BRANDS = ['Nova', 'Kairo', 'Andes Tech', 'Volta', 'Sonik', 'Pixelia', 'Zentro', 'Lumo'];

export interface DemoProduct {
  name: string;
  sku: string;
  brand: string;
  category: string;
  icon: DemoIcon;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  short: string;
  specs: Array<[string, string]>;
  highlights: string[];
  images?: number;
}

const P = (p: DemoProduct) => p;

export const DEMO_PRODUCTS: DemoProduct[] = [
  // Celulares gama alta
  P({ name: 'Nova X Pro 256 GB', sku: 'TB-CEL-001', brand: 'Nova', category: 'celulares-gama-alta', icon: 'phone', price: 3899900, compareAtPrice: 4299900, stock: 14, featured: true, images: 3,
    short: 'Pantalla AMOLED 6,7" a 120 Hz, triple cámara de 50 MP y carga rápida de 67 W.',
    specs: [['Pantalla', '6,7" AMOLED 120 Hz'], ['Almacenamiento', '256 GB'], ['RAM', '12 GB'], ['Cámara principal', '50 MP + 50 MP + 12 MP'], ['Batería', '5.000 mAh, carga 67 W'], ['Red', '5G']],
    highlights: ['Fotografía nocturna mejorada', 'Resistencia al agua IP68', 'Dos años de garantía'] }),
  P({ name: 'Kairo Edge 5G 512 GB', sku: 'TB-CEL-002', brand: 'Kairo', category: 'celulares-gama-alta', icon: 'phone', price: 4599900, stock: 6, featured: true, images: 2,
    short: 'Diseño curvo, procesador insignia y 512 GB para todas tus fotos y videos.',
    specs: [['Pantalla', '6,8" OLED curva 144 Hz'], ['Almacenamiento', '512 GB'], ['RAM', '16 GB'], ['Cámara principal', '200 MP'], ['Batería', '4.800 mAh'], ['Red', '5G']],
    highlights: ['Zoom óptico 3x', 'Carga inalámbrica 50 W', 'Video 8K'] }),
  P({ name: 'Pixelia Fold Mini', sku: 'TB-CEL-003', brand: 'Pixelia', category: 'celulares-gama-alta', icon: 'phone', price: 5499900, compareAtPrice: 5999900, stock: 3, images: 2,
    short: 'Plegable compacto con pantalla exterior de 3,4" y bisagra reforzada.',
    specs: [['Pantalla interior', '6,7" plegable 120 Hz'], ['Pantalla exterior', '3,4"'], ['Almacenamiento', '256 GB'], ['RAM', '8 GB'], ['Red', '5G']],
    highlights: ['Formato de bolsillo', 'Bisagra probada 400.000 dobleces'] }),
  // Celulares gama media
  P({ name: 'Nova A55 128 GB', sku: 'TB-CEL-004', brand: 'Nova', category: 'celulares-gama-media', icon: 'phone', price: 1299900, compareAtPrice: 1499900, stock: 32, featured: true, images: 2,
    short: 'El favorito calidad-precio: pantalla 120 Hz, 128 GB y batería para dos días.',
    specs: [['Pantalla', '6,6" AMOLED 120 Hz'], ['Almacenamiento', '128 GB'], ['RAM', '8 GB'], ['Cámara', '50 MP'], ['Batería', '5.000 mAh'], ['Red', '5G']],
    highlights: ['Batería para dos días', 'NFC para pagos'] }),
  P({ name: 'Kairo Lite 4G 64 GB', sku: 'TB-CEL-005', brand: 'Kairo', category: 'celulares-gama-media', icon: 'phone', price: 599900, stock: 45, images: 1,
    short: 'Celular de entrada con pantalla grande, doble SIM y batería de 5.000 mAh.',
    specs: [['Pantalla', '6,5" HD+'], ['Almacenamiento', '64 GB'], ['RAM', '4 GB'], ['Batería', '5.000 mAh'], ['Red', '4G LTE']],
    highlights: ['Ideal para redes sociales y WhatsApp', 'Doble SIM'] }),
  P({ name: 'Zentro M7 256 GB', sku: 'TB-CEL-006', brand: 'Zentro', category: 'celulares-gama-media', icon: 'phone', price: 1649900, stock: 0, images: 1,
    short: 'Cámara de 108 MP, 256 GB y carga turbo de 45 W.',
    specs: [['Pantalla', '6,67" AMOLED'], ['Almacenamiento', '256 GB'], ['RAM', '8 GB'], ['Cámara', '108 MP'], ['Carga', '45 W']],
    highlights: ['Gran capacidad', 'Carga turbo'] }),
  P({ name: 'Lumo S3 128 GB', sku: 'TB-CEL-007', brand: 'Lumo', category: 'celulares-gama-media', icon: 'phone', price: 899900, compareAtPrice: 1049900, stock: 4, images: 1,
    short: 'Diseño delgado, lector de huella en pantalla y 128 GB.',
    specs: [['Pantalla', '6,4" OLED'], ['Almacenamiento', '128 GB'], ['RAM', '6 GB'], ['Batería', '4.500 mAh']],
    highlights: ['Solo 7,8 mm de grosor'] }),
  // Portátiles
  P({ name: 'Andes Tech Book 14 Core i5', sku: 'TB-PC-001', brand: 'Andes Tech', category: 'portatiles', icon: 'laptop', price: 2899900, compareAtPrice: 3199900, stock: 9, featured: true, images: 3,
    short: 'Portátil de 14" con 16 GB de RAM y SSD de 512 GB, liviano y con gran autonomía.',
    specs: [['Procesador', 'Intel Core i5 de 13.ª gen.'], ['RAM', '16 GB DDR5'], ['Almacenamiento', 'SSD 512 GB NVMe'], ['Pantalla', '14" Full HD IPS'], ['Peso', '1,35 kg'], ['Sistema', 'Windows 11 Home']],
    highlights: ['Hasta 12 horas de batería', 'Teclado retroiluminado en español'] }),
  P({ name: 'Volta Creator 16 RTX', sku: 'TB-PC-002', brand: 'Volta', category: 'portatiles', icon: 'laptop', price: 6499900, stock: 4, featured: true, images: 2,
    short: 'Para diseño y gaming: tarjeta gráfica dedicada, pantalla 2.5K a 165 Hz.',
    specs: [['Procesador', 'Ryzen 7'], ['Gráficos', 'RTX 4060 8 GB'], ['RAM', '32 GB'], ['Almacenamiento', 'SSD 1 TB'], ['Pantalla', '16" 2.5K 165 Hz']],
    highlights: ['Calibración de color de fábrica', 'Refrigeración de doble ventilador'] }),
  P({ name: 'Andes Tech Air 13 Ryzen 5', sku: 'TB-PC-003', brand: 'Andes Tech', category: 'portatiles', icon: 'laptop', price: 2299900, stock: 12, images: 2,
    short: 'Ultraliviano de 1,1 kg con chasis de aluminio y carga USB-C.',
    specs: [['Procesador', 'AMD Ryzen 5'], ['RAM', '8 GB'], ['Almacenamiento', 'SSD 512 GB'], ['Pantalla', '13,3" Full HD'], ['Peso', '1,1 kg']],
    highlights: ['Chasis de aluminio', 'Carga por USB-C'] }),
  // Monitores
  P({ name: 'Pixelia View 27" 2K 165 Hz', sku: 'TB-MON-001', brand: 'Pixelia', category: 'monitores', icon: 'monitor', price: 1399900, compareAtPrice: 1599900, stock: 7, images: 2,
    short: 'Monitor IPS 27" QHD con 165 Hz y 1 ms para gaming y productividad.',
    specs: [['Tamaño', '27"'], ['Resolución', '2560 × 1440'], ['Frecuencia', '165 Hz'], ['Panel', 'IPS'], ['Entradas', '2× HDMI, DisplayPort']],
    highlights: ['Compatible con FreeSync', 'Base ajustable en altura'] }),
  P({ name: 'Lumo Office 24" Full HD', sku: 'TB-MON-002', brand: 'Lumo', category: 'monitores', icon: 'monitor', price: 549900, stock: 20, images: 1,
    short: 'Monitor de 24" sin bordes, ideal para oficina y estudio.',
    specs: [['Tamaño', '23,8"'], ['Resolución', '1920 × 1080'], ['Frecuencia', '75 Hz'], ['Panel', 'IPS']],
    highlights: ['Filtro de luz azul', 'Montaje VESA'] }),
  // Audífonos
  P({ name: 'Sonik Wave ANC', sku: 'TB-AUD-001', brand: 'Sonik', category: 'audifonos', icon: 'headphones', price: 699900, compareAtPrice: 849900, stock: 18, featured: true, images: 2,
    short: 'Audífonos de diadema con cancelación activa de ruido y 40 horas de batería.',
    specs: [['Tipo', 'Diadema, Bluetooth 5.3'], ['Cancelación de ruido', 'Activa (ANC)'], ['Batería', 'Hasta 40 h'], ['Carga', 'USB-C, 10 min = 5 h']],
    highlights: ['Modo ambiente', 'Multipunto para dos dispositivos'] }),
  P({ name: 'Sonik Buds Pro', sku: 'TB-AUD-002', brand: 'Sonik', category: 'audifonos', icon: 'earbuds', price: 459900, stock: 25, featured: true, images: 2,
    short: 'Earbuds true wireless con ANC, estuche de carga inalámbrica y resistencia IPX4.',
    specs: [['Tipo', 'True wireless'], ['Cancelación de ruido', 'Activa'], ['Batería', '8 h + 24 h con estuche'], ['Resistencia', 'IPX4']],
    highlights: ['Ajuste ergonómico', 'Carga inalámbrica'] }),
  P({ name: 'Kairo Beat Neo', sku: 'TB-AUD-003', brand: 'Kairo', category: 'audifonos', icon: 'earbuds', price: 149900, compareAtPrice: 189900, stock: 60, images: 1,
    short: 'Earbuds económicos con buen bajo y controles táctiles.',
    specs: [['Tipo', 'True wireless'], ['Batería', '5 h + 20 h'], ['Bluetooth', '5.3']],
    highlights: ['Liviano y cómodo'] }),
  // Parlantes
  P({ name: 'Volta Boom 40 W', sku: 'TB-PAR-001', brand: 'Volta', category: 'parlantes', icon: 'speaker', price: 529900, stock: 11, featured: true, images: 2,
    short: 'Parlante portátil de 40 W, resistente al agua IP67 y luces RGB.',
    specs: [['Potencia', '40 W'], ['Resistencia', 'IP67'], ['Batería', '20 h'], ['Conectividad', 'Bluetooth 5.3, USB-C']],
    highlights: ['Emparejamiento estéreo', 'Ideal para paseos'] }),
  P({ name: 'Sonik Mini Go', sku: 'TB-PAR-002', brand: 'Sonik', category: 'parlantes', icon: 'speaker', price: 189900, stock: 2, images: 1,
    short: 'Parlante compacto de 10 W con correa y 12 horas de música.',
    specs: [['Potencia', '10 W'], ['Batería', '12 h'], ['Resistencia', 'IPX5']],
    highlights: ['Cabe en el bolsillo'] }),
  // Cargadores y cables
  P({ name: 'Volta Cargador GaN 65 W USB-C', sku: 'TB-ACC-001', brand: 'Volta', category: 'cargadores-y-cables', icon: 'charger', price: 159900, compareAtPrice: 199900, stock: 40, featured: true, images: 1,
    short: 'Carga tu portátil, tablet y celular con un solo cargador compacto de 65 W.',
    specs: [['Potencia', '65 W'], ['Puertos', '2× USB-C, 1× USB-A'], ['Tecnología', 'GaN'], ['Protocolos', 'PD 3.0, QC 4+']],
    highlights: ['50 % más pequeño que un cargador tradicional'] }),
  P({ name: 'Zentro Cable USB-C a USB-C 2 m', sku: 'TB-ACC-002', brand: 'Zentro', category: 'cargadores-y-cables', icon: 'charger', price: 39900, stock: 120, images: 1,
    short: 'Cable trenzado de 2 metros con soporte de carga 100 W.',
    specs: [['Longitud', '2 m'], ['Potencia', '100 W'], ['Datos', 'USB 2.0']],
    highlights: ['Recubrimiento trenzado de nailon'] }),
  P({ name: 'Lumo Power Bank 20.000 mAh', sku: 'TB-ACC-003', brand: 'Lumo', category: 'cargadores-y-cables', icon: 'charger', price: 129900, stock: 3, images: 1,
    short: 'Batería externa de 20.000 mAh con carga rápida de 22,5 W y pantalla LED.',
    specs: [['Capacidad', '20.000 mAh'], ['Salida máx.', '22,5 W'], ['Puertos', 'USB-C, 2× USB-A']],
    highlights: ['Carga hasta 4 celulares'] }),
  // Fundas
  P({ name: 'Funda antigolpes Nova X Pro', sku: 'TB-ACC-004', brand: 'Nova', category: 'fundas-y-protectores', icon: 'case', price: 59900, stock: 35, images: 1,
    short: 'Funda transparente con esquinas reforzadas y compatible con carga inalámbrica.',
    specs: [['Compatibilidad', 'Nova X Pro'], ['Material', 'TPU + policarbonato']],
    highlights: ['No se pone amarilla'] }),
  P({ name: 'Vidrio templado 9H universal 6,7"', sku: 'TB-ACC-005', brand: 'Zentro', category: 'fundas-y-protectores', icon: 'case', price: 29900, stock: 0, images: 1,
    short: 'Protector de pantalla de vidrio templado 9H con kit de instalación.',
    specs: [['Dureza', '9H'], ['Tamaño', '6,7"']],
    highlights: ['Incluye kit de instalación'] }),
  // Smartwatches
  P({ name: 'Kairo Watch Fit 2', sku: 'TB-WAT-001', brand: 'Kairo', category: 'smartwatches', icon: 'watch', price: 499900, compareAtPrice: 599900, stock: 16, featured: true, images: 2,
    short: 'Reloj inteligente con GPS, oxímetro y más de 100 modos deportivos.',
    specs: [['Pantalla', '1,6" AMOLED'], ['GPS', 'Integrado'], ['Batería', 'Hasta 10 días'], ['Resistencia', '5 ATM']],
    highlights: ['Monitoreo de sueño', 'Notificaciones de WhatsApp'] }),
  P({ name: 'Nova Band 8', sku: 'TB-WAT-002', brand: 'Nova', category: 'smartwatches', icon: 'watch', price: 189900, stock: 28, images: 1,
    short: 'Banda deportiva liviana con pantalla AMOLED y 14 días de batería.',
    specs: [['Pantalla', '1,47" AMOLED'], ['Batería', '14 días'], ['Resistencia', '5 ATM']],
    highlights: ['Solo 25 g'] }),
  // Gaming
  P({ name: 'Zentro Control Inalámbrico Pro', sku: 'TB-GAM-001', brand: 'Zentro', category: 'gaming', icon: 'gamepad', price: 249900, stock: 13, featured: true, images: 2,
    short: 'Control para PC y celular con gatillos hápticos y 30 horas de batería.',
    specs: [['Conectividad', 'Bluetooth, 2,4 GHz, USB-C'], ['Batería', '30 h'], ['Compatibilidad', 'PC, Android, iOS']],
    highlights: ['Botones traseros programables'] }),
  P({ name: 'Volta Teclado Mecánico TKL RGB', sku: 'TB-GAM-002', brand: 'Volta', category: 'gaming', icon: 'keyboard', price: 289900, compareAtPrice: 329900, stock: 8, images: 1,
    short: 'Teclado mecánico compacto, switches rojos intercambiables y distribución en español.',
    specs: [['Formato', 'TKL (87 teclas)'], ['Switches', 'Rojos, hot-swap'], ['Iluminación', 'RGB por tecla'], ['Distribución', 'Español (LA)']],
    highlights: ['Cable USB-C desmontable'] }),
  P({ name: 'Sonik Diadema Gamer 7.1', sku: 'TB-GAM-003', brand: 'Sonik', category: 'gaming', icon: 'headphones', price: 219900, stock: 1, images: 1,
    short: 'Sonido envolvente 7.1 virtual, micrófono desmontable y almohadillas memory foam.',
    specs: [['Sonido', '7.1 virtual'], ['Micrófono', 'Desmontable con cancelación'], ['Conexión', 'USB y 3,5 mm']],
    highlights: ['Cómoda para largas sesiones'] }),
  // Tablets
  P({ name: 'Pixelia Tab 11 128 GB', sku: 'TB-TAB-001', brand: 'Pixelia', category: 'tablets', icon: 'tablet', price: 1599900, compareAtPrice: 1799900, stock: 10, featured: true, images: 2,
    short: 'Tablet de 11" 2K con cuatro parlantes, ideal para clases y series.',
    specs: [['Pantalla', '11" 2K 90 Hz'], ['Almacenamiento', '128 GB'], ['RAM', '6 GB'], ['Batería', '8.000 mAh']],
    highlights: ['Compatible con lápiz óptico', 'Modo niños'] }),
  P({ name: 'Lumo Tab 8 Kids', sku: 'TB-TAB-002', brand: 'Lumo', category: 'tablets', icon: 'tablet', price: 449900, stock: 15, images: 1,
    short: 'Tablet de 8" con funda resistente y control parental.',
    specs: [['Pantalla', '8" HD'], ['Almacenamiento', '32 GB'], ['RAM', '3 GB']],
    highlights: ['Incluye funda antigolpes'] }),
];

export const DEMO_BANNERS = [
  { title: 'Celulares 5G con hasta 15 % de descuento', text: 'Gama alta y media con garantía oficial y envío a toda Colombia.', linkUrl: '/productos?categoria=celulares', buttonText: 'Ver celulares', colors: ['#0B1E3F', '#1B3A6B'] as [string, string], icon: 'phone' as DemoIcon },
  { title: 'Portátiles para estudiar y trabajar', text: 'Equipos livianos con SSD y hasta 32 GB de RAM.', linkUrl: '/productos?categoria=computadores', buttonText: 'Ver portátiles', colors: ['#071630', '#24476F'] as [string, string], icon: 'laptop' as DemoIcon },
  { title: 'Sonido sin límites', text: 'Audífonos con cancelación de ruido y parlantes resistentes al agua.', linkUrl: '/productos?categoria=audio', buttonText: 'Descubrir audio', colors: ['#0B1E3F', '#2F5A1C'] as [string, string], icon: 'headphones' as DemoIcon },
];
