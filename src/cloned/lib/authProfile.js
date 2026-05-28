import { supabase } from '@/integrations/supabase/client';

export const getStableDefaultAvatarUrl = (user = {}) => {
  const account = user || {};
  const seed = account.id || account.email || account.user_id || 'pertodemimservicos-user';
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundColor=22c55e,f97316,0ea5e9`;
};

export const normalizeAuthUser = (authUser, profile = {}) => {
  if (!authUser) return null;
  const metadata = authUser.user_metadata || {};
  const displayName = profile.display_name || metadata.display_name || authUser.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile.avatar_url || metadata.avatar_url || getStableDefaultAvatarUrl(authUser);

  return {
    id: authUser.id,
    email: authUser.email,
    name: displayName,
    display_name: displayName,
    role: profile.role || metadata.role || 'migrant',
    avatar_url: avatarUrl,
    avatar: avatarUrl,
    bio: profile.bio || '',
    city: profile.city || metadata.location || '',
    categories: Array.isArray(profile.categories) ? profile.categories : [],
  };
};

export const getOrCreateSvcProfile = async (authUser, fallback = {}) => {
  if (!authUser?.id) return null;

  const metadata = authUser.user_metadata || {};
  const displayName = fallback.display_name || metadata.display_name || authUser.email?.split('@')[0] || 'Usuário';
  const defaultProfile = {
    user_id: authUser.id,
    display_name: displayName,
    role: fallback.role || metadata.role || 'migrant',
    city: fallback.city || metadata.location || '',
    avatar_url: fallback.avatar_url || metadata.avatar_url || getStableDefaultAvatarUrl(authUser),
    categories: Array.isArray(fallback.categories) ? fallback.categories : [],
  };

  const { data: existing, error: selectError } = await supabase
    .from('svc_profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) {
    if (!existing.avatar_url) {
      const { data: updated } = await supabase
        .from('svc_profiles')
        .update({ avatar_url: getStableDefaultAvatarUrl(authUser) })
        .eq('user_id', authUser.id)
        .select('*')
        .maybeSingle();
      return updated || { ...existing, avatar_url: getStableDefaultAvatarUrl(authUser) };
    }
    return existing;
  }

  const { data: rpcProfile, error: rpcError } = await supabase.rpc('get_or_create_own_svc_profile', {
    _display_name: defaultProfile.display_name,
    _avatar_url: defaultProfile.avatar_url,
    _city: defaultProfile.city || null,
    _categories: defaultProfile.categories,
  });

  if (!rpcError && rpcProfile) return rpcProfile;

  const { data: created, error: insertError } = await supabase
    .from('svc_profiles')
    .insert({
      user_id: defaultProfile.user_id,
      display_name: defaultProfile.display_name,
      role: defaultProfile.role,
      city: defaultProfile.city || null,
      avatar_url: defaultProfile.avatar_url,
      categories: defaultProfile.categories,
    })
    .select('*')
    .single();

  if (insertError) {
    console.warn('Could not create svc profile, using session fallback:', insertError);
    return defaultProfile;
  }
  return created;
};

export const updateSvcProfile = async (userId, values) => {
  const { data, error } = await supabase
    .from('svc_profiles')
    .update(values)
    .eq('user_id', userId)
    .limit(1)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};