/**
 * Dharashiv Foundation - Profile Registration Wizard
 * Handles the post-OAuth profile completion requirement.
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { showToast } from './ui.js';
import { isValidUrl } from './validators.js';

export async function initRegistration() {
  const profile = await getCurrentProfile();
  if (!profile) {
    window.location.href = '/login.html';
    return;
  }

  // Populate known details from Google Auth
  const emailInput = document.getElementById('regEmail');
  const nameInput = document.getElementById('regFullName');

  if (emailInput) emailInput.value = profile.email || '';
  if (nameInput) nameInput.value = profile.full_name || '';

  // Setup profession change listener for conditional fields
  const professionSelect = document.getElementById('regProfession');
  const businessDetailsSection = document.getElementById('businessFieldsSection');

  if (professionSelect && businessDetailsSection) {
    professionSelect.addEventListener('change', () => {
      const val = professionSelect.value;
      const isBusiness = val === 'Business Owner / Entrepreneur' || val === 'Freelancer';
      businessDetailsSection.style.display = isBusiness ? 'block' : 'none';
    });
  }

  // Setup form submission
  const form = document.getElementById('profileRegistrationForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleRegistrationSubmit(profile.id);
    });
  }
}

async function handleRegistrationSubmit(userId) {
  const submitBtn = document.getElementById('submitRegBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving Profile...';
  }

  try {
    const fullName = document.getElementById('regFullName').value.trim();
    const taluka = document.getElementById('regTaluka').value;
    const nativeVillage = document.getElementById('regVillage').value.trim();
    const currentCity = document.getElementById('regCity').value.trim();
    const profession = document.getElementById('regProfession').value;

    const companyName = document.getElementById('regCompanyName')?.value.trim() || '';
    const businessCategory = document.getElementById('regBusinessCategory')?.value || '';
    const businessType = document.getElementById('regBusinessType')?.value || '';
    const businessDescription = document.getElementById('regBusinessDesc')?.value.trim() || '';
    const servicesOffered = document.getElementById('regServices')?.value.trim() || '';

    // Networking interests checkboxes
    const checkedInterests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
      .map(cb => cb.value);

    const websiteUrl = document.getElementById('regWebsite')?.value.trim() || '';
    const linkedinUrl = document.getElementById('regLinkedIn')?.value.trim() || '';

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      showToast('Please enter a valid website URL.', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Complete Registration'; }
      return;
    }

    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      showToast('Please enter a valid LinkedIn URL.', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Complete Registration'; }
      return;
    }

    const updates = {
      full_name: fullName,
      taluka,
      native_village: nativeVillage,
      district: 'Dharashiv',
      current_city: currentCity,
      profession,
      company_name: companyName,
      business_category: businessCategory,
      business_type: businessType,
      business_description: businessDescription,
      services_offered: servicesOffered,
      networking_interests: checkedInterests,
      website_url: websiteUrl,
      linkedin_url: linkedinUrl,
      is_profile_completed: true,
      updated_at: new Date().toISOString()
    };

    const supabase = await getSupabase();

    if (supabase.isMock) {
      mockStore.updateProfile(userId, updates);
    } else {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    }

    showToast('Profile registered successfully! Welcome to Dharashiv Foundation.', 'success');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);

  } catch (err) {
    console.error('Registration failed:', err);
    showToast(err.message || 'Failed to save profile. Please check your inputs.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Complete Registration';
    }
  }
}
