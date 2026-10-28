/**
 * Dharashiv Foundation - Events Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { formatDate, escapeHtml, showToast, openModal, closeModal } from './ui.js';

export async function initEventsPage() {
  const currentProfile = await getCurrentProfile();

  // Create Event button for admins
  const createEventBtn = document.getElementById('openCreateEventModalBtn');
  if (createEventBtn) {
    if (currentProfile?.role === 'admin') {
      createEventBtn.style.display = 'inline-flex';
      createEventBtn.addEventListener('click', () => openModal('createEventModal'));
    } else {
      createEventBtn.style.display = 'none';
    }
  }

  // Event form handler
  const eventForm = document.getElementById('createEventForm');
  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCreateEvent(currentProfile);
    });
  }

  await loadEventsList(currentProfile);
}

export async function loadEventsList(currentProfile) {
  const container = document.getElementById('eventsListContainer');
  if (!container) return;

  const supabase = await getSupabase();
  let events = [];

  if (supabase.isMock) {
    events = mockStore.getEvents();
  } else {
    const { data } = await supabase.from('events').select('*, organizer:profiles(*)').order('event_date', { ascending: true });
    events = data || [];
  }

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-events.svg" class="empty-state-img" alt="No events" />
        <h3 class="empty-state-title">No Events Scheduled</h3>
        <p class="empty-state-desc">Upcoming community workshops and regional conferences will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map(evt => {
    const dateObj = new Date(evt.event_date);
    const month = dateObj.toLocaleString('en-IN', { month: 'short' });
    const day = dateObj.getDate();
    const time = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="card" style="margin-bottom: 1.5rem; display: flex; flex-direction: column;">
        <div class="card-body" style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <div class="event-date-badge" style="width: 72px; height: 78px; padding: 0.75rem;">
            <span class="event-month" style="font-size: 0.8rem;">${month}</span>
            <span class="event-day" style="font-size: 1.75rem;">${day}</span>
          </div>

          <div style="flex: 1; min-width: 260px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <span class="badge badge-orange" style="margin-bottom: 0.5rem;">${escapeHtml(evt.category)}</span>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary-dark-brown);">${escapeHtml(evt.title)}</h3>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 0.35rem;">
                  🕒 ${time} • 📍 ${escapeHtml(evt.venue)}, ${escapeHtml(evt.taluka)}
                </div>
              </div>

              <div>
                <button class="btn btn-primary register-event-btn" data-event-id="${evt.id}">
                  RSVP / Register
                </button>
              </div>
            </div>

            <p style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-primary); margin-top: 1rem;">
              ${escapeHtml(evt.description)}
            </p>

            <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--color-text-muted); display: flex; gap: 1rem;">
              <span>👥 <strong>${evt.attendees_count || 0}</strong> Registered</span>
              ${evt.capacity ? `<span>• Capacity: ${evt.capacity} seats</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.register-event-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Registered ✓';
      btn.className = 'btn btn-success';
      showToast('You have successfully registered for this event!', 'success');
    });
  });
}

async function handleCreateEvent(currentProfile) {
  const submitBtn = document.getElementById('submitEventBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Creating...'; }

  try {
    const title = document.getElementById('eventTitle').value.trim();
    const event_date = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value.trim();
    const taluka = document.getElementById('eventTaluka').value;
    const category = document.getElementById('eventCategory').value;
    const capacity = parseInt(document.getElementById('eventCapacity').value, 10) || 100;
    const description = document.getElementById('eventDescription').value.trim();

    const eventData = { title, event_date, venue, taluka, category, capacity, description, attendees_count: 1 };

    const supabase = await getSupabase();
    if (supabase.isMock) {
      mockStore.data.events.push({ id: 'evt-' + Date.now(), organizer_id: currentProfile.id, ...eventData, status: 'upcoming' });
      mockStore.save();
    } else {
      await supabase.from('events').insert({ ...eventData, organizer_id: currentProfile.id });
    }

    closeModal('createEventModal');
    showToast('Event created successfully!', 'success');
    document.getElementById('createEventForm').reset();
    await loadEventsList(currentProfile);

  } catch (err) {
    showToast(err.message || 'Failed to create event.', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Publish Event'; }
  }
}
