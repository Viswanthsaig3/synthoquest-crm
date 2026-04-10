-- Migration 021: Extend Lead Types Table

-- Add additional columns to lead_types table
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'FileText';
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#6b7280';
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS conversion_target VARCHAR(50) DEFAULT 'none';
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS approver_roles JSONB DEFAULT '[]';
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS assign_to_roles JSONB DEFAULT '[]';
ALTER TABLE lead_types ADD COLUMN IF NOT EXISTS created_by UUID;

-- Update existing lead types with proper configuration
UPDATE lead_types SET 
  icon = 'GraduationCap',
  color = '#3b82f6',
  is_system = true,
  conversion_target = 'student',
  approval_required = false,
  assign_to_roles = '["sales_rep", "team_lead"]',
  fields = '[
    {"id":"sf_course","name":"courseInterested","label":"Course Interested","type":"select","placeholder":"Select course","required":true,"options":[{"value":"Cyber Security Fundamentals","label":"Cyber Security Fundamentals"},{"value":"Ethical Hacking","label":"Ethical Hacking"},{"value":"Penetration Testing","label":"Penetration Testing"},{"value":"Network Security","label":"Network Security"},{"value":"Cloud Security","label":"Cloud Security"},{"value":"Incident Response","label":"Incident Response"},{"value":"Security Analytics","label":"Security Analytics"},{"value":"CompTIA Security+","label":"CompTIA Security+"},{"value":"CISSP Preparation","label":"CISSP Preparation"},{"value":"CEH Certification","label":"CEH Certification"}],"order":1},
    {"id":"sf_batch_pref","name":"batchPreference","label":"Batch Preference","type":"select","placeholder":"Select preference","required":false,"options":[{"value":"weekday","label":"Weekday Batch"},{"value":"weekend","label":"Weekend Batch"},{"value":"online","label":"Online Only"},{"value":"flexible","label":"Flexible"}],"order":2},
    {"id":"sf_experience","name":"experience","label":"Years of Experience","type":"select","placeholder":"Select experience","required":false,"options":[{"value":"0","label":"Fresher"},{"value":"1-2","label":"1-2 years"},{"value":"3-5","label":"3-5 years"},{"value":"5+","label":"5+ years"}],"order":3},
    {"id":"sf_company","name":"currentCompany","label":"Current Company","type":"text","placeholder":"Enter current company","required":false,"order":4},
    {"id":"sf_objective","name":"learningObjective","label":"Learning Objective","type":"textarea","placeholder":"What do you want to achieve from this course?","required":false,"order":5}
  ]',
  statuses = '[
    {"id":"ss_new","value":"new","label":"New","color":"blue","order":1,"isInitial":true},
    {"id":"ss_contacted","value":"contacted","label":"Contacted","color":"purple","order":2,"allowedTransitions":["follow_up","qualified","lost"]},
    {"id":"ss_followup","value":"follow_up","label":"Follow Up","color":"orange","order":3,"allowedTransitions":["qualified","lost"]},
    {"id":"ss_qualified","value":"qualified","label":"Qualified","color":"cyan","order":4,"allowedTransitions":["converted","lost"]},
    {"id":"ss_converted","value":"converted","label":"Converted","color":"green","order":5,"isFinal":true},
    {"id":"ss_lost","value":"lost","label":"Lost","color":"red","order":6,"isFinal":true}
  ]',
  sources = '[
    {"id":"ss_ads","value":"ads","label":"Google Ads","description":"Paid advertising campaigns"},
    {"id":"ss_referral","value":"referral","label":"Referral","description":"Referred by existing student or employee"},
    {"id":"ss_organic","value":"organic","label":"Organic Search","description":"Found through search engines"},
    {"id":"ss_social","value":"social","label":"Social Media","description":"From social media platforms"},
    {"id":"ss_event","value":"event","label":"Event/Webinar","description":"Attended an event or webinar"}
  ]'
WHERE slug = 'student';

UPDATE lead_types SET 
  icon = 'Briefcase',
  color = '#10b981',
  is_system = true,
  conversion_target = 'intern',
  approval_required = true,
  approver_roles = '["hr"]',
  assign_to_roles = '["hr", "team_lead"]',
  fields = '[
    {"id":"if_internship_type","name":"internshipType","label":"Internship Type","type":"select","placeholder":"Select type","required":true,"options":[{"value":"paid","label":"Paid Internship"},{"value":"unpaid","label":"Unpaid Internship"}],"order":1},
    {"id":"if_duration","name":"duration","label":"Preferred Duration","type":"select","placeholder":"Select duration","required":true,"options":[{"value":"1_month","label":"1 Month"},{"value":"2_months","label":"2 Months"},{"value":"3_months","label":"3 Months"}],"order":2},
    {"id":"if_department","name":"department","label":"Department Interest","type":"select","placeholder":"Select department","required":true,"options":[{"value":"training","label":"Training"},{"value":"sales","label":"Sales"},{"value":"marketing","label":"Marketing"},{"value":"content","label":"Content Development"}],"order":3},
    {"id":"if_college","name":"college","label":"College/University","type":"text","placeholder":"Enter college name","required":true,"order":4},
    {"id":"if_degree","name":"degree","label":"Degree/Course","type":"text","placeholder":"e.g., B.Tech Computer Science","required":true,"order":5},
    {"id":"if_year","name":"year","label":"Current Year","type":"select","placeholder":"Select year","required":true,"options":[{"value":"1","label":"1st Year"},{"value":"2","label":"2nd Year"},{"value":"3","label":"3rd Year"},{"value":"4","label":"4th Year"},{"value":"passed","label":"Passed Out"}],"order":6},
    {"id":"if_skills","name":"skills","label":"Skills","type":"text","placeholder":"e.g., Python, Networking, Linux","required":false,"order":7},
    {"id":"if_resume","name":"resumeUrl","label":"Resume URL","type":"url","placeholder":"https://drive.google.com/...","required":false,"order":8},
    {"id":"if_linkedin","name":"linkedinUrl","label":"LinkedIn Profile","type":"url","placeholder":"https://linkedin.com/in/...","required":false,"order":9},
    {"id":"if_portfolio","name":"portfolioUrl","label":"Portfolio/GitHub","type":"url","placeholder":"https://github.com/...","required":false,"order":10},
    {"id":"if_availability","name":"availability","label":"Start Date Availability","type":"date","required":false,"order":11},
    {"id":"if_cover_letter","name":"coverLetter","label":"Cover Letter / Why You?","type":"textarea","placeholder":"Tell us why you want to intern with us...","required":false,"order":12}
  ]',
  statuses = '[
    {"id":"is_applied","value":"applied","label":"Applied","color":"blue","order":1,"isInitial":true},
    {"id":"is_shortlisted","value":"shortlisted","label":"Shortlisted","color":"purple","order":2,"allowedTransitions":["offered","rejected"]},
    {"id":"is_offered","value":"offered","label":"Offered","color":"orange","order":3,"allowedTransitions":["active","rejected"]},
    {"id":"is_active","value":"active","label":"Active","color":"green","order":4,"allowedTransitions":["completed","dropped"]},
    {"id":"is_completed","value":"completed","label":"Completed","color":"teal","order":5,"isFinal":true},
    {"id":"is_dropped","value":"dropped","label":"Dropped","color":"gray","order":6,"isFinal":true},
    {"id":"is_rejected","value":"rejected","label":"Rejected","color":"red","order":7,"isFinal":true}
  ]',
  sources = '[
    {"id":"is_website","value":"website","label":"Website Application","description":"Applied through company website"},
    {"id":"is_campus","value":"campus","label":"Campus Drive","description":"From campus placement drive"},
    {"id":"is_job_portal","value":"job_portal","label":"Job Portal","description":"LinkedIn, Indeed, etc."},
    {"id":"is_referral","value":"referral","label":"Referral","description":"Referred by employee or student"}
  ]'
WHERE slug = 'intern';

-- Add foreign key for created_by if users table exists
ALTER TABLE lead_types DROP CONSTRAINT IF EXISTS fk_lead_types_created_by;
ALTER TABLE lead_types ADD CONSTRAINT fk_lead_types_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN lead_types.icon IS 'Icon name from lucide-react icons';
COMMENT ON COLUMN lead_types.color IS 'Hex color code for the lead type';
COMMENT ON COLUMN lead_types.is_system IS 'System lead types cannot be deleted';
COMMENT ON COLUMN lead_types.conversion_target IS 'Target entity when lead is converted';
COMMENT ON COLUMN lead_types.approval_required IS 'Whether conversion requires approval';
COMMENT ON COLUMN lead_types.approver_roles IS 'Roles that can approve conversion';
COMMENT ON COLUMN lead_types.assign_to_roles IS 'Roles that can be assigned this lead type';