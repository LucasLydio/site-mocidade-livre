const { supabase } = require('../config/supabase');

async function getUsers({ from, to, name, email, role }) {
  let query = supabase
    .from('users')
    .select('id, name, email, telephone, role, is_active, created_at, updated_at', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (name) {
    query = query.ilike('name', `%${name}%`);
  }

  if (email) {
    query = query.ilike('email', `%${email}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data,
    count: count || 0
  };
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, telephone, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;

  return data;
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
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

async function updateUser(id, payload) {
  const updateData = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.telephone !== undefined) updateData.telephone = payload.telephone;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.passwordHash !== undefined) updateData.password_hash = payload.passwordHash;
  if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, name, email, telephone, role, is_active, created_at, updated_at')
    .single();

  if (error) throw error;

  return data;
}

async function deleteUser(id) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .select('id, name, email, telephone, role, is_active, created_at, updated_at')
    .single();

  if (error) throw error;

  return data;
}

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
};
