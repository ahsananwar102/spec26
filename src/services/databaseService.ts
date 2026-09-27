import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import {
  getStoredCompetitions,
  getStoredRegistrations,
  saveRegistrations,
  getStoredCategories,
  saveCategories,
  getStoredEventSettings,
  saveEventSettings,
} from '../lib/store';
import { Competition, Registration, RegStatus, CategoryItem, EventSettings, ContactMessage } from '../types';

export interface RegistrationInput {
  userId: string;
  competitionId: string;
  competitionTitle?: string;
  competitionCategory?: any;
  participationModel: 'individual' | 'team';
  teamName?: string;
  leaderName: string;
  leaderStudentId: string;
  university: string;
  department: string;
  academicYear: string;
  phone: string;
  email: string;
  paymentChannel: string;
  transactionId: string;
  calculatedFee: number;
}

export interface TeamMemberInput {
  memberNumber: number; // 2, 3, 4
  fullName: string;
  studentId: string;
  email?: string;
}

/**
 * 1. getCompetitions(category)
 * Fetches active competitions from Supabase with optional category filtering
 */
export async function getCompetitions(category?: string): Promise<{
  data: Competition[] | null;
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      let query = supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .order('track_number', { ascending: true });

      if (category && category.toLowerCase() !== 'all') {
        query = query.ilike('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map Supabase snake_case columns to application Competition model
      const mapped: Competition[] = (data || []).map((row: any) => ({
        id: row.id,
        slug: row.slug,
        orderNum: parseInt(row.track_number, 10) || 1,
        title: row.title,
        category: row.category.toUpperCase(),
        description: row.description,
        format: row.format,
        minMembers: row.min_members,
        maxMembers: row.max_members,
        soloFee: Number(row.solo_fee),
        teamFee: Number(row.team_fee),
        keyDeliverables: row.rules_summary,
        specsSummary: row.rules_summary,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      console.warn('Supabase getCompetitions query failed, using local cache:', err?.message);
    }
  }

  // Fallback to local store
  const localList = getStoredCompetitions();
  const filtered = category && category !== 'all'
    ? localList.filter(c => c.category.toLowerCase() === category.toLowerCase())
    : localList;

  return { data: filtered, error: null };
}

/**
 * 2. uploadReceipt(file)
 * Uploads payment voucher screenshot to Supabase Storage 'payment-receipts' bucket
 * Includes validation for file size (max 5MB) and type.
 */
export async function uploadReceipt(file: File): Promise<{
  url: string | null;
  path: string | null;
  error: string | null;
}> {
  if (!file) {
    return { url: null, path: null, error: 'No file provided' };
  }

  // 5MB max file size check
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { url: null, path: null, error: 'Receipt file exceeds the 5MB size limit. Please upload a smaller image or compressed PDF.' };
  }

  // Strict MIME type and extension validation
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();

  if (
    (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) ||
    !ALLOWED_EXTS.includes(fileExt)
  ) {
    return { url: null, path: null, error: 'Invalid file format. Only JPG, PNG, WEBP, and PDF vouchers are permitted.' };
  }

  if (supabase && isSupabaseReady) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `vouchers/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Retrieve public URL
      const { data: urlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        error: null,
      };
    } catch (err: any) {
      console.warn('Supabase storage upload failed, creating base64 data URL fallback:', err?.message);
    }
  }

  // Fallback: convert file to Base64 data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        path: file.name,
        error: null,
      });
    };
    reader.onerror = () => {
      resolve({
        url: null,
        path: null,
        error: 'Failed to read file into memory',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 3. createRegistration(registrationData, teamMembersList, receiptFile)
 * Complete transaction: Uploads voucher, registers entry, and inserts squad members
 */
export async function createRegistration(
  registrationData: RegistrationInput,
  teamMembersList: TeamMemberInput[] = [],
  receiptFile?: File | string
): Promise<{
  data: any | null;
  error: string | null;
}> {
  try {
    let receiptUrl = '';
    let receiptFileName = 'receipt_voucher.png';

    // 1. Upload receipt if file object is provided
    if (receiptFile instanceof File) {
      receiptFileName = receiptFile.name;
      const uploadRes = await uploadReceipt(receiptFile);
      if (uploadRes.error) {
        throw new Error(uploadRes.error);
      }
      receiptUrl = uploadRes.url || '';
    } else if (typeof receiptFile === 'string') {
      receiptUrl = receiptFile;
    }

    const regNum = Math.floor(10000 + Math.random() * 90000);
    const generatedRegId = `SPEC26-NED-${regNum}`;

    if (supabase && isSupabaseReady) {
      try {
        // 2. Insert into public.registrations
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .insert({
            registration_id: generatedRegId,
            user_id: registrationData.userId,
            competition_id: registrationData.competitionId,
            participation_model: registrationData.participationModel,
            team_name: registrationData.teamName || null,
            leader_name: registrationData.leaderName,
            leader_student_id: registrationData.leaderStudentId,
            university: registrationData.university,
            department: registrationData.department,
            academic_year: registrationData.academicYear,
            phone: registrationData.phone,
            email: registrationData.email,
            payment_channel: registrationData.paymentChannel,
            transaction_id: registrationData.transactionId,
            receipt_url: receiptUrl,
            status: 'pending',
            calculated_fee: registrationData.calculatedFee,
          })
          .select()
          .single();

        if (regError) throw regError;

        // 3. Insert team members if present
        if (teamMembersList.length > 0 && regData?.id) {
          const membersPayload = teamMembersList.map(tm => ({
            registration_id: regData.id,
            member_number: tm.memberNumber,
            full_name: tm.fullName,
            student_id: tm.studentId,
            email: tm.email || null,
          }));

          const { error: membersError } = await supabase
            .from('team_members')
            .insert(membersPayload);

          if (membersError) {
            console.error('Failed to link team members:', membersError.message);
          }
        }

        // Also synchronize local store cache
        const localRegistration: Registration = {
          id: regData.id,
          registrationId: generatedRegId,
          userId: registrationData.userId,
          competitionId: registrationData.competitionId,
          competitionTitle: registrationData.competitionTitle,
          competitionCategory: registrationData.competitionCategory,
          participationModel: registrationData.participationModel === 'team' ? 'TEAM' : 'SOLO',
          teamName: registrationData.teamName,
          fullName: registrationData.leaderName,
          studentId: registrationData.leaderStudentId,
          universityName: registrationData.university,
          department: registrationData.department,
          academicYear: registrationData.academicYear,
          phoneNumber: registrationData.phone,
          emailAddress: registrationData.email,
          paymentChannel: registrationData.paymentChannel,
          transactionId: registrationData.transactionId,
          receiptUrl: receiptUrl,
          receiptFileName: receiptFileName,
          status: 'PENDING',
          calculatedFee: registrationData.calculatedFee,
          createdAt: regData.created_at || new Date().toISOString(),
          teamMembers: teamMembersList.map((tm, idx) => ({
            id: 'tm-' + regData.id + '-' + idx,
            registrationId: regData.id,
            memberIndex: tm.memberNumber,
            name: tm.fullName,
            studentId: tm.studentId,
            email: tm.email,
          })),
        };
        const currentRegs = getStoredRegistrations();
        saveRegistrations([localRegistration, ...currentRegs.filter(r => r.id !== regData.id)]);

        return { data: regData, error: null };
      } catch (sbErr: any) {
        console.warn('Supabase insert failed, saving to local offline registry:', sbErr?.message);
      }
    }

    // Local / Offline fallback
    const localRegistration: Registration = {
      id: 'reg-' + Date.now(),
      registrationId: generatedRegId,
      userId: registrationData.userId,
      competitionId: registrationData.competitionId,
      competitionTitle: registrationData.competitionTitle,
      competitionCategory: registrationData.competitionCategory,
      participationModel: registrationData.participationModel === 'team' ? 'TEAM' : 'SOLO',
      teamName: registrationData.teamName,
      fullName: registrationData.leaderName,
      studentId: registrationData.leaderStudentId,
      universityName: registrationData.university,
      department: registrationData.department,
      academicYear: registrationData.academicYear,
      phoneNumber: registrationData.phone,
      emailAddress: registrationData.email,
      paymentChannel: registrationData.paymentChannel,
      transactionId: registrationData.transactionId,
      receiptUrl: receiptUrl,
      receiptFileName: receiptFileName,
      status: 'PENDING',
      calculatedFee: registrationData.calculatedFee,
      createdAt: new Date().toISOString(),
      teamMembers: teamMembersList.map((tm, idx) => ({
        id: 'tm-' + Date.now() + '-' + idx,
        registrationId: 'reg-' + Date.now(),
        memberIndex: tm.memberNumber,
        name: tm.fullName,
        studentId: tm.studentId,
        email: tm.email,
      })),
    };

    const currentRegs = getStoredRegistrations();
    saveRegistrations([localRegistration, ...currentRegs]);

    return { data: localRegistration, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to submit registration' };
  }
}

/**
 * 4. getAdminRegistrations()
 * Fetches registrations joined with competitions and team members for admin dashboard
 */
export async function getAdminRegistrations(): Promise<{
  data: Registration[] | null;
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          team_members (
            id,
            member_number,
            full_name,
            student_id,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const localComps = getStoredCompetitions();

      // Transform to client application Registration format
      const formatted: Registration[] = (data || []).map((row: any) => {
        const comp = localComps.find(c => c.id === row.competition_id || c.slug === row.competition_id);
        return {
          id: row.id,
          registrationId: row.registration_id || `SPEC26-NED-${row.id.slice(0, 5)}`,
          userId: row.user_id,
          competitionId: row.competition_id,
          competitionTitle: comp?.title || 'Competition Track',
          competitionCategory: comp?.category?.toUpperCase(),
        participationModel: row.participation_model === 'team' ? 'TEAM' : 'SOLO',
        teamName: row.team_name,
        fullName: row.leader_name,
        studentId: row.leader_student_id,
        universityName: row.university,
        department: row.department,
        academicYear: row.academic_year,
        phoneNumber: row.phone,
        emailAddress: row.email,
        paymentChannel: row.payment_channel,
        transactionId: row.transaction_id,
        receiptUrl: row.receipt_url,
        receiptFileName: 'voucher.png',
        status: row.status.toUpperCase() as RegStatus,
        calculatedFee: Number(row.calculated_fee || 0),
        notes: row.admin_notes,
        createdAt: row.created_at,
        teamMembers: (row.team_members || []).map((tm: any) => ({
          id: tm.id,
          registrationId: row.id,
          memberIndex: tm.member_number,
          name: tm.full_name,
          studentId: tm.student_id,
          email: tm.email,
        })),
      };
    });

      // Cache the latest in local store
      saveRegistrations(formatted);

      return { data: formatted, error: null };
    } catch (err: any) {
      console.warn('Supabase getAdminRegistrations query failed, falling back:', err?.message);
    }
  }

  // Fallback to local store
  return { data: getStoredRegistrations(), error: null };
}

/**
 * 5. updateRegistrationStatus(id, newStatus)
 * Updates approval status ('pending', 'verified', 'rejected') and optional notes
 */
export async function updateRegistrationStatus(
  id: string,
  newStatus: string,
  adminNotes?: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const normalizedStatus = newStatus.toLowerCase();

  if (supabase && isSupabaseReady) {
    try {
      const updatePayload: any = {
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      };
      if (adminNotes !== undefined) {
        updatePayload.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('registrations')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase updateRegistrationStatus failed, syncing local store:', err?.message);
    }
  }

  // Always keep local store updated in tandem
  const allRegs = getStoredRegistrations();
  const updated = allRegs.map(r =>
    r.id === id
      ? { ...r, status: newStatus.toUpperCase() as RegStatus, notes: adminNotes !== undefined ? adminNotes : r.notes }
      : r
  );
  saveRegistrations(updated);

  return { success: true, error: null };
}

/**
 * 6. getCategories()
 * Fetches categories from Supabase with fallback to local store
 */
export async function getCategories(): Promise<{
  data: CategoryItem[];
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_num', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: CategoryItem[] = data.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          icon: row.icon,
          orderNum: row.order_num,
          createdAt: row.created_at
        }));
        saveCategories(mapped);
        return { data: mapped, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase getCategories query failed, using local store:', err?.message);
    }
  }
  return { data: getStoredCategories(), error: null };
}

/**
 * 7. getEventSettings()
 * Fetches event dates and registration phase from Supabase
 */
export async function getEventSettings(): Promise<{
  data: EventSettings;
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .select('*')
        .eq('id', 'current')
        .single();

      if (error) throw error;
      if (data) {
        const settings: EventSettings = {
          registrationPhase: data.registration_phase,
          eventDate: data.event_date,
          registrationStartDate: data.registration_start_date,
          registrationEndDate: data.registration_end_date,
          competitionDates: data.competition_dates,
          updatedAt: data.updated_at
        };
        saveEventSettings(settings);
        return { data: settings, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase getEventSettings query failed, using local store:', err?.message);
    }
  }
  return { data: getStoredEventSettings(), error: null };
}

/**
 * 8. updateEventSettings(settings)
 * Updates event dates and registration phase in Supabase
 */
export async function updateEventSettings(settings: EventSettings): Promise<{
  success: boolean;
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      const { error } = await supabase
        .from('event_settings')
        .upsert({
          id: 'current',
          registration_phase: settings.registrationPhase,
          event_date: settings.eventDate,
          registration_start_date: settings.registrationStartDate,
          registration_end_date: settings.registrationEndDate,
          competition_dates: settings.competitionDates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase updateEventSettings failed, syncing local store:', err?.message);
    }
  }
  saveEventSettings(settings);
  return { success: true, error: null };
}

/**
 * 9. submitContactMessage(msg)
 * Inserts contact inquiry into Supabase public.contact_messages table
 */
export async function submitContactMessage(msg: {
  fullName: string;
  emailAddress: string;
  subjectCategory: string;
  messageBody: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (supabase && isSupabaseReady) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          full_name: msg.fullName,
          email_address: msg.emailAddress,
          subject_category: msg.subjectCategory,
          message_body: msg.messageBody,
          status: 'NEW',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase submitContactMessage error:', err?.message);
      return { success: false, error: err?.message };
    }
  }
  return { success: true };
}

/**
 * 10. getContactMessages()
 * Retrieves contact inquiries from Supabase
 */
export async function getContactMessages(): Promise<{
  data: ContactMessage[];
  error: string | null;
}> {
  if (supabase && isSupabaseReady) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mapped: ContactMessage[] = data.map((row: any) => ({
          id: row.id,
          fullName: row.full_name,
          emailAddress: row.email_address,
          subjectCategory: row.subject_category,
          messageBody: row.message_body,
          status: row.status,
          createdAt: row.created_at,
        }));
        return { data: mapped, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase getContactMessages error:', err?.message);
    }
  }
  return { data: [], error: null };
}

/**
 * 11. deleteRegistrationInDb(id)
 * Deletes registration record from Supabase
 */
export async function deleteRegistrationInDb(id: string): Promise<{ success: boolean }> {
  if (supabase && isSupabaseReady) {
    try {
      await supabase.from('registrations').delete().eq('id', id);
    } catch (err: any) {
      console.warn('Supabase delete registration failed:', err?.message);
    }
  }
  return { success: true };
}

