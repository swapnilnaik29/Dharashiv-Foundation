/**
 * Dharashiv Foundation - Demonstration & Development Mock Store
 * Lightweight local storage adapter for development and testing.
 * Clean initial state with zero hardcoded placeholder data.
 */

const STORAGE_KEY = 'dharashiv_store_v2';

const INITIAL_DATA = {
  currentUser: null,
  profiles: [],
  posts: [],
  comments: [],
  connections: [],
  conversations: [],
  messages: [],
  jobs: [],
  job_applications: [],
  events: [],
  announcements: [],
  notifications: [],
  reports: []
};

export class MockStore {
  constructor() {
    this.init();
  }

  init() {
    try {
      // Purge old mock storage key containing placeholder data
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dharashiv_mock_db_v1');
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.data = JSON.parse(stored);
        } else {
          this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
          this.save();
        }
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      }
    } catch {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }

  getCurrentUser() {
    return this.data.currentUser || null;
  }

  setCurrentUser(user) {
    this.data.currentUser = user;
    this.save();
  }

  getProfiles() {
    return this.data.profiles || [];
  }

  getProfile(id) {
    if (!id) return null;
    return (this.data.profiles || []).find(p => p.id === id) || (this.data.currentUser?.id === id ? this.data.currentUser : null);
  }

  updateProfile(id, updates) {
    if (!this.data.profiles) this.data.profiles = [];
    const idx = this.data.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.profiles[idx] = { ...this.data.profiles[idx], ...updates, updated_at: new Date().toISOString() };
    } else {
      this.data.profiles.push({ id, ...updates, created_at: new Date().toISOString() });
    }
    if (this.data.currentUser && this.data.currentUser.id === id) {
      this.data.currentUser = { ...this.data.currentUser, ...updates, updated_at: new Date().toISOString() };
    }
    this.save();
    return this.getProfile(id);
  }

  getPosts() {
    return (this.data.posts || []).map(post => {
      const author = this.getProfile(post.author_id);
      return { ...post, author };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addPost(post) {
    if (!this.data.posts) this.data.posts = [];
    const newPost = {
      id: 'post-' + Date.now(),
      author_id: this.data.currentUser?.id || 'anonymous',
      content: post.content,
      category: post.category || 'General',
      media_url: post.media_url || null,
      likes_count: 0,
      comments_count: 0,
      liked_by: [],
      created_at: new Date().toISOString()
    };
    this.data.posts.unshift(newPost);
    this.save();
    return { ...newPost, author: this.getCurrentUser() };
  }

  deletePost(postId) {
    this.data.posts = (this.data.posts || []).filter(p => p.id !== postId);
    this.data.comments = (this.data.comments || []).filter(c => c.post_id !== postId);
    this.save();
  }

  toggleLike(postId) {
    const post = (this.data.posts || []).find(p => p.id === postId);
    if (!post) return null;
    const userId = this.data.currentUser?.id;
    if (!userId) return null;
    if (!post.liked_by) post.liked_by = [];

    const isLiked = post.liked_by.includes(userId);
    if (isLiked) {
      post.liked_by = post.liked_by.filter(id => id !== userId);
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      post.liked_by.push(userId);
      post.likes_count += 1;
    }
    this.save();
    return { liked: !isLiked, count: post.likes_count };
  }

  getComments(postId) {
    return (this.data.comments || [])
      .filter(c => c.post_id === postId)
      .map(c => ({ ...c, author: this.getProfile(c.author_id) }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  addComment(postId, content) {
    if (!this.data.comments) this.data.comments = [];
    const newComment = {
      id: 'comment-' + Date.now(),
      post_id: postId,
      author_id: this.data.currentUser?.id || 'anonymous',
      content,
      created_at: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    const post = (this.data.posts || []).find(p => p.id === postId);
    if (post) post.comments_count = (post.comments_count || 0) + 1;
    this.save();
    return { ...newComment, author: this.getCurrentUser() };
  }

  getConnections(userId) {
    return (this.data.connections || []).filter(c => c.requester_id === userId || c.recipient_id === userId);
  }

  updateConnectionStatus(connId, status) {
    const conn = (this.data.connections || []).find(c => c.id === connId);
    if (conn) {
      conn.status = status;
      this.save();
    }
    return conn;
  }

  createConnection(requesterId, recipientId) {
    if (!this.data.connections) this.data.connections = [];
    const exists = this.data.connections.find(c =>
      (c.requester_id === requesterId && c.recipient_id === recipientId) ||
      (c.requester_id === recipientId && c.recipient_id === requesterId)
    );
    if (exists) return exists;

    const newConn = {
      id: 'conn-' + Date.now(),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.data.connections.push(newConn);
    this.save();
    return newConn;
  }

  getJobs() {
    return (this.data.jobs || []).map(j => ({ ...j, poster: this.getProfile(j.poster_id) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addJob(job) {
    if (!this.data.jobs) this.data.jobs = [];
    const newJob = {
      id: 'job-' + Date.now(),
      poster_id: this.data.currentUser?.id || 'anonymous',
      title: job.title,
      company_name: job.company_name,
      taluka: job.taluka,
      location: job.location,
      job_type: job.job_type,
      category: job.category,
      description: job.description,
      requirements: job.requirements,
      salary_range: job.salary_range || 'Competitive',
      status: 'active',
      applications_count: 0,
      created_at: new Date().toISOString()
    };
    this.data.jobs.unshift(newJob);
    this.save();
    return newJob;
  }

  getApplications(jobId, applicantId) {
    return (this.data.job_applications || []).filter(a => {
      if (jobId && a.job_id !== jobId) return false;
      if (applicantId && a.applicant_id !== applicantId) return false;
      return true;
    }).map(a => {
      const job = (this.data.jobs || []).find(j => j.id === a.job_id);
      const applicant = this.getProfile(a.applicant_id);
      return { ...a, job, applicant };
    });
  }

  addApplication(application) {
    if (!this.data.job_applications) this.data.job_applications = [];
    const applicantId = this.data.currentUser?.id || 'anonymous';
    const newApp = {
      id: 'app-' + Date.now(),
      job_id: application.job_id,
      applicant_id: applicantId,
      resume_storage_path: application.resume_storage_path || application.resume_s3_key || 'resumes/' + applicantId + '/resume.pdf',
      resume_s3_key: application.resume_storage_path || application.resume_s3_key || 'resumes/' + applicantId + '/resume.pdf',
      resume_filename: application.resume_filename || 'resume.pdf',
      cover_letter: application.cover_letter || '',
      status: 'submitted',
      created_at: new Date().toISOString()
    };
    this.data.job_applications.push(newApp);
    const job = (this.data.jobs || []).find(j => j.id === application.job_id);
    if (job) job.applications_count = (job.applications_count || 0) + 1;
    this.save();
    return newApp;
  }

  getEvents() {
    return (this.data.events || []).map(e => ({ ...e, organizer: this.getProfile(e.organizer_id) }))
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }

  getAnnouncements() {
    return (this.data.announcements || []).map(a => ({ ...a, author: this.getProfile(a.author_id) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getNotifications(userId) {
    return (this.data.notifications || []).filter(n => n.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  markNotificationRead(notifId) {
    const notif = (this.data.notifications || []).find(n => n.id === notifId);
    if (notif) notif.is_read = true;
    this.save();
  }

  markAllNotificationsRead(userId) {
    (this.data.notifications || []).filter(n => n.recipient_id === userId).forEach(n => n.is_read = true);
    this.save();
  }

  getReports() {
    return this.data.reports || [];
  }

  addReport(report) {
    if (!this.data.reports) this.data.reports = [];
    const newRep = {
      id: 'rep-' + Date.now(),
      reporter_id: this.data.currentUser?.id || 'anonymous',
      target_type: report.target_type,
      target_id: report.target_id,
      reason: report.reason,
      details: report.details || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.data.reports.push(newRep);
    this.save();
    return newRep;
  }
}

export const mockStore = new MockStore();
