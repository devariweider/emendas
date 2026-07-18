import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const configurado = Boolean(supabaseUrl && supabaseKey);

if (!configurado) {
  console.warn('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = configurado
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigurado = () => configurado;
