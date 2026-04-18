/*
  Shared Supabase configuration for the Hostel Management System.
  Replace the placeholder values below with your own Supabase project URL
  and publishable anon key before using the app.

  Database tables used in this project:
  - students: main student profile, attendance, room link, and contact details
  - rooms: room inventory, occupancy, and room metadata
  - complaints: complaint records and complaint status updates
  - complaint_students: complaint-to-student mapping table
  - installment_plans: master installment plan for a student
  - installment_schedules: per-installment due schedule rows
  - student_installments: legacy installment records still read for compatibility
  - installment_transactions: payment/create/edit transaction log
  - notifications: notification center items and long-absence alerts
  - hostel_events: uploaded hostel event stories and image paths

  Storage buckets used in this project:
  - student-photos: uploaded student profile images
  - hostel-events: uploaded event media
 */
(function () {
  const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; // CHANGE REQUIRED: replace with your Supabase project URL
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // CHANGE REQUIRED: replace with your Supabase publishable anon key
  const APP_TIMEZONE = "Asia/Kolkata";
  const APP_UTC_OFFSET = "+05:30";

  let sharedClient = null;

  function isSupabaseConfigured() {
    return (
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
      !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&// DO NOT CHANGE
      !!SUPABASE_ANON_KEY &&
      SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"// DO NOT CHANGE
    );
  }

  function getSupabaseClient() {
    if (sharedClient) return sharedClient;
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase SDK is not loaded.");
    }
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Open supabase-config.js and replace the placeholder URL and anon key.");
    }

    sharedClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sharedClient;
  }

  function formatHostelDateTime(value) {
    if (!value) return "-";
    const date = parseHostelDateTime(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: APP_TIMEZONE,
      hour12: true
    }).format(date) + " IST";
  }

  function parseHostelDateTime(value) {
    if (value instanceof Date) return value;

    const raw = String(value || "").trim();
    if (!raw) return new Date("");

    const hasExplicitZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(raw);
    const normalized = hasExplicitZone ? raw : raw.replace(" ", "T") + "Z";
    return new Date(normalized);
  }

  function getHostelDayRangeIso(dateString) {
    if (!dateString) return null;

    return {
      startIso: new Date(dateString + "T00:00:00" + APP_UTC_OFFSET).toISOString(),
      endIso: new Date(dateString + "T23:59:59.999" + APP_UTC_OFFSET).toISOString()
    };
  }

  async function validateRoomGenderAssignment(client, roomId, gender, excludeStudentId) {
    if (!roomId || !gender) {
      return { ok: true, conflict: null };
    }

    const { data, error } = await client
      .from("students")
      .select("id,name,gender")
      .eq("room_id", roomId);

    if (error) {
      return { ok: false, conflict: null, error };
    }

    const targetGender = String(gender).trim().toLowerCase();
    const conflict = (data || []).find(function (student) {
      if (excludeStudentId && String(student.id) === String(excludeStudentId)) return false;
      return String(student.gender || "").trim().toLowerCase() !== targetGender;
    }) || null;

    return {
      ok: !conflict,
      conflict: conflict
    };
  }

  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    timezone: APP_TIMEZONE,
    configured: isSupabaseConfigured()
  };
  window.HOSTEL_TABLES = [
    "students",
    "rooms",
    "complaints",
    "complaint_students",
    "installment_plans",
    "installment_schedules",
    "student_installments",
    "installment_transactions",
    "notifications",
    "hostel_events"
  ];
  window.HOSTEL_STORAGE_BUCKETS = [
    "student-photos",
    "hostel-events"
  ];
  window.isSupabaseConfigured = isSupabaseConfigured;
  window.getSupabaseClient = getSupabaseClient;
  window.formatHostelDateTime = formatHostelDateTime;
  window.parseHostelDateTime = parseHostelDateTime;
  window.getHostelDayRangeIso = getHostelDayRangeIso;
  window.validateRoomGenderAssignment = validateRoomGenderAssignment;
})();
