const { Pool } = require('pg');

if (!process.env.DIRECT_URL) {
  console.error('❌ DIRECT_URL is required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database. Running migration...\n');

    // Create time_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        hours DECIMAL(4, 2) NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        task_id UUID,
        project_id UUID,
        status VARCHAR(20) DEFAULT 'pending',
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        approved_at TIMESTAMPTZ,
        approved_by UUID REFERENCES users(id),
        rejected_at TIMESTAMPTZ,
        rejected_by UUID REFERENCES users(id),
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);
    console.log('✅ Created time_entries table');

    // Create indexes for time_entries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);`);
    console.log('✅ Created indexes for time_entries');

    // Create attendance_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        date DATE NOT NULL,
        check_in_time TIMESTAMPTZ,
        check_out_time TIMESTAMPTZ,
        check_in_lat DECIMAL(10, 8),
        check_in_lng DECIMAL(11, 8),
        check_out_lat DECIMAL(10, 8),
        check_out_lng DECIMAL(11, 8),
        total_hours DECIMAL(4, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'absent',
        is_late BOOLEAN DEFAULT FALSE,
        late_by_minutes INTEGER DEFAULT 0,
        is_manual BOOLEAN DEFAULT FALSE,
        manual_entry_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(user_id, date)
      );
    `);
    console.log('✅ Created attendance_records table');

    // Create indexes for attendance_records
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);`);
    console.log('✅ Created indexes for attendance_records');

    // Create work_schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
        work_start_time TIME DEFAULT '09:00:00',
        work_end_time TIME DEFAULT '18:00:00',
        late_threshold_minutes INTEGER DEFAULT 0,
        lunch_break_minutes INTEGER DEFAULT 60,
        work_days VARCHAR(20) DEFAULT '1,2,3,4,5',
        effective_from DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      );
    `);
    console.log('✅ Created work_schedules table');

    // Create organization_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        default_work_start_time TIME DEFAULT '09:00:00',
        default_work_end_time TIME DEFAULT '18:00:00',
        default_late_threshold_minutes INTEGER DEFAULT 0,
        min_entry_minutes INTEGER DEFAULT 15,
        max_hours_per_day DECIMAL(3, 1) DEFAULT 12.0,
        require_description BOOLEAN DEFAULT TRUE,
        min_description_length INTEGER DEFAULT 10,
        auto_approve BOOLEAN DEFAULT FALSE,
        approval_required BOOLEAN DEFAULT TRUE,
        require_geolocation BOOLEAN DEFAULT FALSE,
        office_lat DECIMAL(10, 8),
        office_lng DECIMAL(11, 8),
        allowed_radius_meters INTEGER DEFAULT 500,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by UUID REFERENCES users(id)
      );
    `);
    console.log('✅ Created organization_settings table');

    // Insert default settings if not exists
    await client.query(`
      INSERT INTO organization_settings (id) 
      SELECT gen_random_uuid() 
      WHERE NOT EXISTS (SELECT 1 FROM organization_settings);
    `);
    console.log('✅ Inserted default organization settings');

    // Create auto-calculate hours function
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_calculate_hours()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.hours := ROUND((EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600)::NUMERIC, 2);
        NEW.updated_at := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created auto_calculate_hours function');

    // Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS time_entries_calculate_hours ON time_entries;
      CREATE TRIGGER time_entries_calculate_hours
        BEFORE INSERT OR UPDATE ON time_entries
        FOR EACH ROW
        EXECUTE FUNCTION auto_calculate_hours();
    `);
    console.log('✅ Created trigger for auto-calculating hours');

    // Enable RLS
    await client.query(`ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ Enabled Row Level Security');

    // Create policies for time_entries
    await client.query(`
      CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT
        USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr')));
    `);
    await client.query(`
      CREATE POLICY "Users can create own time entries" ON time_entries FOR INSERT
        WITH CHECK (user_id = auth.uid());
    `);
    await client.query(`
      CREATE POLICY "Users can update own pending entries" ON time_entries FOR UPDATE
        USING (user_id = auth.uid() AND status = 'pending');
    `);
    await client.query(`
      CREATE POLICY "Admins can manage all entries" ON time_entries FOR ALL
        USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr')));
    `);
    console.log('✅ Created policies for time_entries');

    // Create policies for attendance_records
    await client.query(`
      CREATE POLICY "Users can view own attendance" ON attendance_records FOR SELECT
        USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr', 'team_lead')));
    `);
    await client.query(`
      CREATE POLICY "Users can create own attendance" ON attendance_records FOR INSERT
        WITH CHECK (user_id = auth.uid());
    `);
    await client.query(`
      CREATE POLICY "Users can update own attendance" ON attendance_records FOR UPDATE
        USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr')));
    `);
    console.log('✅ Created policies for attendance_records');

    // Create policies for work_schedules
    await client.query(`
      CREATE POLICY "All authenticated users can view work schedules" ON work_schedules FOR SELECT
        USING (auth.uid() IS NOT NULL);
    `);
    await client.query(`
      CREATE POLICY "Only admins can manage work schedules" ON work_schedules FOR ALL
        USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr')));
    `);
    console.log('✅ Created policies for work_schedules');

    // Create policies for organization_settings
    await client.query(`
      CREATE POLICY "All authenticated users can view org settings" ON organization_settings FOR SELECT
        USING (auth.uid() IS NOT NULL);
    `);
    await client.query(`
      CREATE POLICY "Only admins can update org settings" ON organization_settings FOR UPDATE
        USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hr')));
    `);
    console.log('✅ Created policies for organization_settings');

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});