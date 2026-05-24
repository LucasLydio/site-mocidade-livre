const { supabase } = require('../config/supabase');

async function getUserByEmailWithPassword(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, telephone, role, password_hash, is_active, created_at, updated_at')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

async function createUser({ name, email, telephone, passwordHash, role }) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        name,
        email,
        telephone: telephone || null,
        password_hash: passwordHash,
        role
      }
    ])
    .select('id, name, email, telephone, role, is_active, created_at, updated_at')
    .single();

  if (error) throw error;

  return data;
}

module.exports = {
  getUserByEmailWithPassword,
  createUser
};
