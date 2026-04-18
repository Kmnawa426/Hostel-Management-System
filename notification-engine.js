(function () {
  const ABSENCE_ALERT_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function toDateOnly(dateValue) {
    if (!dateValue) return null;
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  }

  function parsePgDate(dateString) {
    if (!dateString) return null;
    const parts = String(dateString).split("-");
    if (parts.length !== 3) return toDateOnly(new Date(dateString));
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(year, month, day);
  }

  function todayPgDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayStartIso() {
    return `${todayPgDate()}T00:00:00`;
  }

  function getClient() {
    if (typeof window.getSupabaseClient !== "function") {
      throw new Error("Supabase config is not loaded.");
    }
    return window.getSupabaseClient();
  }

  async function resolveStudentAbsenceAlerts(studentId) {
    const supabaseClient = getClient();
    return supabaseClient
      .from("notifications")
      .update({ is_resolved: true, is_read: true })
      .eq("student_id", studentId)
      .eq("type", "long_absence")
      .eq("is_resolved", false);
  }

  async function syncLongAbsenceAlerts() {
    const supabaseClient = getClient();
    const today = parsePgDate(todayPgDate());

    const { data: students, error: studentsError } = await supabaseClient
      .from("students")
      .select("id,name,status,note,absent_since,last_absence_alert")
      .eq("status", "absent");

    if (studentsError || !students) {
      return { created: 0, error: studentsError || null };
    }

    let created = 0;

    for (const student of students) {
      if (!student.absent_since) continue;

      const absentSince = parsePgDate(student.absent_since);
      const lastAlert = student.last_absence_alert
        ? parsePgDate(student.last_absence_alert)
        : absentSince;
      if (!absentSince || !lastAlert || !today) continue;

      const elapsedDays = Math.floor((today - lastAlert) / DAY_MS);
      if (elapsedDays < ABSENCE_ALERT_DAYS) continue;

      const { data: existingOpen } = await supabaseClient
        .from("notifications")
        .select("id,created_at")
        .eq("type", "long_absence")
        .eq("student_id", student.id)
        .eq("is_resolved", false);

      if (existingOpen && existingOpen.length > 0) continue;

      // Safety dedupe: prevent another long-absence alert on the same day.
      const { data: sameDayAlerts } = await supabaseClient
        .from("notifications")
        .select("id")
        .eq("type", "long_absence")
        .eq("student_id", student.id)
        .gte("created_at", todayStartIso())
        .limit(1);

      if (sameDayAlerts && sameDayAlerts.length > 0) continue;

      const totalAbsentDays = Math.floor((today - absentSince) / DAY_MS);

      const { error: insertError } = await supabaseClient
        .from("notifications")
        .insert([{
          title: `${student.name} absent for ${totalAbsentDays} day${totalAbsentDays === 1 ? "" : "s"}`,
          message: `Absent since: ${absentSince.toDateString()} | Reason: ${student.note || "Not provided"}`,
          type: "long_absence",
          student_id: student.id,
          priority: "high",
          is_read: false,
          is_resolved: false
        }]);

      if (insertError) continue;

      await supabaseClient
        .from("students")
        .update({ last_absence_alert: todayPgDate() })
        .eq("id", student.id);

      created++;
    }

    return { created, error: null };
  }

  async function getOpenNotificationCount() {
    const supabaseClient = getClient();

    const { data } = await supabaseClient
      .from("notifications")
      .select("id")
      .eq("is_read", false)
      .eq("is_resolved", false);

    return data ? data.length : 0;
  }

  async function refreshNotificationBadges() {
    await syncLongAbsenceAlerts();
    const count = await getOpenNotificationCount();
    const badges = document.querySelectorAll("[data-notif-badge]");

    badges.forEach((badge) => {
      if (count > 0) {
        badge.innerText = count;
        badge.style.display = "inline-block";
      } else {
        badge.innerText = "";
        badge.style.display = "none";
      }
    });

    return count;
  }

  async function markStudentPresent(studentId) {
    const supabaseClient = getClient();
    const result = await supabaseClient
      .from("students")
      .update({
        status: "present",
        absent_since: null,
        last_absence_alert: null,
        note: null
      })
      .eq("id", studentId);

    if (!result.error) {
      await resolveStudentAbsenceAlerts(studentId);
    }

    return result;
  }

  async function markStudentAbsent(studentId, reason) {
    const supabaseClient = getClient();
    const today = todayPgDate();

    await resolveStudentAbsenceAlerts(studentId);

    return supabaseClient
      .from("students")
      .update({
        status: "absent",
        note: reason || null,
        absent_since: today,
        last_absence_alert: today
      })
      .eq("id", studentId);
  }

  async function restartAbsenceCycle(studentId, notifId) {
    const supabaseClient = getClient();

    const studentUpdate = await supabaseClient
      .from("students")
      .update({
        status: "absent",
        last_absence_alert: todayPgDate()
      })
      .eq("id", studentId);

    if (studentUpdate.error) return studentUpdate;

    if (notifId) {
      await supabaseClient
        .from("notifications")
        .update({ is_resolved: true, is_read: true })
        .eq("id", notifId);
    }

    return studentUpdate;
  }

  window.HostelNotifications = {
    syncLongAbsenceAlerts,
    refreshNotificationBadges,
    getOpenNotificationCount,
    markStudentPresent,
    markStudentAbsent,
    restartAbsenceCycle,
    resolveStudentAbsenceAlerts
  };
})();
