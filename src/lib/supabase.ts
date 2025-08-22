// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ВСТАВЬ СВОИ ЗНАЧЕНИЯ из Supabase → Settings → API
const SUPABASE_URL = 'https://injzfrduauoxmytfqkbl.supabase.co';     // ← твой Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluanpmcmR1YXVveG15dGZxa2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODc0NTUsImV4cCI6MjA3MTQ2MzQ1NX0.D0dVdgp8dCzuJbYGAQh-P8tJy5D-6LsMCR794b265f0'; // ← anon public key

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase creds are missing');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
