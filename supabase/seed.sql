-- Seed data from the Release 1 fixtures (fixtures/r1/*.json).
-- Safe to run more than once: fixture rows are updated in place,
-- student-created profiles are never touched.

insert into public.skills (name) values ('Accessibility'),('Blender'),('C#'),('Docker'),('FastAPI'),('Figma'),('JavaScript'),('Machine Learning'),('Maya'),('Meta Quest'),('Node.js'),('OpenXR'),('PostgreSQL'),('Python'),('React'),('RealityKit'),('Shader Development'),('Swift'),('Three.js'),('TypeScript'),('UX Research'),('Unity'),('Vision Pro'),('WebXR') on conflict do nothing;

insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S01','Avery Chen','XR Developer focused on training simulations','Computer Science','current','published',array['internship']::text[],array['Unity','C#','OpenXR']::text[],'{"github": "https://github.com/example-avery"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S02','Maya Patel','3D Artist and technical artist','Computer Science','current','published',array['internship','contract']::text[],array['Blender','Maya','Unity']::text[],'{"github": "https://github.com/example-maya"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S03','Noah Williams','Backend developer for interactive systems','Computer Science','current','published',array['internship']::text[],array['Python','PostgreSQL','FastAPI']::text[],'{"github": "https://github.com/example-noah"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S04','Sofia Martin','Full-stack developer building accessible web apps','Computer Science','current','published',array['internship','full-time']::text[],array['TypeScript','React','PostgreSQL']::text[],'{"github": "https://github.com/example-sofia"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S05','Ethan Brown','Game and XR developer','Computer Science','current','published',array['internship']::text[],array['Unity','C#','Blender']::text[],'{"github": "https://github.com/example-ethan"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S06','Leila Ahmed','UX researcher for immersive learning','Computer Science','current','published',array['internship']::text[],array['UX Research','Figma','Accessibility']::text[],'{"github": "https://github.com/example-leila"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S07','Lucas Tremblay','WebXR and graphics developer','Computer Science','current','published',array['contract']::text[],array['JavaScript','WebXR','Three.js']::text[],'{"github": "https://github.com/example-lucas"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S08','Emma Wilson','XR developer for healthcare applications','Computer Science','current','published',array['internship']::text[],array['Unity','C#','Meta Quest']::text[],'{"github": "https://github.com/example-emma"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S09','Owen Singh','AI and data developer','Computer Science','current','published',array['internship','contract']::text[],array['Python','Machine Learning','FastAPI']::text[],'{"github": "https://github.com/example-owen"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S10','Chloe King','Frontend developer and UI designer','Computer Science','current','published',array['internship']::text[],array['React','TypeScript','Figma']::text[],'{"github": "https://github.com/example-chloe"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S11','Daniel Kim','XR interaction developer','Computer Science','alumni','published',array['full-time']::text[],array['Unity','C#','OpenXR']::text[],'{"github": "https://github.com/example-daniel"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S12','Priya Desai','Technical artist for real-time 3D','Computer Science','alumni','published',array['contract']::text[],array['Blender','Unity','Shader Development']::text[],'{"github": "https://github.com/example-priya"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S13','Benjamin Roy','Cloud and API developer','Computer Science','alumni','published',array['full-time']::text[],array['Node.js','PostgreSQL','Docker']::text[],'{"github": "https://github.com/example-ben"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S14','Grace Li','Mobile and spatial computing developer','Computer Science','current','published',array['internship']::text[],array['Swift','RealityKit','Vision Pro']::text[],'{"github": "https://github.com/example-grace"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S15','Marcus Hill','Interactive media developer','Computer Science','current','published',array['internship']::text[],array['Unity','JavaScript','WebXR']::text[],'{"github": "https://github.com/example-marcus"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S16','Nora Evans','XR developer','Computer Science','current','unpublished',array['internship']::text[],array['Unity','C#']::text[],'{"github": "https://github.com/example-nora"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S17','Samir Haddad','3D developer and researcher','Computer Science','current','published',array['internship']::text[],array['Unity','Blender','C#']::text[],'{"github": "https://github.com/example-samir"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;
insert into public.students (id,name,headline,program,status,profile_status,availability,skills,links,visibility)
values ('S18','Isabella Moore','Accessibility-focused software developer','Computer Science','current','published',array['internship','contract']::text[],array['Accessibility','React','TypeScript']::text[],'{"github": "https://github.com/example-isabella"}'::jsonb,'{"availability":"public","links":"public","location":"public","education":"public","experience":"public"}'::jsonb)
on conflict (id) do update set name=excluded.name,headline=excluded.headline,program=excluded.program,status=excluded.status,profile_status=excluded.profile_status,availability=excluded.availability,skills=excluded.skills,links=excluded.links
where public.students.user_id is null;

insert into public.projects (id,title,description,domain,technologies,links)
values ('P01','Industrial Safety VR Trainer','Immersive safety training prototype for industrial onboarding.','Training / Simulation',array['Unity','C#','Blender']::text[],'{"demo": "https://example.com/p01-demo"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P01','S01','XR Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P01','S02','3D Artist') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P01','S06','UX Researcher') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P02','Campus Service Request Platform','A web platform for tracking campus service requests.','Operations',array['React','TypeScript','FastAPI','PostgreSQL']::text[],'{"repository": "https://github.com/example-org/p02"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P02','S03','Backend Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P02','S04','Frontend Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P02','S13','Cloud/API Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P03','Museum Quest Experience','Quest-based interactive museum exploration.','Cultural Heritage',array['Unity','C#','Meta Quest']::text[],'{"video": "https://example.com/p03-video"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P03','S05','XR Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P03','S11','XR Interaction Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P03','S16','QA Tester') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P04','XR Anatomy Lab','Interactive anatomy learning environment.','Healthcare',array['Unity','C#','OpenXR','Meta Quest']::text[],'{"demo": "https://example.com/p04-demo"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P04','S01','XR Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P04','S08','XR Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P04','S11','Interaction Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P05','Virtual Production Art Pipeline','Real-time asset workflow for immersive production.','Media',array['Unity','Blender','Maya','Shader Development']::text[],'{"repository": "https://github.com/example-org/p05"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P05','S02','Technical Artist') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P05','S12','Technical Artist') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P05','S17','3D Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P06','Accessible Event Discovery','Accessible mobile-first campus event discovery prototype.','Accessibility',array['React','TypeScript','Figma']::text[],'{"demo": "https://example.com/p06-demo"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P06','S04','Frontend Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P06','S06','UX Researcher') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P06','S10','UI Designer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P06','S18','Accessibility Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P07','WebXR Campus Tour','Browser-based spatial campus tour.','Education',array['JavaScript','WebXR','Three.js']::text[],'{"demo": "https://example.invalid/demo"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P07','S07','WebXR Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P07','S15','Interactive Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P08','Partner Insight Dashboard','Dashboard summarizing project and engagement data.','Analytics',array['Python','FastAPI','PostgreSQL','Machine Learning']::text[],'{"repository": "https://github.com/example-org/p08"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P08','S09','AI/Data Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.project_contributors (project_id,student_id,role) values ('P08','S13','Backend Developer') on conflict (project_id,student_id) do update set role=excluded.role;
insert into public.projects (id,title,description,domain,technologies,links)
values ('P09','Spatial Campus Guide','Spatial computing navigation prototype.','Education',array['Swift','RealityKit','Vision Pro']::text[],'{"video": "https://example.com/p09-video"}'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,domain=excluded.domain,technologies=excluded.technologies,links=excluded.links;
insert into public.project_contributors (project_id,student_id,role) values ('P09','S14','Spatial Computing Developer') on conflict (project_id,student_id) do update set role=excluded.role;
