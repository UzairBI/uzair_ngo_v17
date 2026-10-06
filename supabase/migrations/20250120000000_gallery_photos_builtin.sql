-- Photo Gallery: the photos that ship with the website become rows too, so the admin panel (Media & Gallery -> Photos)
-- lists every photo of the gallery, group by group, and each one can be re-captioned, moved to another group, hidden or removed.
-- Run this in Supabase SQL Editor after 20250119000000_gallery_photos.sql (safe to run more than once).

-- a photo is now either an uploaded file (https link) or a file of the website itself (/assets/images/...)
alter table gallery_photos drop constraint if exists gallery_photos_image_url_check;
alter table gallery_photos add constraint gallery_photos_image_url_check check (length(image_url) <= 600 and image_url ~ '^(/|https://)');

-- ===== THE PHOTOS ALREADY ON THE WEBSITE =====
-- Added once (only while the table has no website-file photos). Their dates are set in the past, in the order they are
-- shown, so photos uploaded later still come first on the website.
insert into gallery_photos (image_url, caption, category, created_at)
select m.image_url, m.caption, m.category, timestamptz '2020-01-01 00:00:00+00' - (m.n || ' minutes')::interval
from (values
  (1, '/assets/images/field-1.jpg', 'Winter blanket and cloth drive', 'Social Relief'),
  (2, '/assets/images/field-3.jpg', 'Tailoring centre', 'Women Empowerment'),
  (3, '/assets/images/field-6.jpg', 'Health camp', 'Health'),
  (4, '/assets/images/field-9.jpg', 'Learning centre', 'Education'),
  (5, '/assets/images/plantation-campaign.webp', 'Tree plantation campaign', 'Environment'),
  (6, '/assets/images/solar-lantern-forest-edge.jpg', 'Solar lantern and charging panel handed to a family at the forest edge, Sagar district', 'Solar Lantern'),
  (7, '/assets/images/solar-lantern-rahli.jpg', 'Solar lantern distribution in a Rahli-block settlement with no electricity connection', 'Solar Lantern'),
  (8, '/assets/images/solar-lantern-hamlet.jpg', 'A woman receives a solar lantern in a low-lying, flood-prone hamlet', 'Solar Lantern'),
  (9, '/assets/images/solar-lantern-mother-child.jpg', 'A mother holding her young child receives her family''s solar lantern', 'Solar Lantern'),
  (10, '/assets/images/gallery/education/classroom-students-uniform.jpg', 'Students in school uniform attending a classroom session', 'Education'),
  (11, '/assets/images/gallery/education/children-with-books-banner.jpg', 'Children holding books after a learning session at a community centre', 'Education'),
  (12, '/assets/images/gallery/education/children-learning-kits.jpg', 'Children seated with school bags and learning material at a village centre', 'Education'),
  (13, '/assets/images/gallery/education/learning-centre-session.jpg', 'A learning-centre session for children in a village', 'Education'),
  (14, '/assets/images/gallery/education/children-studying-centre.jpg', 'Children studying together at a Sahara learning centre', 'Education'),
  (15, '/assets/images/gallery/education/preschool-children-yellow-uniform.jpg', 'Pre-school children in yellow uniforms at a Sahara education and nutrition centre', 'Education'),
  (16, '/assets/images/gallery/health-nutrition/mother-infant-outreach.jpg', 'A mother holding her infant during a community outreach visit', 'Health'),
  (17, '/assets/images/gallery/health-nutrition/mother-infant-nutrition-centre.jpg', 'A mother with her infant at a community nutrition centre', 'Health'),
  (18, '/assets/images/gallery/health-nutrition/supplies-handover-centre.jpg', 'Supplies being handed over to children and mothers at a Sahara community centre', 'Health'),
  (19, '/assets/images/gallery/health-nutrition/women-children-awareness-session.jpg', 'Women and children gathered for a community awareness session', 'Health'),
  (20, '/assets/images/gallery/health-nutrition/community-distribution-banner.jpg', 'Community gathering with supplies distributed under a Sahara banner', 'Health'),
  (21, '/assets/images/gallery/health-nutrition/child-nutrition-kit-handover.jpg', 'A nutrition kit handed to a mother at the pre-school education and child-nutrition programme', 'Health'),
  (22, '/assets/images/gallery/health-nutrition/child-nutrition-support.jpg', 'Supplementary nutrition handed to a child at the pre-school education and nutrition programme', 'Health'),
  (23, '/assets/images/gallery/health-nutrition/mothers-children-centre.jpg', 'Mothers and young children at a Sahara centre', 'Health'),
  (24, '/assets/images/gallery/health-nutrition/women-session-centre.jpg', 'Women attending a health and nutrition awareness session at a Sahara centre', 'Health'),
  (25, '/assets/images/gallery/health-nutrition/health-checkup-bp.jpg', 'Blood-pressure check at a community health camp', 'Health'),
  (26, '/assets/images/gallery/health-nutrition/menstrual-hygiene-inauguration.jpg', 'A student addressing the inauguration of the menstrual-hygiene programme with KONE', 'Health'),
  (27, '/assets/images/gallery/health-nutrition/sanitary-vending-machine-school-1.jpg', 'A student using a sanitary pad vending machine installed in her school', 'Health'),
  (28, '/assets/images/gallery/health-nutrition/sanitary-vending-machine-school-2.jpg', 'Sanitary pad vending machine at a government school, part of the KONE partnership', 'Health'),
  (29, '/assets/images/gallery/social-relief/ration-kits-distribution.jpg', 'Ration kits laid out for distribution to families, with children seated in front', 'Social Relief'),
  (30, '/assets/images/gallery/social-relief/ration-clothes-tribal-women.jpg', 'Ration and clothes distribution for tribal women', 'Social Relief'),
  (31, '/assets/images/gallery/skill-development/kaushal-workshop-group.jpg', 'Project Kaushal: students and trainers after a job-readiness workshop', 'Skill Development'),
  (32, '/assets/images/gallery/skill-development/kaushal-training-hall.jpg', 'Project Kaushal: participants standing for a group activity in a training hall', 'Skill Development'),
  (33, '/assets/images/gallery/skill-development/kaushal-college-group-photo.jpg', 'Project Kaushal: college batch group photo', 'Skill Development'),
  (34, '/assets/images/gallery/skill-development/kaushal-batch-courtyard.jpg', 'Project Kaushal: batch photo with trainers on a college campus', 'Skill Development'),
  (35, '/assets/images/gallery/skill-development/kaushal-group-activity.jpg', 'Project Kaushal: group activity during a training session', 'Skill Development'),
  (36, '/assets/images/gallery/skill-development/kaushal-circle-activity.jpg', 'Project Kaushal: students taking part in a circle activity', 'Skill Development'),
  (37, '/assets/images/gallery/skill-development/kaushal-team-after-session.jpg', 'Project Kaushal: trainers and volunteers together after a session', 'Skill Development'),
  (38, '/assets/images/gallery/skill-development/kaushal-trainer-speaking.jpg', 'Project Kaushal: a trainer addressing students', 'Skill Development'),
  (39, '/assets/images/gallery/skill-development/kaushal-student-presentation.jpg', 'Project Kaushal: students presenting during a session', 'Skill Development'),
  (40, '/assets/images/gallery/skill-development/kaushal-campus-batch.jpg', 'Project Kaushal: training batch assembled in a college courtyard', 'Skill Development'),
  (41, '/assets/images/gallery/skill-development/kaushal-hall-group-photo.jpg', 'Project Kaushal: participants and faculty group photo in a hall', 'Skill Development'),
  (42, '/assets/images/gallery/csr-volunteering/sap-volunteers-group.jpg', 'SAP Labs volunteer team at a community volunteering session', 'CSR & Volunteering'),
  (43, '/assets/images/gallery/csr-volunteering/sap-volunteer-with-students.jpg', 'A SAP Labs volunteer with school children holding craft items', 'CSR & Volunteering'),
  (44, '/assets/images/gallery/csr-volunteering/sap-volunteering-activity.jpg', 'SAP Labs volunteers on a hands-on activity with children', 'CSR & Volunteering'),
  (45, '/assets/images/gallery/csr-volunteering/sap-volunteers-workshop.jpg', 'SAP Labs volunteers running a hands-on workshop', 'CSR & Volunteering')
) as m(n, image_url, caption, category)
where not exists (select 1 from gallery_photos where image_url like '/%');
