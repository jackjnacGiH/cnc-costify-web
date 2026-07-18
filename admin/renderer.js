// รองรับการพรีวิวในเบราว์เซอร์ทั่วไป (ไม่มี Electron preload)
const api = window.adminApi || {
  async selectPrivateKey() {
    return { ok: false, error: 'preview-mode: ใช้ได้เฉพาะในแอป Electron' };
  },
  async generateLicense(payload, privateKeyPem, pubkeyId) {
    // สร้างผลลัพธ์จำลองเพื่อพรีวิวหน้าตา
    const demo = {
      payload,
      pubkey_id: pubkeyId,
      signature: '<demo-signature>',
      created_at: new Date().toISOString(),
    };
    return { ok: true, license: demo };
  },
  async saveLicense() {
    return { ok: false, error: 'preview-mode: ใช้ได้เฉพาะในแอป Electron' };
  },
};

const btnSelectKey = document.getElementById('btnSelectKey');
const keyPathEl = document.getElementById('keyPath');
const pubkeyIdEl = document.getElementById('pubkeyId');
const hardwareIdEl = document.getElementById('hardwareId');
const licenseIdEl = document.getElementById('licenseId');
const durationDaysEl = document.getElementById('durationDays');
const graceDaysEl = document.getElementById('graceDays');
const tolSecEl = document.getElementById('tolSec');
const modeEl = document.getElementById('mode');
const btnGenerate = document.getElementById('btnGenerate');
const btnSave = document.getElementById('btnSave');
const previewEl = document.getElementById('preview');
const statusEl = document.getElementById('status');

let privateKeyPem = null;
let generated = null;

btnSelectKey.addEventListener('click', async () => {
  statusEl.textContent = '';
  const res = await api.selectPrivateKey();
  if (!res.ok) {
    statusEl.textContent = `เลือกคีย์ล้มเหลว: ${res.error || 'unknown'}`;
    statusEl.className = 'err';
    return;
  }
  privateKeyPem = res.pem;
  keyPathEl.textContent = res.path || '(หน่วยความจำ)';
  statusEl.textContent = 'โหลดคีย์เรียบร้อย';
  statusEl.className = 'ok';
});

btnGenerate.addEventListener('click', async () => {
  statusEl.textContent = '';
  previewEl.value = '';
  btnSave.disabled = true;

  const hw = hardwareIdEl.value.trim();
  const lic = licenseIdEl.value.trim() || undefined;
  const pubkeyId = pubkeyIdEl.value.trim() || 'admin-key-2025';
  const durationDays = Number(durationDaysEl.value || 0);
  const graceDays = Number(graceDaysEl.value || 0);
  const tolSec = Number(tolSecEl.value || 0);
  const mode = modeEl.value;

  if (!privateKeyPem) {
    statusEl.textContent = 'กรุณาเลือกคีย์ส่วนตัวก่อน';
    statusEl.className = 'err';
    return;
  }
  if (!hw) {
    statusEl.textContent = 'กรุณาใส่ Hardware ID';
    statusEl.className = 'err';
    return;
  }
  if (!durationDays || durationDays <= 0) {
    statusEl.textContent = 'กรุณาระบุ "จำนวนวันใช้งาน" ให้มากกว่า 0';
    statusEl.className = 'err';
    return;
  }

  // Auto time: Not Before = now - 30 minutes; Expires At = now + duration days
  const now = new Date();
  const nbDate = new Date(now.getTime() - 30 * 60 * 1000);
  const expDate = new Date(now.getTime() + durationDays * 86400000);
  const toIsoNoMs = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nb = toIsoNoMs(nbDate);
  const exp = toIsoNoMs(expDate);

  const payload = {
    hardware_id: hw,
    not_before: nb,
    expires_at: exp,
    grace_period_days: graceDays,
    time_tolerance_sec: tolSec,
  };
  if (lic) payload.license_id = lic;
  if (mode === 'revoke') payload.revoked = true;

  const res = await api.generateLicense(payload, privateKeyPem, pubkeyId);
  if (!res.ok) {
    statusEl.textContent = `สร้างไฟล์ล้มเหลว: ${res.error || 'unknown'}`;
    statusEl.className = 'err';
    return;
  }
  generated = res.license;
  previewEl.value = JSON.stringify(generated, null, 2);
  statusEl.textContent = 'สร้างไฟล์สำเร็จ (ยังไม่บันทึก)';
  statusEl.className = 'ok';
  btnSave.disabled = false;
});

btnSave.addEventListener('click', async () => {
  if (!generated) return;
  const res = await api.saveLicense(generated, 'license.dat');
  if (!res.ok) {
    statusEl.textContent = `บันทึกล้มเหลว: ${res.error || 'unknown'}`;
    statusEl.className = 'err';
    return;
  }
  statusEl.textContent = `บันทึกเรียบร้อยที่ ${res.path}`;
  statusEl.className = 'ok';
});

// Utilities for automated/manual capture and demo
window.manual = {
  setPrivateKeyPem(pem, pathLabel) {
    privateKeyPem = pem;
    keyPathEl.textContent = pathLabel || '(memory)';
    statusEl.textContent = 'โหลดคีย์เรียบร้อย';
    statusEl.className = 'ok';
  },
  fillForm({ hardwareId, licenseId, durationDays, graceDays, tolSec, mode, pubkeyId }) {
    if (typeof hardwareId === 'string') hardwareIdEl.value = hardwareId;
    if (typeof licenseId === 'string') licenseIdEl.value = licenseId;
    if (Number.isFinite(durationDays)) durationDaysEl.value = String(durationDays);
    if (Number.isFinite(graceDays)) graceDaysEl.value = String(graceDays);
    if (Number.isFinite(tolSec)) tolSecEl.value = String(tolSec);
    if (typeof mode === 'string') modeEl.value = mode;
    if (typeof pubkeyId === 'string') pubkeyIdEl.value = pubkeyId;
  },
  async generate() {
    btnGenerate.click();
    // Wait a tick for UI to update
    await new Promise(r => setTimeout(r, 100));
  },
  async scrollToPreview() {
    previewEl.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 50));
  },
  getStatus() { return statusEl.textContent; },
};