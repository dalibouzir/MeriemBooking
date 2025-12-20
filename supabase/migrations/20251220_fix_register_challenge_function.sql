-- Fix the "status is ambiguous" error by qualifying all table column references
-- Also adds concurrency protection with unique index and ON CONFLICT

-- 1) Create unique index on email to prevent duplicate registrations under concurrency
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_registrations_email_unique 
ON challenge_registrations(email);

-- 2) Create or replace the registration function with fixed column references
CREATE OR REPLACE FUNCTION register_for_challenge(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, registration_id UUID, remaining INT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity INT;
  v_confirmed_count INT;
  v_remaining INT;
  v_existing_id UUID;
  v_existing_status TEXT;
  v_new_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- Normalize email
  v_normalized_email := LOWER(TRIM(p_email));
  
  -- Get capacity from settings
  SELECT cs.capacity INTO v_capacity
  FROM challenge_settings cs
  LIMIT 1;
  
  IF v_capacity IS NULL THEN
    v_capacity := 100; -- Default capacity
  END IF;
  
  -- Check if already registered (qualify with table alias to avoid ambiguity)
  SELECT cr.id, cr.status INTO v_existing_id, v_existing_status
  FROM challenge_registrations cr
  WHERE cr.email = v_normalized_email;
  
  IF v_existing_id IS NOT NULL THEN
    -- Calculate remaining seats
    SELECT COUNT(*) INTO v_confirmed_count
    FROM challenge_registrations cr
    WHERE cr.status = 'confirmed';
    
    v_remaining := GREATEST(0, v_capacity - v_confirmed_count);
    
    -- Return appropriate status based on existing registration
    IF v_existing_status = 'confirmed' THEN
      RETURN QUERY SELECT 'already_registered'::TEXT, v_existing_id, v_remaining;
    ELSE
      RETURN QUERY SELECT 'already_waitlisted'::TEXT, v_existing_id, v_remaining;
    END IF;
    RETURN;
  END IF;
  
  -- Count current confirmed registrations
  SELECT COUNT(*) INTO v_confirmed_count
  FROM challenge_registrations cr
  WHERE cr.status = 'confirmed';
  
  v_remaining := GREATEST(0, v_capacity - v_confirmed_count);
  
  -- Determine if we should add to waitlist or confirm
  IF v_confirmed_count >= v_capacity THEN
    -- Capacity full - add to waitlist with ON CONFLICT for race condition protection
    INSERT INTO challenge_registrations (name, email, phone, status)
    VALUES (p_name, v_normalized_email, p_phone, 'waitlist')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_new_id;
    
    RETURN QUERY SELECT 'full'::TEXT, v_new_id, 0;
  ELSE
    -- Capacity available - confirm registration with ON CONFLICT
    INSERT INTO challenge_registrations (name, email, phone, status)
    VALUES (p_name, v_normalized_email, p_phone, 'confirmed')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_new_id;
    
    -- Recalculate remaining after insert
    v_remaining := GREATEST(0, v_capacity - v_confirmed_count - 1);
    
    RETURN QUERY SELECT 'success'::TEXT, v_new_id, v_remaining;
  END IF;
END;
$$;
