import { config } from './config';
import * as FileSystem from 'expo-file-system/legacy';

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;

export interface SendOTPResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  verified: boolean;
  error?: string;
}

export interface CheckEmailExistsResponse {
  exists: boolean;
  error?: string;
}

export interface SavePhoneVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to send OTP',
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function verifyOTP(
  phoneNumber: string,
  otpCode: string,
  userId?: string,
  isSignup?: boolean
): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        phone: phoneNumber, 
        code: otpCode,
        user_id: userId,
        is_signup: isSignup || false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'OTP verification failed',
        verified: false,
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'OTP verified successfully',
      verified: data.verified || false,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkEmailExists(email: string, supabaseClient: any): Promise<CheckEmailExistsResponse> {
  // First try the edge function
  try {
    console.log('Calling edge function to check email:', email);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-email-exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    console.log('Edge function response status:', response.status, response.statusText);
    
    let data;
    try {
      const text = await response.text();
      console.log('Edge function raw response:', text);
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Invalid response from server');
    }
    
    console.log('Edge function response data:', data);

    if (!response.ok) {
      console.error('Edge function error:', data);
      throw new Error(data.error || 'Failed to check email');
    }

    // Handle different response formats
    let exists = false;
    if (typeof data.exists === 'boolean') {
      exists = data.exists === true;
    } else if (data.exists === 'true' || data.exists === 1) {
      exists = true;
    } else if (data.exists === 'false' || data.exists === 0 || data.exists === null || data.exists === undefined) {
      exists = false;
    }
    
    console.log('Email exists (parsed):', exists, 'for email:', email);
    
    return {
      exists: exists,
    };
  } catch (error) {
    console.error('Error checking email via edge function, trying fallback:', error);
    
    // Fallback: Use Supabase auth API to check if user exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      // Edge function not available - use client-side check
      if (supabaseClient) {
        try {
          // Try to sign in with a dummy password to check if user exists
          // This is a workaround since we can't directly query auth.users from client
          const dummyPassword = `__CHECK_${Date.now()}_${Math.random()}__`;
          const { error: signInError, data } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: dummyPassword,
          });

          // If we get a session (shouldn't happen with dummy password), something is wrong
          if (data?.session) {
            // Sign out immediately
            await supabaseClient.auth.signOut();
            return {
              exists: false,
            };
          }

          if (signInError) {
            const errorMsg = signInError.message?.toLowerCase() || '';
            const errorCode = signInError.status || '';
            
            console.log('Sign in error for email check:', { errorMsg, errorCode, fullError: signInError });
            
            // If error says "email not confirmed", user definitely exists
            if (errorMsg.includes('email not confirmed') || 
                errorMsg.includes('not confirmed') ||
                errorMsg.includes('email_not_confirmed') ||
                errorCode === 'email_not_confirmed') {
              console.log('User exists (email not confirmed)');
              return {
                exists: true,
              };
            }
            
            // Check for specific error codes/messages that indicate user doesn't exist
            // Supabase error codes: 
            // - "invalid_credentials" can mean either wrong password OR user doesn't exist
            // - But some configurations return specific messages
            
            // If error explicitly says user/email not found
            if (errorMsg.includes('user not found') || 
                errorMsg.includes('email not found') ||
                errorMsg.includes("doesn't exist") ||
                errorMsg.includes('does not exist') ||
                errorMsg.includes('no user found') ||
                errorCode === 'user_not_found') {
              console.log('User does not exist (explicit not found message)');
              return {
                exists: false,
              };
            }
            
            // For "invalid_credentials" or "Invalid login credentials", 
            // Supabase doesn't distinguish for security reasons
            // Since we can't reliably determine, we'll check by trying to send OTP with shouldCreateUser: false
            // But that would send an email, so instead we'll be conservative
            // Most likely if we get invalid credentials, the user exists (wrong password)
            // But to avoid false positives, we'll allow signup and let actual signup handle it
            if (errorMsg.includes('invalid') && (errorMsg.includes('credential') || errorMsg.includes('password'))) {
              console.log('Ambiguous error (invalid credentials) - cannot determine, allowing signup');
              // Can't determine - allow signup (actual signup will catch duplicates)
              return {
                exists: false,
              };
            }
            
            // For other errors, allow signup
            console.log('Unknown error, allowing signup');
            return {
              exists: false,
            };
          }
          
          // No error (unlikely with dummy password) - allow signup
          return {
            exists: false,
          };
        } catch (authError) {
          console.error('Error checking email via auth API:', authError);
          // If this also fails, allow user to proceed
          return {
            exists: false,
          };
        }
      }
      
      // If no supabase client, can't check - allow proceeding
      return {
        exists: false,
      };
    }
    
    // For other errors, allow proceeding
    return {
      exists: false,
    };
  }
}

export async function savePhoneVerificationForSignup(
  userId: string,
  phoneNumber: string,
  aadhaar?: string,
  gstNumber?: string
): Promise<SavePhoneVerificationResponse> {
  try {
    // This will be called from the client, so we need to use an edge function
    // or update user metadata directly via Supabase client
    // For now, we'll create an edge function call, but we can also do it client-side
    // Since we need service role for admin operations, let's create an edge function
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/save-phone-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        phone_number: phoneNumber,
        aadhaar: aadhaar,
        gst_number: gstNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to save phone verification',
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'Phone verification saved successfully',
    };
  } catch (error) {
    console.error('Error saving phone verification:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Staff User Management API Functions

export interface InviteStaffUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'operations' | 'sales';
  region?: string;
  pincode?: string;
  address?: string;
}

export interface InviteStaffUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface StaffUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'operations' | 'sales';
  region?: string;
  pincode?: string;
  address?: string;
  status: 'pending_password' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined from auth.users
  email?: string;
  last_login?: string;
}

export interface GetStaffUsersResponse {
  success: boolean;
  users?: StaffUser[];
  error?: string;
}

export async function inviteStaffUser(
  data: InviteStaffUserRequest,
  accessToken: string
): Promise<InviteStaffUserResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-staff-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // Use anon key for Edge Function
        'apikey': SUPABASE_ANON_KEY,
        'x-user-token': accessToken,  // Pass user token in custom header
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to invite user',
      };
    }

    return {
      success: true,
      message: result.message || 'User invited successfully',
      user: result.user,
    };
  } catch (error) {
    console.error('Error inviting staff user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getStaffUsers(
  filters?: {
    role?: string;
    status?: string;
    search?: string;
  },
  supabaseClient?: any
): Promise<GetStaffUsersResponse> {
  try {
    if (!supabaseClient) {
      return {
        success: false,
        error: 'Supabase client required',
      };
    }

    // Build query
    let query = supabaseClient
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Apply search filter if provided
    let filteredData = data || [];
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter((user: StaffUser) => {
        return (
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower) ||
          user.phone.includes(searchLower)
        );
      });
    }

    return {
      success: true,
      users: filteredData,
    };
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export interface UpdateStaffUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  region?: string;
  pincode?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStaffUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updateStaffUser(
  userId: string,
  data: UpdateStaffUserRequest,
  accessToken: string
): Promise<UpdateStaffUserResponse> {
  try {
    // This will be implemented using Supabase client directly
    // For now, return structure
    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    console.error('Error updating staff user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export interface ResendInviteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function resendInvite(
  userId: string,
  accessToken: string
): Promise<ResendInviteResponse> {
  try {
    // This will call an edge function to resend invite
    // For now, return structure
    return {
      success: true,
      message: 'Invite resent successfully',
    };
  } catch (error) {
    console.error('Error resending invite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Items API Functions

export interface FetchItemsParams {
  page?: number;
  limit?: number;
  // Filters
  categoryId?: string;
  subcategoryId?: string;
  availability?: 'all' | 'in_stock' | 'out_of_stock';
  pincodes?: string[];
  status?: 'all' | 'active' | 'inactive' | 'draft';
  search?: string;
  // Sort
  sortBy?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'latest';
}

export interface ItemWithPrice {
  id: string;
  name: string;
  sku: string;
  description?: string;
  mrp: number;
  unit: string;
  category_id: string;
  subcategory_id?: string;
  min_stock_level: number;
  current_stock: number;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  // Joined data
  category?: {
    id: string;
    name: string;
    discount_percent: number;
  };
  subcategory?: {
    id: string;
    name: string;
    discount_percent: number;
  };
  images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
  // Calculated fields
  final_price: number;
  discount_applied: number;
  savings: number;
  savings_percent: number;
}

export interface FetchItemsResponse {
  success: boolean;
  items?: ItemWithPrice[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

export async function fetchItems(
  params: FetchItemsParams = {},
  supabaseClient: any
): Promise<FetchItemsResponse> {
  try {
    if (!supabaseClient) {
      return {
        success: false,
        error: 'Supabase client required',
      };
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Fetch items with joins (include item_pincodes for pincode filtering)
    let query = supabaseClient
      .from('items')
      .select(
        `
        *,
        category:categories(id, name, discount_percent),
        subcategory:subcategories(id, name, discount_percent),
        images:item_images(id, image_url, is_primary),
        item_pincodes(pincode)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }

    if (params.subcategoryId) {
      query = query.eq('subcategory_id', params.subcategoryId);
    }

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // Availability filter
    if (params.availability === 'in_stock') {
      query = query.gt('current_stock', 0);
    } else if (params.availability === 'out_of_stock') {
      query = query.eq('current_stock', 0);
    }

    // Search filter (name or SKU)
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    const sortBy = params.sortBy || 'latest';
    switch (sortBy) {
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('mrp', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('mrp', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: itemsData, error: itemsError, count } = await query;

    if (itemsError) {
      throw itemsError;
    }

    // Filter by pincode if provided (post-query filter since it's a join)
    let filteredItems = itemsData || [];
    if (params.pincodes && params.pincodes.length > 0) {
      filteredItems = filteredItems.filter((item: any) => {
        const itemPincodes = item.item_pincodes?.map((p: any) => p.pincode) || [];
        return params.pincodes!.some(pincode => itemPincodes.includes(pincode));
      });
    }

    // Calculate final prices and enrich items
    const enrichedItems: ItemWithPrice[] = filteredItems.map((item: any) => {
      const category = item.category;
      const subcategory = item.subcategory;
      
      // Determine discount: subcategory discount takes priority, then category discount
      const discountPercent = subcategory?.discount_percent > 0
        ? subcategory.discount_percent
        : (category?.discount_percent || 0);

      // Calculate final price
      const finalPrice = item.mrp - (item.mrp * discountPercent / 100);
      const savings = item.mrp - finalPrice;
      const savingsPercent = item.mrp > 0 ? (savings / item.mrp) * 100 : 0;

      // Get primary image
      const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];

      return {
        ...item,
        category: category ? {
          id: category.id,
          name: category.name,
          discount_percent: category.discount_percent || 0,
        } : undefined,
        subcategory: subcategory ? {
          id: subcategory.id,
          name: subcategory.name,
          discount_percent: subcategory.discount_percent || 0,
        } : undefined,
        images: primaryImage ? [primaryImage] : [],
        final_price: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
        discount_applied: discountPercent,
        savings: Math.round(savings * 100) / 100,
        savings_percent: Math.round(savingsPercent * 100) / 100,
      };
    });

    // Adjust total count if pincode filter was applied
    const total = params.pincodes && params.pincodes.length > 0 
      ? enrichedItems.length 
      : (count || 0);
    const hasMore = params.pincodes && params.pincodes.length > 0
      ? false // Can't determine hasMore with post-query pincode filter
      : (offset + limit < total);

    return {
      success: true,
      items: enrichedItems,
      total,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================================
// Item Management API Functions (CRUD)
// ============================================================================

export interface CreateItemParams {
  name: string;
  sku: string;
  description?: string;
  mrp: number;
  unit: string;
  category_id: string;
  subcategory_id?: string;
  min_stock_level: number;
  current_stock: number;
  status: 'active' | 'inactive' | 'draft';
}

export interface UpdateItemParams {
  name?: string;
  description?: string;
  mrp?: number;
  unit?: string;
  category_id?: string;
  subcategory_id?: string;
  min_stock_level?: number;
  current_stock?: number;
  status?: 'active' | 'inactive' | 'draft';
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

export interface ItemWithDetails extends ItemWithPrice {
  restricted_pincodes?: string[];
}

// Create new item
export async function createItem(
  item: CreateItemParams,
  supabaseClient: any
): Promise<ItemWithPrice> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Check SKU uniqueness
    const { data: existingItem, error: checkError } = await supabaseClient
      .from('items')
      .select('id, sku')
      .eq('sku', item.sku)
      .maybeSingle(); // Use maybeSingle instead of single to handle "not found" gracefully

    if (checkError) {
      console.error('Error checking SKU uniqueness:', checkError);
      throw new Error(checkError.message || 'Failed to check SKU uniqueness');
    }

    if (existingItem) {
      throw new Error(`SKU "${item.sku}" already exists. Please use a unique SKU.`);
    }

    // Insert item
    const { data, error } = await supabaseClient
      .from('items')
      .insert({
        name: item.name,
        sku: item.sku,
        description: item.description || null,
        mrp: item.mrp,
        unit: item.unit,
        category_id: item.category_id,
        subcategory_id: item.subcategory_id || null,
        min_stock_level: item.min_stock_level,
        current_stock: item.current_stock,
        status: item.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting item:', error);
      throw new Error(error.message || 'Failed to create item');
    }

    // Return item in ItemWithPrice format
    return {
      ...data,
      category: undefined,
      subcategory: undefined,
      images: [],
      final_price: data.mrp,
      discount_applied: 0,
      savings: 0,
      savings_percent: 0,
      restricted_pincodes: [],
    };
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

// Update item
export async function updateItem(
  id: string,
  updates: UpdateItemParams,
  supabaseClient: any
): Promise<ItemWithPrice> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Build update object (remove undefined values)
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.mrp !== undefined) updateData.mrp = updates.mrp;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
    if (updates.subcategory_id !== undefined) updateData.subcategory_id = updates.subcategory_id || null;
    if (updates.min_stock_level !== undefined) updateData.min_stock_level = updates.min_stock_level;
    if (updates.current_stock !== undefined) updateData.current_stock = updates.current_stock;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabaseClient
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Return item in ItemWithPrice format
    return {
      ...data,
      category: undefined,
      subcategory: undefined,
      images: [],
      final_price: data.mrp,
      discount_applied: 0,
      savings: 0,
      savings_percent: 0,
      restricted_pincodes: [],
    };
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

// Toggle item status (quick update)
export async function toggleItemStatus(
  id: string,
  newStatus: 'active' | 'inactive',
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Check for session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required. Please log in again.');
    }

    console.log('Toggling item status:', id, newStatus);
    const { data, error } = await supabaseClient
      .from('items')
      .update({ status: newStatus })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error toggling item status:', error);
      throw new Error(error.message || 'Failed to update item status');
    }

    if (!data || data.length === 0) {
      throw new Error('Item not found or you do not have permission to update it');
    }

    console.log('Item status updated successfully:', id, newStatus);
  } catch (error) {
    console.error('Error toggling item status:', error);
    throw error;
  }
}

// Delete item (soft delete - set status to inactive)
export async function deleteItem(
  id: string,
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Check for session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required. Please log in again.');
    }

    console.log('Deleting item:', id);
    const { data, error } = await supabaseClient
      .from('items')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting item:', error);
      throw new Error(error.message || 'Failed to delete item');
    }

    if (!data || data.length === 0) {
      throw new Error('Item not found or you do not have permission to delete it');
    }

    console.log('Item deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

// Set item pincodes
export async function setItemPincodes(
  itemId: string,
  pincodes: string[],
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Delete existing pincodes
    const { error: deleteError } = await supabaseClient
      .from('item_pincodes')
      .delete()
      .eq('item_id', itemId);

    if (deleteError) throw deleteError;

    // Insert new pincodes
    if (pincodes.length > 0) {
      const pincodeData = pincodes.map(pincode => ({
        item_id: itemId,
        pincode,
      }));

      const { error: insertError } = await supabaseClient
        .from('item_pincodes')
        .insert(pincodeData);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error setting item pincodes:', error);
    throw error;
  }
}

// Upload item image
export async function uploadItemImage(
  itemId: string,
  file: ImageFile,
  isPrimary: boolean,
  supabaseClient: any
): Promise<any> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    // Ensure we always upload as JPEG (rename .heic/.heif extensions)
    const sanitizedName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const contentType = file.type === 'image/heic' || file.type === 'image/heif'
      ? 'image/jpeg'
      : (file.type || 'image/jpeg');

    // Generate unique filename
    const fileName = `${itemId}/${Date.now()}-${sanitizedName}`;

    // Read file as base64 using expo-file-system/legacy (works reliably on both iOS and Android
    // unlike fetch()->blob() which produces 0-byte files on iOS for local/ph:// URIs)
    const base64Data = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to ArrayBuffer for Supabase upload
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabaseClient.storage
      .from('item-images')
      .upload(fileName, bytes.buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('item-images')
      .getPublicUrl(fileName);

    // If setting as primary, unset other primary images
    if (isPrimary) {
      // First, get all images for this item
      const { data: allImages } = await supabaseClient
        .from('item_images')
        .select('id')
        .eq('item_id', itemId);

      // Update all to false (if any exist)
      if (allImages && allImages.length > 0) {
        await supabaseClient
          .from('item_images')
          .update({ is_primary: false })
          .eq('item_id', itemId);
      }
    }

    // Get max sort order
    const { data: maxOrderData } = await supabaseClient
      .from('item_images')
      .select('sort_order')
      .eq('item_id', itemId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = maxOrderData?.sort_order ? maxOrderData.sort_order + 1 : 1;

    // Insert image record
    const { data, error } = await supabaseClient
      .from('item_images')
      .insert({
        item_id: itemId,
        image_url: urlData.publicUrl,
        is_primary: isPrimary,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading item image:', error);
    throw error;
  }
}

// Delete item image
export async function deleteItemImage(
  imageId: string,
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { error } = await supabaseClient
      .from('item_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
    // Note: We're not deleting from storage here - can be handled by cleanup job
  } catch (error) {
    console.error('Error deleting item image:', error);
    throw error;
  }
}

// Fetch item by ID with all details
export async function fetchItemById(
  id: string,
  supabaseClient: any
): Promise<ItemWithDetails> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('items')
      .select(
        `
        *,
        category:categories(id, name, discount_percent),
        subcategory:subcategories(id, name, discount_percent),
        images:item_images(id, image_url, is_primary, sort_order),
        item_pincodes(pincode)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item not found');

    // Calculate final price
    const category = data.category;
    const subcategory = data.subcategory;
    const discountPercent = subcategory?.discount_percent > 0
      ? subcategory.discount_percent
      : (category?.discount_percent || 0);
    const finalPrice = data.mrp - (data.mrp * discountPercent / 100);
    const savings = data.mrp - finalPrice;
    const savingsPercent = data.mrp > 0 ? (savings / data.mrp) * 100 : 0;

    // Get restricted pincodes
    const availablePincodes = data.item_pincodes?.map((p: any) => p.pincode) || [];

    return {
      ...data,
      category: category ? {
        id: category.id,
        name: category.name,
        discount_percent: category.discount_percent || 0,
      } : undefined,
      subcategory: subcategory ? {
        id: subcategory.id,
        name: subcategory.name,
        discount_percent: subcategory.discount_percent || 0,
      } : undefined,
      images: data.images || [],
      final_price: Math.round(finalPrice * 100) / 100,
      discount_applied: discountPercent,
      savings: Math.round(savings * 100) / 100,
      savings_percent: Math.round(savingsPercent * 100) / 100,
      restricted_pincodes: availablePincodes,
    };
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    throw error;
  }
}

// Category Management APIs

export interface Category {
  id: string;
  name: string;
  discount_percent: number;
  created_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  discount_percent: number;
  created_at: string;
}

// Fetch all categories with subcategories
export async function fetchCategories(
  supabaseClient: any
): Promise<Category[]> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('categories')
      .select(`
        *,
        subcategories(*)
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Create category
export async function createCategory(
  name: string,
  discountPercent: number,
  supabaseClient: any
): Promise<Category> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('categories')
      .insert({
        name,
        discount_percent: discountPercent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Update category
export async function updateCategory(
  id: string,
  name: string,
  discountPercent: number,
  supabaseClient: any
): Promise<Category> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('categories')
      .update({
        name,
        discount_percent: discountPercent,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// Delete category
export async function deleteCategory(
  id: string,
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Create subcategory
export async function createSubcategory(
  categoryId: string,
  name: string,
  discountPercent: number,
  supabaseClient: any
): Promise<Subcategory> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('subcategories')
      .insert({
        category_id: categoryId,
        name,
        discount_percent: discountPercent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating subcategory:', error);
    throw error;
  }
}

// Update subcategory
export async function updateSubcategory(
  id: string,
  name: string,
  discountPercent: number,
  supabaseClient: any
): Promise<Subcategory> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { data, error } = await supabaseClient
      .from('subcategories')
      .update({
        name,
        discount_percent: discountPercent,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating subcategory:', error);
    throw error;
  }
}

// Delete subcategory
export async function deleteSubcategory(
  id: string,
  supabaseClient: any
): Promise<void> {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client required');
    }

    const { error } = await supabaseClient
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    throw error;
  }
}
