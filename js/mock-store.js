/**
 * Dharashiv Foundation - Demonstration & Development Mock Store
 * Provides realistic localized data from Dharashiv district for testing
 * when live Supabase credentials have not yet been provisioned.
 * Persists in browser localStorage.
 */

const STORAGE_KEY = 'dharashiv_mock_db_v1';

const INITIAL_DATA = {
  currentUser: {
    id: 'user-001',
    email: 'swapnil.patil@dharashiv.org',
    full_name: 'Swapnil Patil',
    avatar_url: '/assets/avatars/avatar-1.svg',
    native_village: 'Yedshi',
    taluka: 'Dharashiv',
    district: 'Dharashiv',
    current_city: 'Dharashiv',
    profession: 'Business Owner / Entrepreneur',
    company_name: 'Marathwada Cloud Solutions',
    business_category: 'Information Technology & Software',
    business_type: 'Private Limited',
    business_description: 'Building regional cloud infrastructure, IoT solutions for dairy & farm automation, and web applications.',
    services_offered: 'Cloud Migration, Web Development, Supabase Architecture, IoT Automation',
    networking_interests: ['Hiring', 'B2B Clients', 'Mentorship', 'Tech Collaboration'],
    website_url: 'https://marathwadacloud.com',
    linkedin_url: 'https://linkedin.com/in/swapnil-patil',
    role: 'admin',
    is_active: true,
    is_profile_completed: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },

  profiles: [
    {
      id: 'user-001',
      email: 'swapnil.patil@dharashiv.org',
      full_name: 'Swapnil Patil',
      avatar_url: '/assets/avatars/avatar-1.svg',
      native_village: 'Yedshi',
      taluka: 'Dharashiv',
      district: 'Dharashiv',
      current_city: 'Dharashiv',
      profession: 'Business Owner / Entrepreneur',
      company_name: 'Marathwada Cloud Solutions',
      business_category: 'Information Technology & Software',
      business_type: 'Private Limited',
      business_description: 'Building regional cloud infrastructure and web solutions.',
      services_offered: 'Cloud Architecture, Web Development',
      networking_interests: ['Hiring', 'B2B Clients', 'Mentorship'],
      website_url: 'https://marathwadacloud.com',
      linkedin_url: 'https://linkedin.com/in/swapnil-patil',
      role: 'admin',
      is_active: true,
      is_profile_completed: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'user-002',
      email: 'pooja.deshmukh@tuljafarms.in',
      full_name: 'Pooja Deshmukh',
      avatar_url: '/assets/avatars/avatar-2.svg',
      native_village: 'Kati',
      taluka: 'Tuljapur',
      district: 'Dharashiv',
      current_city: 'Tuljapur',
      profession: 'Business Owner / Entrepreneur',
      company_name: 'Tuljabhavani Agro Organics',
      business_category: 'Agriculture & Agri-Tech',
      business_type: 'FPO / Enterprise',
      business_description: 'Organic pulse processing, cold-pressed oils, and export-grade pomegranate farming.',
      services_offered: 'Contract Organic Farming, Cold Storage Logistics, Bio-Fertilizers',
      networking_interests: ['B2B Clients', 'Funding', 'Retail Distribution'],
      website_url: 'https://tuljafarms.in',
      linkedin_url: 'https://linkedin.com/in/pooja-deshmukh-agro',
      role: 'member',
      is_active: true,
      is_profile_completed: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'user-003',
      email: 'dr.shinde@omergahealth.com',
      full_name: 'Dr. Ramesh Shinde',
      avatar_url: '/assets/avatars/avatar-3.svg',
      native_village: 'Murum',
      taluka: 'Omerga',
      district: 'Dharashiv',
      current_city: 'Omerga',
      profession: 'Doctor / Healthcare',
      company_name: 'Shinde Multispecialty & Diagnostic Clinic',
      business_category: 'Healthcare & Pharmaceuticals',
      business_type: 'Healthcare Clinic',
      business_description: 'Comprehensive diagnostic laboratory, telemedicine services, and primary healthcare in Omerga and border regions.',
      services_offered: 'Diagnostics, Tele-Consultation, Preventive Health Checks',
      networking_interests: ['Healthcare Collaboration', 'Medical Tech', 'Community Health Camps'],
      website_url: 'https://omergahealth.com',
      linkedin_url: 'https://linkedin.com/in/dr-ramesh-shinde',
      role: 'member',
      is_active: true,
      is_profile_completed: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'user-004',
      email: 'aniket.kadam@parandasolar.in',
      full_name: 'Aniket Kadam',
      avatar_url: '/assets/avatars/avatar-4.svg',
      native_village: 'Domgaon',
      taluka: 'Paranda',
      district: 'Dharashiv',
      current_city: 'Paranda',
      profession: 'Business Owner / Entrepreneur',
      company_name: 'Sina Valley Solar Solutions',
      business_category: 'Renewable Energy & Solar',
      business_type: 'Proprietorship',
      business_description: 'Solar agricultural pumps, residential rooftop PV systems, and microgrid engineering across Bhoom and Paranda.',
      services_offered: 'Solar Pump Installation, Energy Audits, Rooftop Solar Maintenance',
      networking_interests: ['Govt Subsidies', 'Vendor Partnerships', 'Farmer Outreach'],
      website_url: 'https://sinasolar.in',
      linkedin_url: 'https://linkedin.com/in/aniket-kadam-solar',
      role: 'member',
      is_active: true,
      is_profile_completed: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ],

  posts: [
    {
      id: 'post-101',
      author_id: 'user-002',
      content: 'Excited to announce our new Organic Pulse Processing unit in Tuljapur! 🌾\nThrough this project, over 120 local farming families across Kati and Mangrul will get fair market pricing and direct procurement. Looking for local distribution partners across Dharashiv and Solapur.',
      category: 'Agriculture & Agri-Tech',
      likes_count: 14,
      comments_count: 3,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      liked_by: ['user-001', 'user-003', 'user-004']
    },
    {
      id: 'post-102',
      author_id: 'user-004',
      content: 'Completed the installation of 45 Solar Agricultural pumps in Paranda and Bhoom talukas this month under the PM-KUSUM initiative! ⚡☀️\nClean, reliable daytime power is transforming farm irrigation in our drought-prone zones.',
      category: 'Renewable Energy & Solar',
      likes_count: 19,
      comments_count: 5,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      liked_by: ['user-001', 'user-002']
    },
    {
      id: 'post-103',
      author_id: 'user-001',
      content: 'Welcoming all members to the new Dharashiv Foundation Cloud Network! 🚀\nOur mission is connecting entrepreneurs, professionals, and youth across all 8 talukas to accelerate regional economic growth and job creation.',
      category: 'General',
      likes_count: 28,
      comments_count: 6,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      liked_by: ['user-002', 'user-003', 'user-004']
    }
  ],

  comments: [
    {
      id: 'comment-201',
      post_id: 'post-101',
      author_id: 'user-001',
      content: 'Congratulations Pooja! Wonderful initiative. We would love to help connect you with retail networks in Dharashiv MIDC.',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString()
    },
    {
      id: 'comment-202',
      post_id: 'post-101',
      author_id: 'user-003',
      content: 'Great work! Organic nutrition is crucial for regional health. Best wishes!',
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    }
  ],

  connections: [
    {
      id: 'conn-001',
      requester_id: 'user-002',
      recipient_id: 'user-001',
      status: 'accepted',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'conn-002',
      requester_id: 'user-003',
      recipient_id: 'user-001',
      status: 'accepted',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 'conn-003',
      requester_id: 'user-004',
      recipient_id: 'user-001',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],

  conversations: [
    {
      id: 'conv-001',
      participants: ['user-001', 'user-002'],
      updated_at: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ],

  messages: [
    {
      id: 'msg-001',
      conversation_id: 'conv-001',
      sender_id: 'user-002',
      content: 'Hello Swapnil, regarding the cloud automation for our grain warehouse, when can we schedule a demo?',
      is_read: true,
      created_at: new Date(Date.now() - 60 * 60000).toISOString()
    },
    {
      id: 'msg-002',
      conversation_id: 'conv-001',
      sender_id: 'user-001',
      content: 'Hi Pooja! We can review the architecture this Thursday at 4 PM. I will share the presentation deck.',
      is_read: true,
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ],

  jobs: [
    {
      id: 'job-301',
      poster_id: 'user-001',
      title: 'Cloud & Full-Stack Web Developer',
      company_name: 'Marathwada Cloud Solutions',
      taluka: 'Dharashiv',
      location: 'Dharashiv MIDC / Hybrid',
      job_type: 'Full-time',
      category: 'Information Technology & Software',
      description: 'Looking for an enthusiastic engineer skilled in Cloud computing, JavaScript, PostgreSQL, and Supabase architectures to build regional community platforms.',
      requirements: 'Experience with REST APIs, SQL databases, Git, and responsive web design. Candidates from Dharashiv district preferred.',
      salary_range: '₹4,50,000 - ₹7,00,000 / year',
      status: 'active',
      applications_count: 3,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'job-302',
      poster_id: 'user-002',
      title: 'Agri-Processing Field Operations Lead',
      company_name: 'Tuljabhavani Agro Organics',
      taluka: 'Tuljapur',
      location: 'Tuljapur (On-site)',
      job_type: 'Full-time',
      category: 'Agriculture & Agri-Tech',
      description: 'Manage procurement logistics, quality checks for organic pulses, and warehouse stock control across farming clusters.',
      requirements: 'Degree in Agriculture / B.Sc or relevant diploma. Strong communication skills in Marathi and Hindi.',
      salary_range: '₹3,00,000 - ₹4,80,000 / year',
      status: 'active',
      applications_count: 5,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'job-303',
      poster_id: 'user-004',
      title: 'Solar System Technician & Site Engineer',
      company_name: 'Sina Valley Solar Solutions',
      taluka: 'Paranda',
      location: 'Paranda & Bhoom',
      job_type: 'Full-time',
      category: 'Renewable Energy & Solar',
      description: 'Perform field site surveys, solar pump installations, PV inverter wiring, and customer warranty support.',
      requirements: 'ITI Electrical / Diploma in Electrical Engineering. Two-wheeler driving license required.',
      salary_range: '₹2,40,000 - ₹3,60,000 / year',
      status: 'active',
      applications_count: 2,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ],

  job_applications: [
    {
      id: 'app-401',
      job_id: 'job-301',
      applicant_id: 'user-003',
      resume_storage_path: 'resumes/user-003/sample-resume.pdf',
      resume_s3_key: 'resumes/user-003/sample-resume.pdf',
      resume_filename: 'Ramesh_Shinde_Resume.pdf',
      cover_letter: 'Applying on behalf of health informatics consulting collaboration.',
      status: 'shortlisted',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ],

  events: [
    {
      id: 'evt-501',
      organizer_id: 'user-001',
      title: 'Dharashiv District Agri & Tech Innovation Summit 2026',
      description: 'Annual gathering of regional business founders, farmer producer companies, angel investors, and youth innovators.',
      event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      venue: 'Town Hall Auditorium, Dharashiv',
      taluka: 'Dharashiv',
      category: 'Business & Networking',
      capacity: 350,
      attendees_count: 142,
      status: 'upcoming'
    },
    {
      id: 'evt-502',
      organizer_id: 'user-002',
      title: 'Tuljapur Organic Farmers & Exporters Workshop',
      description: 'Hands-on training session on APEDA export certifications, packaging standards, and cold chain finance.',
      event_date: new Date(Date.now() + 21 * 86400000).toISOString(),
      venue: 'APMC Market Yard Hall, Tuljapur',
      taluka: 'Tuljapur',
      category: 'Agriculture & Agri-Tech',
      capacity: 150,
      attendees_count: 88,
      status: 'upcoming'
    }
  ],

  announcements: [
    {
      id: 'ann-601',
      author_id: 'user-001',
      title: 'Official Launch of Dharashiv Foundation Digital Network',
      content: 'We are proud to introduce our cloud-powered community network connecting all eight talukas. Members can now discover businesses, recruit local talent, and collaborate on regional initiatives.',
      priority: 'high',
      status: 'approved',
      is_official: true,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'ann-602',
      author_id: 'user-002',
      title: 'District Subsidies Available for Solar Drip Irrigation',
      content: 'Farmers and agri-enterprises in Dharashiv and Tuljapur can apply for 80% subsidy slots before the 15th of next month.',
      priority: 'normal',
      status: 'approved',
      is_official: false,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    }
  ],

  notifications: [
    {
      id: 'notif-701',
      recipient_id: 'user-001',
      actor_id: 'user-004',
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Aniket Kadam sent you a networking connection request.',
      link_url: '/connections.html',
      is_read: false,
      created_at: new Date(Date.now() - 1 * 3600000).toISOString()
    },
    {
      id: 'notif-702',
      recipient_id: 'user-001',
      actor_id: 'user-002',
      type: 'post_like',
      title: 'New Like on your post',
      message: 'Pooja Deshmukh liked your community welcome post.',
      link_url: '/feed.html?post=post-103',
      is_read: true,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ],

  reports: [
    {
      id: 'rep-801',
      reporter_id: 'user-003',
      target_type: 'post',
      target_id: 'post-101',
      reason: 'Testing moderation queue functionality',
      details: 'Demonstrating content flag workflow for the cloud computing jury review.',
      status: 'pending',
      created_at: new Date(Date.now() - 5 * 3600000).toISOString()
    }
  ]
};

export class MockStore {
  constructor() {
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      }
    } catch {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }

  getCurrentUser() {
    return this.data.currentUser;
  }

  setCurrentUser(user) {
    this.data.currentUser = user;
    this.save();
  }

  getProfiles() {
    return this.data.profiles;
  }

  getProfile(id) {
    return this.data.profiles.find(p => p.id === id) || (this.data.currentUser.id === id ? this.data.currentUser : null);
  }

  updateProfile(id, updates) {
    const idx = this.data.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.profiles[idx] = { ...this.data.profiles[idx], ...updates, updated_at: new Date().toISOString() };
    }
    if (this.data.currentUser && this.data.currentUser.id === id) {
      this.data.currentUser = { ...this.data.currentUser, ...updates, updated_at: new Date().toISOString() };
    }
    this.save();
    return this.getProfile(id);
  }

  getPosts() {
    return this.data.posts.map(post => {
      const author = this.getProfile(post.author_id);
      return { ...post, author };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addPost(post) {
    const newPost = {
      id: 'post-' + Date.now(),
      author_id: this.data.currentUser.id,
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
    this.data.posts = this.data.posts.filter(p => p.id !== postId);
    this.data.comments = this.data.comments.filter(c => c.post_id !== postId);
    this.save();
  }

  toggleLike(postId) {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) return null;
    const userId = this.data.currentUser.id;
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
    return this.data.comments
      .filter(c => c.post_id === postId)
      .map(c => ({ ...c, author: this.getProfile(c.author_id) }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  addComment(postId, content) {
    const newComment = {
      id: 'comment-' + Date.now(),
      post_id: postId,
      author_id: this.data.currentUser.id,
      content,
      created_at: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    const post = this.data.posts.find(p => p.id === postId);
    if (post) post.comments_count += 1;
    this.save();
    return { ...newComment, author: this.getCurrentUser() };
  }

  getConnections(userId) {
    return this.data.connections.filter(c => c.requester_id === userId || c.recipient_id === userId);
  }

  updateConnectionStatus(connId, status) {
    const conn = this.data.connections.find(c => c.id === connId);
    if (conn) {
      conn.status = status;
      this.save();
    }
    return conn;
  }

  createConnection(requesterId, recipientId) {
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
    return this.data.jobs.map(j => ({ ...j, poster: this.getProfile(j.poster_id) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addJob(job) {
    const newJob = {
      id: 'job-' + Date.now(),
      poster_id: this.data.currentUser.id,
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
    return this.data.job_applications.filter(a => {
      if (jobId && a.job_id !== jobId) return false;
      if (applicantId && a.applicant_id !== applicantId) return false;
      return true;
    }).map(a => {
      const job = this.data.jobs.find(j => j.id === a.job_id);
      const applicant = this.getProfile(a.applicant_id);
      return { ...a, job, applicant };
    });
  }

  addApplication(application) {
    const newApp = {
      id: 'app-' + Date.now(),
      job_id: application.job_id,
      applicant_id: this.data.currentUser.id,
      resume_storage_path: application.resume_storage_path || application.resume_s3_key || 'resumes/' + this.data.currentUser.id + '/resume.pdf',
      resume_s3_key: application.resume_storage_path || application.resume_s3_key || 'resumes/' + this.data.currentUser.id + '/resume.pdf',
      resume_filename: application.resume_filename || 'resume.pdf',
      cover_letter: application.cover_letter || '',
      status: 'submitted',
      created_at: new Date().toISOString()
    };
    this.data.job_applications.push(newApp);
    const job = this.data.jobs.find(j => j.id === application.job_id);
    if (job) job.applications_count += 1;
    this.save();
    return newApp;
  }

  getEvents() {
    return this.data.events.map(e => ({ ...e, organizer: this.getProfile(e.organizer_id) }))
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }

  getAnnouncements() {
    return this.data.announcements.map(a => ({ ...a, author: this.getProfile(a.author_id) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getNotifications(userId) {
    return this.data.notifications.filter(n => n.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  markNotificationRead(notifId) {
    const notif = this.data.notifications.find(n => n.id === notifId);
    if (notif) notif.is_read = true;
    this.save();
  }

  markAllNotificationsRead(userId) {
    this.data.notifications.filter(n => n.recipient_id === userId).forEach(n => n.is_read = true);
    this.save();
  }

  getReports() {
    return this.data.reports;
  }

  addReport(report) {
    const newRep = {
      id: 'rep-' + Date.now(),
      reporter_id: this.data.currentUser.id,
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
