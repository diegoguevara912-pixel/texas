// Datos FICTICIOS solo para vista previa y pruebas. Marcas inventadas, precios de ejemplo,
// cada vehículo queda marcado is_demo=1 y la interfaz lo rotula como demostración.
// Para quitarlos: npm run seed:demo -- --remove
import { db, toJson } from './index.js';
import { migrate } from './migrate.js';
import { slugify } from '../lib/vehicles.js';

await migrate(db);

if (process.argv.includes('--remove')) {
  const n = await db('vehicles').where({ is_demo: true }).del();
  console.log(`Vehículos de demostración eliminados: ${n}`);
  await db.destroy();
  process.exit(0);
}

const demo = [
  { brand: 'Aurel', model: 'Meridian', version: 'GT Línea Noir', year: 2024, price: 1890000, mileage: 8200, transmission: 'Automática', fuel: 'Gasolina', engine: '2.0 L turbo', drivetrain: 'AWD', body_type: 'SUV', color_ext: 'Negro obsidiana', color_int: 'Cuero coñac', condition: 'Usado', featured: true, status: 'available', accent: '#1b1b1d' },
  { brand: 'Nordvik', model: 'Halden', version: 'Touring', year: 2023, price: 1245000, mileage: 21400, transmission: 'Automática', fuel: 'Híbrido', engine: '2.5 L híbrido', drivetrain: 'FWD', body_type: 'Sedán', color_ext: 'Gris titanio', color_int: 'Negro', condition: 'Usado', featured: true, status: 'available', accent: '#6d7075' },
  { brand: 'Kaito', model: 'Ridge', version: 'Doble cabina 4x4', year: 2022, price: 985000, mileage: 46800, transmission: 'Manual', fuel: 'Diésel', engine: '2.8 L turbodiésel', drivetrain: '4x4', body_type: 'Pick-up', color_ext: 'Blanco perla', color_int: 'Gris', condition: 'Usado', featured: true, status: 'reserved', accent: '#e9e6df' },
  { brand: 'Vantor', model: 'Lumen', version: 'Sport', year: 2021, price: 612000, mileage: 58300, transmission: 'Automática', fuel: 'Gasolina', engine: '1.6 L', drivetrain: 'FWD', body_type: 'Hatchback', color_ext: 'Rojo granate', color_int: 'Negro', condition: 'Usado', featured: false, status: 'available', accent: '#5a1620' },
  { brand: 'Solenne', model: 'Coupé S', version: 'Edición Atelier', year: 2024, price: 2650000, mileage: 3100, transmission: 'Automática', fuel: 'Gasolina', engine: '3.0 L V6', drivetrain: 'RWD', body_type: 'Coupé', color_ext: 'Champán metálico', color_int: 'Marfil', condition: 'Usado', featured: true, status: 'available', accent: '#b49a6a' },
  { brand: 'Nordvik', model: 'Fjell', version: 'Familiar 7 plazas', year: 2020, price: 735000, mileage: 72900, transmission: 'Automática', fuel: 'Gasolina', engine: '2.4 L', drivetrain: 'AWD', body_type: 'SUV', color_ext: 'Azul profundo', color_int: 'Beige', condition: 'Usado', featured: false, status: 'available', accent: '#1d2a3f' },
  { brand: 'Kaito', model: 'Breeze', version: 'EX', year: 2019, price: 398000, mileage: 88100, transmission: 'Automática', fuel: 'Gasolina', engine: '1.5 L', drivetrain: 'FWD', body_type: 'Sedán', color_ext: 'Plata', color_int: 'Negro', condition: 'Usado', featured: false, status: 'sold', show_in_history: true, accent: '#b9bcc0' },
];

let i = 0;
for (const d of demo) {
  i += 1;
  const code = `DEMO-${String(i).padStart(3, '0')}`;
  if (await db('vehicles').where({ inventory_code: code }).first()) continue;
  const { accent, ...v } = d;
  await db('vehicles').insert({
    ...v,
    slug: slugify(`${v.brand} ${v.model} ${v.version} ${v.year} ${code}`),
    inventory_code: code,
    currency: 'HNL',
    price_visible: true,
    mileage_unit: 'km',
    features: toJson(['Cámara de reversa', 'Pantalla multimedia', 'Control crucero', 'Sensores de estacionamiento']),
    equipment: toJson([
      { group: 'Seguridad', items: ['Frenos ABS', 'Bolsas de aire frontales y laterales', 'Control de estabilidad'] },
      { group: 'Confort', items: ['Climatizador', 'Asientos con ajuste eléctrico', 'Arranque sin llave'] },
    ]),
    videos: toJson([]),
    description: 'Vehículo de demostración con datos ficticios para revisar el diseño de la plataforma. No corresponde a una unidad real.',
    notes_public: accent, // color de la silueta ilustrativa en la vista previa
    is_demo: true,
    sold_at: v.status === 'sold' ? new Date() : null,
  });
}

if (!(await db('faqs').first())) {
  await db('faqs').insert([
    { sort: 1, published: true, question: '¿La simulación de cuota es una aprobación de crédito?', answer: 'No. Es un cálculo orientativo. La aprobación, la tasa y las condiciones las define la entidad financiera que evalúe su solicitud.' },
    { sort: 2, published: true, question: '¿Debo indicar mi ubicación para hacer una consulta?', answer: 'No. La ubicación es opcional y solo nos ayuda a orientarle mejor. Nunca solicitamos ubicación GPS.' },
    { sort: 3, published: true, question: '¿Qué datos piden en la solicitud de financiamiento?', answer: 'Solo datos de contacto y del vehículo de interés. Nunca solicitamos contraseñas, números de tarjeta ni credenciales bancarias por este sitio.' },
    { sort: 4, question: '¿Las fotografías corresponden al vehículo publicado?', answer: 'PENDIENTE: el autolote debe confirmar su política de fotografías. Recomendado: publicar solo fotografías reales de cada unidad.', published: false },
  ]);
}

console.log('Datos de demostración listos (marcados como DEMO).');
await db.destroy();
