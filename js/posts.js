/**
 * Dharashiv Foundation - Feed & Posts Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { showToast, formatRelativeTime, escapeHtml, openModal, closeModal } from './ui.js';
import { uploadFileToStorage } from './uploads.js';

let selectedMediaFile = null;

export async function initFeed() {
  const currentProfile = await getCurrentProfile();

  // Setup Create Post Input & Avatar
  const userAvatar = document.getElementById('currentUserAvatar');
  if (userAvatar && currentProfile?.avatar_url) {
    userAvatar.src = currentProfile.avatar_url;
  }

  // Setup media file upload trigger
  const photoBtn = document.getElementById('addPhotoBtn');
  const fileInput = document.getElementById('postFileInput');
  const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');
  const mediaPreviewImg = document.getElementById('mediaPreviewImg');
  const removeMediaBtn = document.getElementById('removeMediaBtn');

  if (photoBtn && fileInput) {
    photoBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedMediaFile = file;
        const reader = new FileReader();
        reader.onload = (re) => {
          mediaPreviewImg.src = re.target.result;
          mediaPreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeMediaBtn) {
    removeMediaBtn.addEventListener('click', () => {
      selectedMediaFile = null;
      if (fileInput) fileInput.value = '';
      if (mediaPreviewContainer) mediaPreviewContainer.style.display = 'none';
    });
  }

  // Submit Post
  const submitPostBtn = document.getElementById('submitPostBtn');
  const postContentInput = document.getElementById('postContentInput');
  const postCategorySelect = document.getElementById('postCategorySelect');

  if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
      const content = postContentInput.value.trim();
      if (!content && !selectedMediaFile) {
        showToast('Please type a message or select an image for your post.', 'error');
        return;
      }

      submitPostBtn.disabled = true;
      submitPostBtn.innerHTML = 'Publishing...';

      try {
        let mediaUrl = null;
        let storagePath = null;

        if (selectedMediaFile) {
          showToast('Uploading media...', 'info');
          const uploadRes = await uploadFileToStorage({
            file: selectedMediaFile,
            uploadType: 'post_media'
          });
          mediaUrl = uploadRes.fileUrl;
          storagePath = uploadRes.objectKey;
        }

        const category = postCategorySelect?.value || 'General';

        await publishPost({ content, category, mediaUrl, storagePath });

        // Reset form
        postContentInput.value = '';
        selectedMediaFile = null;
        if (fileInput) fileInput.value = '';
        if (mediaPreviewContainer) mediaPreviewContainer.style.display = 'none';

        showToast('Post published to Dharashiv Community Feed!', 'success');
        await loadFeed();

      } catch (err) {
        console.error('Post creation failed:', err);
        showToast(err.message || 'Failed to publish post.', 'error');
      } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.innerHTML = 'Publish Post';
      }
    });
  }

  // Setup report submission modal
  setupReportModal(currentProfile?.id);

  // Load feed initially
  await loadFeed();
}

async function publishPost({ content, category, mediaUrl, storagePath }) {
  const currentProfile = await getCurrentProfile();
  const supabase = await getSupabase();

  if (supabase.isMock) {
    mockStore.addPost({ content, category, media_url: mediaUrl });
    return;
  }

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      author_id: currentProfile.id,
      content,
      category
    })
    .select()
    .single();

  if (postErr) throw postErr;

  if (mediaUrl && post) {
    await supabase.from('post_media').insert({
      post_id: post.id,
      media_url: mediaUrl,
      storage_path: storagePath || 'posts/media.jpg',
      s3_key: storagePath || 'posts/media.jpg'
    });
  }
}

export async function loadFeed(categoryFilter = null) {
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const currentProfile = await getCurrentProfile();
  const supabase = await getSupabase();

  feedList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">Loading community feed...</div>';

  let posts = [];

  if (supabase.isMock) {
    posts = mockStore.getPosts();
  } else {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url, taluka, profession, role),
        post_media(media_url)
      `)
      .order('created_at', { ascending: false });

    if (categoryFilter && categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      feedList.innerHTML = `<div class="empty-state">
        <p style="color: var(--color-error);">Error loading posts: ${error.message}</p>
      </div>`;
      return;
    }
    posts = data || [];
  }

  if (categoryFilter && categoryFilter !== 'All' && supabase.isMock) {
    posts = posts.filter(p => p.category === categoryFilter);
  }

  if (posts.length === 0) {
    feedList.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-feed.svg" alt="No posts" class="empty-state-img" />
        <h3 class="empty-state-title">No Posts in this Feed Yet</h3>
        <p class="empty-state-desc">Be the first to share an update, announce a regional project, or ask the community a question.</p>
      </div>
    `;
    return;
  }

  feedList.innerHTML = posts.map(post => renderPostCard(post, currentProfile)).join('');

  attachPostEventListeners(posts, currentProfile);
}

function renderPostCard(post, currentProfile) {
  const author = post.author || { full_name: 'Community Member', taluka: 'Dharashiv', avatar_url: '/assets/avatars/default-avatar.svg' };
  const isAuthor = currentProfile && currentProfile.id === post.author_id;
  const isAdmin = currentProfile && currentProfile.role === 'admin';
  const isLiked = post.liked_by?.includes(currentProfile?.id);

  const mediaUrl = post.media_url || post.post_media?.[0]?.media_url;

  return `
    <article class="post-card" id="post-${post.id}">
      <div class="post-header">
        <a href="/profile.html?id=${author.id}" class="post-author">
          <img src="${author.avatar_url || '/assets/avatars/default-avatar.svg'}" alt="${escapeHtml(author.full_name)}" class="post-avatar" />
          <div class="post-author-info">
            <span class="post-author-name">${escapeHtml(author.full_name)}</span>
            <div class="post-meta">
              <span>📍 ${escapeHtml(author.taluka || 'Dharashiv')}</span>
              <span>•</span>
              <span>${formatRelativeTime(post.created_at)}</span>
              <span>•</span>
              <span class="badge badge-orange">${escapeHtml(post.category || 'General')}</span>
            </div>
          </div>
        </a>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${(isAuthor || isAdmin) ? `
            <button class="btn btn-sm btn-outline delete-post-btn" data-post-id="${post.id}" title="Delete post">
              Delete
            </button>
          ` : `
            <button class="btn btn-sm btn-outline report-post-btn" data-post-id="${post.id}" title="Report post">
              Report
            </button>
          `}
        </div>
      </div>

      <div class="post-body">
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${mediaUrl ? `
          <div class="post-media">
            <img src="${mediaUrl}" alt="Post image" loading="lazy" />
          </div>
        ` : ''}
      </div>

      <div class="post-stats">
        <span><strong class="like-count-display">${post.likes_count || 0}</strong> likes</span>
        <span><strong class="comment-count-display">${post.comments_count || 0}</strong> comments</span>
      </div>

      <div class="post-actions-bar">
        <button class="post-interact-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          Like
        </button>
        <button class="post-interact-btn toggle-comments-btn" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Comments
        </button>
      </div>

      <!-- Comments Container -->
      <div class="post-comments" id="comments-${post.id}" style="display: none;">
        <div class="comment-input-box">
          <img src="${currentProfile?.avatar_url || '/assets/avatars/default-avatar.svg'}" class="comment-avatar" alt="You" />
          <input type="text" class="comment-input" placeholder="Write a constructive comment..." />
          <button class="btn btn-sm btn-primary submit-comment-btn" data-post-id="${post.id}">Send</button>
        </div>
        <div class="comments-list" id="comments-list-${post.id}"></div>
      </div>
    </article>
  `;
}

function attachPostEventListeners(posts, currentProfile) {
  // Like buttons
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      await handleToggleLike(postId, btn);
    });
  });

  // Comments toggles
  document.querySelectorAll('.toggle-comments-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      const commentsSection = document.getElementById(`comments-${postId}`);
      if (commentsSection) {
        const isHidden = commentsSection.style.display === 'none';
        commentsSection.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
          await loadComments(postId);
        }
      }
    });
  });

  // Submit comment buttons
  document.querySelectorAll('.submit-comment-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      const input = btn.closest('.comment-input-box').querySelector('.comment-input');
      const text = input.value.trim();
      if (!text) return;

      btn.disabled = true;
      try {
        await handleAddComment(postId, text);
        input.value = '';
        await loadComments(postId);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Delete post buttons
  document.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        await handleDeletePost(postId);
      }
    });
  });

  // Report post buttons
  document.querySelectorAll('.report-post-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.postId;
      const targetInput = document.getElementById('reportTargetId');
      if (targetInput) targetInput.value = postId;
      openModal('reportModal');
    });
  });
}

async function handleToggleLike(postId, btn) {
  const postCard = document.getElementById(`post-${postId}`);
  const countEl = postCard?.querySelector('.like-count-display');
  const supabase = await getSupabase();

  if (supabase.isMock) {
    const res = mockStore.toggleLike(postId);
    if (res) {
      if (res.liked) btn.classList.add('liked');
      else btn.classList.remove('liked');
      if (countEl) countEl.textContent = res.count;
    }
    return;
  }

  // Live Supabase toggle
  const currentProfile = await getCurrentProfile();
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', currentProfile.id)
    .single();

  if (existingLike) {
    await supabase.from('likes').delete().eq('id', existingLike.id);
    btn.classList.remove('liked');
    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent, 10) - 1);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: currentProfile.id });
    btn.classList.add('liked');
    if (countEl) countEl.textContent = parseInt(countEl.textContent, 10) + 1;
  }
}

async function loadComments(postId) {
  const container = document.getElementById(`comments-list-${postId}`);
  if (!container) return;

  const supabase = await getSupabase();
  let comments = [];

  if (supabase.isMock) {
    comments = mockStore.getComments(postId);
  } else {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(id, full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    comments = data || [];
  }

  if (comments.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: var(--color-text-muted); padding: 0.5rem 0;">No comments yet. Start the conversation!</div>';
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="comment-item">
      <img src="${c.author?.avatar_url || '/assets/avatars/default-avatar.svg'}" class="comment-avatar" alt="${escapeHtml(c.author?.full_name)}" />
      <div class="comment-bubble">
        <div class="comment-author">${escapeHtml(c.author?.full_name || 'Member')}</div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
      </div>
    </div>
  `).join('');
}

async function handleAddComment(postId, content) {
  const currentProfile = await getCurrentProfile();
  const supabase = await getSupabase();

  if (supabase.isMock) {
    mockStore.addComment(postId, content);
  } else {
    await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentProfile.id,
      content
    });
  }

  const postCard = document.getElementById(`post-${postId}`);
  const countEl = postCard?.querySelector('.comment-count-display');
  if (countEl) countEl.textContent = parseInt(countEl.textContent, 10) + 1;
}

async function handleDeletePost(postId) {
  const supabase = await getSupabase();

  if (supabase.isMock) {
    mockStore.deletePost(postId);
  } else {
    await supabase.from('posts').delete().eq('id', postId);
  }

  showToast('Post deleted.', 'info');
  const card = document.getElementById(`post-${postId}`);
  if (card) card.remove();
}

function setupReportModal(reporterId) {
  const form = document.getElementById('reportForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetId = document.getElementById('reportTargetId').value;
    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value.trim();

    try {
      const supabase = await getSupabase();
      if (supabase.isMock) {
        mockStore.addReport({ target_type: 'post', target_id: targetId, reason, details });
      } else {
        await supabase.from('reports').insert({
          reporter_id: reporterId,
          target_type: 'post',
          target_id: targetId,
          reason,
          details
        });
      }

      closeModal('reportModal');
      showToast('Thank you. Content reported for moderation review.', 'success');
      form.reset();
    } catch (err) {
      showToast('Failed to submit report.', 'error');
    }
  });
}
