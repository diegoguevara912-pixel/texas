// Esquema inicial. Compatible con MySQL 8 / MariaDB (Hostinger) y SQLite (desarrollo).
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('email', 190).notNullable().unique();
    t.string('name', 120).notNullable();
    t.string('password_hash', 200).notNullable();
    t.enu('role', ['owner', 'admin', 'sales']).notNullable().defaultTo('sales');
    t.boolean('active').notNullable().defaultTo(true);
    t.integer('failed_logins').notNullable().defaultTo(0);
    t.timestamp('locked_until').nullable();
    t.timestamp('last_login_at').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('sessions', (t) => {
    t.string('id', 64).primary(); // hash SHA-256 del token, nunca el token en claro
    t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    t.string('csrf', 64).notNullable();
    t.string('ip_hash', 64);
    t.string('user_agent', 255);
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id']);
  });

  await knex.schema.createTable('vehicles', (t) => {
    t.increments('id');
    t.string('slug', 160).notNullable().unique();
    t.string('inventory_code', 40).notNullable().unique();
    t.string('brand', 60).notNullable();
    t.string('model', 80).notNullable();
    t.string('version', 120);
    t.integer('year').notNullable();
    t.decimal('price', 14, 2).nullable();
    t.string('currency', 3).notNullable().defaultTo('HNL');
    t.boolean('price_visible').notNullable().defaultTo(true);
    t.integer('mileage').nullable();
    t.enu('mileage_unit', ['km', 'mi']).notNullable().defaultTo('km');
    t.string('transmission', 30);
    t.string('fuel', 30);
    t.string('engine', 80);
    t.string('drivetrain', 30);
    t.string('body_type', 30);
    t.string('color_ext', 60);
    t.string('color_int', 60);
    t.string('condition', 30); // nuevo, usado, certificado por el autolote, etc.
    t.text('features'); // JSON: lista de características destacadas
    t.text('equipment'); // JSON: equipamiento agrupado
    t.text('videos'); // JSON: URLs de video (YouTube/Vimeo/archivo)
    t.string('model3d_url', 500);
    t.text('description');
    t.text('notes_public');
    t.text('notes_internal');
    t.enu('status', ['available', 'reserved', 'sold', 'unpublished']).notNullable().defaultTo('unpublished');
    t.boolean('featured').notNullable().defaultTo(false);
    t.boolean('show_in_history').notNullable().defaultTo(false);
    t.boolean('is_demo').notNullable().defaultTo(false);
    t.boolean('archived').notNullable().defaultTo(false);
    t.timestamp('sold_at').nullable();
    t.timestamps(true, true);
    t.index(['status', 'archived']);
    t.index(['brand']);
    t.index(['year']);
  });

  await knex.schema.createTable('vehicle_media', (t) => {
    t.increments('id');
    t.integer('vehicle_id').unsigned().notNullable().references('vehicles.id').onDelete('CASCADE');
    t.enu('kind', ['image', 'video', 'model3d', 'spin360']).notNullable().defaultTo('image');
    t.string('url', 500).notNullable();
    t.string('alt', 200);
    t.integer('width');
    t.integer('height');
    t.integer('sort').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['vehicle_id', 'sort']);
  });

  await knex.schema.createTable('vehicle_history', (t) => {
    t.increments('id');
    t.integer('vehicle_id').unsigned().notNullable().references('vehicles.id').onDelete('CASCADE');
    t.integer('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL');
    t.string('field', 60).notNullable();
    t.text('old_value');
    t.text('new_value');
    t.boolean('public').notNullable().defaultTo(false); // modificaciones relevantes visibles al público
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['vehicle_id']);
  });

  await knex.schema.createTable('leads', (t) => {
    t.increments('id');
    t.enu('kind', ['info', 'quote', 'visit', 'test_drive', 'reservation', 'inspection', 'service', 'other'])
      .notNullable()
      .defaultTo('info');
    t.string('name', 120).notNullable();
    t.string('phone', 30).notNullable();
    t.string('whatsapp', 30);
    t.string('email', 190);
    t.integer('vehicle_id').unsigned().nullable().references('vehicles.id').onDelete('SET NULL');
    t.text('message');
    t.string('country', 60);
    t.string('region', 80);
    t.string('city', 80);
    t.boolean('consent_privacy').notNullable().defaultTo(false);
    t.boolean('consent_marketing').notNullable().defaultTo(false);
    t.string('privacy_version', 20);
    t.enu('status', ['new', 'contacted', 'qualified', 'won', 'lost', 'archived']).notNullable().defaultTo('new');
    t.string('source', 40);
    t.string('ip_hash', 64);
    t.timestamps(true, true);
    t.index(['status']);
    t.index(['vehicle_id']);
  });

  await knex.schema.createTable('appointments', (t) => {
    t.increments('id');
    t.integer('lead_id').unsigned().nullable().references('leads.id').onDelete('SET NULL');
    t.integer('vehicle_id').unsigned().nullable().references('vehicles.id').onDelete('SET NULL');
    t.enu('type', ['visit', 'test_drive', 'inspection']).notNullable().defaultTo('visit');
    t.string('name', 120).notNullable();
    t.string('phone', 30).notNullable();
    t.date('preferred_date').notNullable();
    t.string('preferred_slot', 20).notNullable(); // mañana / tarde / hora exacta
    t.timestamp('confirmed_for').nullable();
    t.enu('status', ['requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show'])
      .notNullable()
      .defaultTo('requested');
    t.text('message');
    t.timestamps(true, true);
    t.index(['status', 'preferred_date']);
  });

  await knex.schema.createTable('financing_requests', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.enu('contact_method', ['whatsapp', 'phone', 'email']).notNullable();
    t.string('contact_value', 190).notNullable();
    t.integer('vehicle_id').unsigned().nullable().references('vehicles.id').onDelete('SET NULL');
    t.decimal('vehicle_price', 14, 2);
    t.decimal('down_payment', 14, 2);
    t.integer('term_months');
    t.string('currency', 3);
    t.string('preferred_bank', 120);
    t.string('region', 80);
    t.boolean('consent_contact').notNullable().defaultTo(false);
    t.string('privacy_version', 20);
    t.enu('status', ['new', 'in_review', 'sent_to_entity', 'approved_by_entity', 'declined_by_entity', 'withdrawn'])
      .notNullable()
      .defaultTo('new');
    t.string('ip_hash', 64);
    t.timestamps(true, true);
    t.index(['status']);
  });

  // Arquitectura de reservas/pagos. Nunca guarda datos de tarjeta.
  await knex.schema.createTable('reservations', (t) => {
    t.increments('id');
    t.integer('vehicle_id').unsigned().notNullable().references('vehicles.id').onDelete('CASCADE');
    t.integer('lead_id').unsigned().nullable().references('leads.id').onDelete('SET NULL');
    t.decimal('amount', 14, 2).notNullable();
    t.string('currency', 3).notNullable();
    t.enu('method', ['transfer', 'gateway', 'in_person']).notNullable();
    t.enu('payment_status', ['pending', 'proof_received', 'verified', 'refunded', 'cancelled', 'expired'])
      .notNullable()
      .defaultTo('pending');
    t.string('provider', 40);
    t.string('provider_reference', 120); // id del checkout externo o referencia bancaria
    t.boolean('test_mode').notNullable().defaultTo(true);
    t.integer('verified_by').unsigned().nullable().references('users.id').onDelete('SET NULL');
    t.timestamp('verified_at').nullable();
    t.timestamp('expires_at').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('notes', (t) => {
    t.increments('id');
    t.string('entity', 30).notNullable(); // lead | appointment | financing | reservation
    t.integer('entity_id').notNullable();
    t.integer('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL');
    t.text('body').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['entity', 'entity_id']);
  });

  await knex.schema.createTable('faqs', (t) => {
    t.increments('id');
    t.string('question', 255).notNullable();
    t.text('answer').notNullable();
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('published').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('settings', (t) => {
    t.string('key', 60).primary();
    t.text('value').notNullable();
    t.integer('updated_by').unsigned().nullable();
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('audit_log', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().nullable();
    t.string('action', 60).notNullable();
    t.string('entity', 30);
    t.string('entity_id', 40);
    t.text('meta');
    t.string('ip_hash', 64);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['created_at']);
  });
}

export async function down(knex) {
  for (const t of [
    'audit_log', 'settings', 'faqs', 'notes', 'reservations', 'financing_requests',
    'appointments', 'leads', 'vehicle_history', 'vehicle_media', 'vehicles', 'sessions', 'users',
  ]) {
    await knex.schema.dropTableIfExists(t);
  }
}
