import { supabase } from './supabase';
import {
  Retailer,
  RetailerWithEmail,
  RetailerDocument,
  RetailerFilters,
  RetailerStatus,
} from '../types/database';

// ── List retailers with email (via RPC) ──────────────────────────
export async function fetchRetailers(
  filters: RetailerFilters = {},
  limit = 50,
  offset = 0
): Promise<{ data: RetailerWithEmail[]; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_retailers_with_email', {
      p_status: filters.status || null,
      p_search: filters.search || null,
      p_pincode: filters.pincode || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error fetching retailers:', error);
      return { data: [], error: error.message };
    }

    return { data: (data as RetailerWithEmail[]) || [], error: null };
  } catch (err) {
    console.error('Exception fetching retailers:', err);
    return { data: [], error: 'Failed to fetch retailers' };
  }
}

// ── Get single retailer by ID with email ─────────────────────────
export async function fetchRetailerById(
  retailerId: string
): Promise<{ data: RetailerWithEmail | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_retailer_by_id_with_email', {
      p_retailer_id: retailerId,
    });

    if (error) {
      console.error('Error fetching retailer:', error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null, error: 'Retailer not found' };
    }

    // RPC returns array, take first
    const retailer = data[0] as RetailerWithEmail;

    // Fetch documents for this retailer
    const { data: docs } = await supabase
      .from('retailer_documents')
      .select('*')
      .eq('retailer_id', retailerId)
      .order('uploaded_at', { ascending: false });

    retailer.documents = (docs as RetailerDocument[]) || [];

    return { data: retailer, error: null };
  } catch (err) {
    console.error('Exception fetching retailer:', err);
    return { data: null, error: 'Failed to fetch retailer' };
  }
}

// ── Update retailer fields ───────────────────────────────────────
export async function updateRetailer(
  retailerId: string,
  updates: Partial<Retailer>
): Promise<{ error: string | null }> {
  try {
    // Remove fields that shouldn't be updated directly
    const { id, user_id, retailer_code, created_at, created_by, ...safeUpdates } = updates as any;

    const { error } = await supabase
      .from('retailers')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', retailerId);

    if (error) {
      console.error('Error updating retailer:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception updating retailer:', err);
    return { error: 'Failed to update retailer' };
  }
}

// ── Approve retailer ─────────────────────────────────────────────
export async function approveRetailer(
  retailerId: string,
  approvedBy: string,
  creditLimit?: number
): Promise<{ error: string | null }> {
  try {
    const updateData: Record<string, unknown> = {
      status: 'approved' as RetailerStatus,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    };

    if (creditLimit !== undefined && creditLimit !== null) {
      updateData.credit_limit = creditLimit;
    }

    const { error } = await supabase
      .from('retailers')
      .update(updateData)
      .eq('id', retailerId);

    if (error) {
      console.error('Error approving retailer:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception approving retailer:', err);
    return { error: 'Failed to approve retailer' };
  }
}

// ── Reject retailer ──────────────────────────────────────────────
export async function rejectRetailer(
  retailerId: string,
  rejectedBy: string,
  reason: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('retailers')
      .update({
        status: 'rejected' as RetailerStatus,
        rejection_reason: reason,
        approved_by: rejectedBy, // reusing field for who took action
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', retailerId);

    if (error) {
      console.error('Error rejecting retailer:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception rejecting retailer:', err);
    return { error: 'Failed to reject retailer' };
  }
}

// ── Fetch documents for a retailer ───────────────────────────────
export async function fetchRetailerDocuments(
  retailerId: string
): Promise<{ data: RetailerDocument[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('retailer_documents')
      .select('*')
      .eq('retailer_id', retailerId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return { data: [], error: error.message };
    }

    return { data: (data as RetailerDocument[]) || [], error: null };
  } catch (err) {
    console.error('Exception fetching documents:', err);
    return { data: [], error: 'Failed to fetch documents' };
  }
}

// ── Upload a document to storage + create record ─────────────────
export async function uploadRetailerDocument(
  retailerId: string,
  file: {
    uri: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
  },
  documentType: 'pan' | 'gst' | 'other',
  uploadedBy: string
): Promise<{ data: RetailerDocument | null; error: string | null }> {
  try {
    const timestamp = Date.now();
    const ext = file.fileName.split('.').pop() || 'file';
    const storagePath = `${retailerId}/${documentType}_${timestamp}.${ext}`;

    // Upload file to Supabase Storage
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('retailer-documents')
      .upload(storagePath, blob, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { data: null, error: uploadError.message };
    }

    // Create document record
    const { data: docRecord, error: insertError } = await supabase
      .from('retailer_documents')
      .insert({
        retailer_id: retailerId,
        document_type: documentType,
        file_name: file.fileName,
        file_url: storagePath,
        file_size: file.fileSize || null,
        mime_type: file.mimeType,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating document record:', insertError);
      return { data: null, error: insertError.message };
    }

    return { data: docRecord as RetailerDocument, error: null };
  } catch (err) {
    console.error('Exception uploading document:', err);
    return { data: null, error: 'Failed to upload document' };
  }
}

// ── Get signed URL for a document ────────────────────────────────
export async function getDocumentSignedUrl(
  filePath: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('retailer-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (err) {
    console.error('Exception creating signed URL:', err);
    return { url: null, error: 'Failed to create signed URL' };
  }
}

// ── Delete a document ────────────────────────────────────────────
export async function deleteRetailerDocument(
  documentId: string,
  filePath: string
): Promise<{ error: string | null }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('retailer-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue to delete record even if storage delete fails
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('retailer_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document record:', deleteError);
      return { error: deleteError.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception deleting document:', err);
    return { error: 'Failed to delete document' };
  }
}
