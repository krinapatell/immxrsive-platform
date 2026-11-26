-- Final release: demo examples for reviewers (F.33 - F.38). Safe to run more than once.
-- Fixture projects only; student projects are untouched.

-- P01: a working 3D (WebGL) demo that opens inside the page, in a sandboxed frame.
update public.projects set
  demo_url = 'https://immxrsive-platform.vercel.app/demos/webgl-demo.html',
  demo_type = 'embed', demo_status = 'available', demo_note = '',
  fallback_image_url = 'https://immxrsive-platform.vercel.app/demos/fallback.svg',
  fallback_text = 'A rotating 3D model you can spin with the mouse, a finger or the arrow keys.'
where id = 'P01';

-- P07: a broken build (the page does not exist) set to open inside the page,
-- to show that a failed demo does not break the project page.
update public.projects set
  demo_url = 'https://immxrsive-platform.vercel.app/demos/missing-build.html',
  demo_type = 'embed', demo_status = 'available', demo_note = '',
  fallback_image_url = 'https://immxrsive-platform.vercel.app/demos/fallback.svg',
  fallback_text = 'A browser-based tour of the campus in WebXR. The build is not online, so this preview stands in for it.'
where id = 'P07';

-- P06: an archived demo: no Play button, a note and the preview instead.
update public.projects set
  demo_status = 'archived',
  demo_note = 'The event app was retired after the 2025 pilot.',
  fallback_image_url = 'https://immxrsive-platform.vercel.app/demos/fallback.svg',
  fallback_text = 'Screens from the event discovery app, kept as evidence of the work.'
where id = 'P06';
