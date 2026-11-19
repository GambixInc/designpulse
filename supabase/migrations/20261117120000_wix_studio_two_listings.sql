-- Wix Studio Two templates: ten first-party listings (Girder, Meridian,
-- Ledgerly, Hearth, Velour, Brightline, Parlour & Co, Atelier Nine, Aperture,
-- Stackwise) at $79 Standard / $299 Extended. They go in as drafts with no
-- delivery. Before an admin publishes one with admin_publish_asset:
--   1. store the template's Wix "Use this template" link in asset_packages
--      from the Supabase SQL Editor (never in this public repo); without it
--      admin_publish_asset refuses the asset;
--   2. check that demo_url still loads: the gambixa.wixstudio.com demos below
--      were all live on 2026-11-19;
--   3. add the four preview images under public/previews/<slug>/.
-- The Studio Two access requirement and the shop and booking limits are in the
-- description, because the Compatibility tab is not shown by default. Every
-- compatibility value is a flat string or array of strings: the product page
-- renders String(v) or v.join(", "). Ratings and sales start at zero. Each
-- listing is skipped when its slug already exists, so the file is safe to run
-- twice.

-- Stop instead of silently inserting nothing if the category is missing.
do $$
begin
  if not exists (select 1 from public.categories where slug = 'wix-studio') then
    raise exception 'Category wix-studio not found';
  end if;
end;
$$;

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Girder: Construction Company Wix Studio Two Template', 'girder-construction',
    'Girder is a Wix Studio Two template for general contractors, civil works firms and commercial builders. Heavy Archivo headings and Inter body text sit on a charcoal and safety orange palette.

It has five pages: Home, Projects, Services, About and Contact. Home moves from a full-width hero through a stats band, four numbered services, recent projects, a safety section, a four-step process and client quotes to a closing call to action. Projects shows six captioned projects. Services has six service cards and a preconstruction section. About covers the company story, key figures and a three-person leadership team. Contact pairs office details with an FAQ.

Built-in Wix app: Wix Forms, with a bid request form on the Contact page.

Good to know: the template opens in Wix Studio Two, which Wix is rolling out to Wix Partners first, so check that your Wix account has Studio Two access before you buy. Names, figures, quotes and contact details are fictional samples, and the photos are Pexels stock placeholders. Replace them with your own before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Projects, Services, About, Contact', 'Wix Forms bid request form on the Contact page', 'Projects gallery with six captioned projects', 'Six service cards and a preconstruction section', 'Stats bands, a four-step process and a client quotes section', 'Leadership team section with three profiles', 'FAQ section on the Contact page', 'Archivo and Inter type on a charcoal and orange palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Projects", "Services", "About", "Contact"], "apps": ["Wix Forms (bid request form)"], "fonts": ["Archivo (headings)", "Inter (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/girder', 'draft', true, false,
    array['/previews/girder-construction/cover.jpg', '/previews/girder-construction/gallery.jpg', '/previews/girder-construction/process.jpg', '/previews/girder-construction/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'girder-construction')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Meridian: Consulting Firm Wix Studio Two Template', 'meridian-consulting',
    'Meridian is a Wix Studio Two template for management consultancies, advisory firms and professional services practices. Manrope headings, Inter body text and a deep navy palette with a teal accent give it a calm, corporate feel.

It has five pages: Home, Services, About, Insights and Contact. Home has a split hero, a client name strip, three practice cards, a featured client quote, stats, a four-stage process, an FAQ and a call to action. Services lists five practices and three engagement models. About covers the firm story, three principles and a four-partner team. Insights shows a featured briefing and six article cards. Contact lists three offices and an FAQ.

Built-in Wix app: Wix Forms, with a contact enquiry form on the Contact page.

Good to know: the template opens in Wix Studio Two, which Wix is rolling out to Wix Partners first, so check that your Wix account has Studio Two access before you buy. Names, figures, quotes and contact details are fictional samples, and the photos are Pexels stock placeholders. Replace them with your own before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Services, About, Insights, Contact', 'Wix Forms contact enquiry form on the Contact page', 'Three practice cards and five numbered service rows', 'Three engagement model cards', 'Insights page with a featured briefing and six article cards', 'Partner team section with four profiles', 'Office cards for three locations and two FAQ sections', 'Manrope and Inter type on a navy and teal palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Services", "About", "Insights", "Contact"], "apps": ["Wix Forms (contact enquiry form)"], "fonts": ["Manrope (headings)", "Inter (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/meridian', 'draft', true, false,
    array['/previews/meridian-consulting/cover.jpg', '/previews/meridian-consulting/gallery.jpg', '/previews/meridian-consulting/process.jpg', '/previews/meridian-consulting/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'meridian-consulting')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Ledgerly: Financial Advisor Wix Studio Two Template', 'ledgerly-financial-advisor',
    'Ledgerly is a Wix Studio Two template for independent financial planners, fee-only advisers and small wealth management practices. Playfair Display headings and DM Sans body text sit on a cream, forest green and gold palette.

It has five pages: Home, Services, About, Fees and Contact. Home has a centred hero, stats, an adviser profile, four numbered services, three pricing plans, client quotes, an FAQ and a call to action. Services shows six service cards, a retirement income section and a four-step process. About covers the practice story and a three-person team. Fees adds fixed-price services, a worked fee example and a fee FAQ.

Built-in Wix app: Wix Forms, with a free introduction request form on the Contact page.

Good to know: the template opens in Wix Studio Two, which Wix is rolling out to Wix Partners first, so check that your Wix account has Studio Two access before you buy. Names, figures, quotes and contact details are fictional samples, and the photos are Pexels stock placeholders. Replace them with your own before you publish. The footer disclosure is sample wording, so use the disclosures your firm must show. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Services, About, Fees, Contact', 'Wix Forms free introduction request form on the Contact page', 'Three-plan pricing section on Home and Fees', 'Fixed-price services and a worked fee example', 'Adviser profile and a three-person team section', 'Six service cards and a four-step process', 'Bordered FAQ sections on Home, Fees and Contact', 'Playfair Display and DM Sans type on a cream, green and gold palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Services", "About", "Fees", "Contact"], "apps": ["Wix Forms (free introduction request form)"], "fonts": ["Playfair Display (headings)", "DM Sans (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/ledgerly', 'draft', true, false,
    array['/previews/ledgerly-financial-advisor/cover.jpg', '/previews/ledgerly-financial-advisor/gallery.jpg', '/previews/ledgerly-financial-advisor/process.jpg', '/previews/ledgerly-financial-advisor/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'ledgerly-financial-advisor')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Hearth: Furniture Store Wix Studio Two Template', 'hearth-furniture-store',
    'Hearth is a Wix Studio Two template for furniture makers, homeware brands and interior shops. Work Sans type, warm white backgrounds, a terracotta accent and rounded corners keep it soft and natural.

It has five pages: Home, Shop, Collections, About and Contact, plus the Wix Stores product page. Home has a two-image hero, a new arrivals grid, a materials section, shop-by-room tiles, customer promises and a quote. Shop shows every product in a live grid. Collections has six room settings and a styling service section.

Built-in Wix apps: Wix Stores with 8 sample products, and Wix Forms with a customer enquiry form.

Good to know: product pages and the cart work on the live demo. Real orders need a Wix premium plan that accepts payments and a connected payment provider. Place a test order before launch, as Wix is still rolling out parts of the Studio Two checkout. The template needs Wix Studio Two, which Wix is rolling out to Wix Partners first, so check your access before you buy. Names, figures, quotes and contact details are fictional samples and the photos are Pexels placeholders, so replace them before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Shop, Collections, About, Contact', 'Wix Stores with 8 sample products in one category', 'Live product grids on Home and Shop, plus the Wix Stores product page with Add to Cart', 'Shop-by-room tiles and a Collections page with six room settings', 'Customer promise cards for delivery, returns and warranty', 'Wix Forms customer enquiry form on the Contact page', 'Workshop story, figures and styling service sections', 'Work Sans type on a warm white and terracotta palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); to take real orders, a Wix premium plan that accepts payments and a connected payment provider, then a test order before launch (Wix is still rolling out parts of the Studio Two checkout); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Shop", "Collections", "About", "Contact", "Product Page"], "apps": ["Wix Stores with 8 sample products", "Wix Forms (customer enquiry form)"], "fonts": ["Work Sans (headings and body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/hearth', 'draft', true, false,
    array['/previews/hearth-furniture-store/cover.jpg', '/previews/hearth-furniture-store/gallery.jpg', '/previews/hearth-furniture-store/process.jpg', '/previews/hearth-furniture-store/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'hearth-furniture-store')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Velour: Skincare Store Wix Studio Two Template', 'velour-skincare-store',
    'Velour is a Wix Studio Two template for skincare, beauty and cosmetics brands. Large Instrument Serif headings, Instrument Sans body text and a blush and plum palette give it an editorial, boutique feel.

It has five pages: Home, Shop, Ritual, About and Contact, plus the Wix Stores product page. Home has a split hero, a press strip, a bestsellers grid, an ingredients section, a three-step routine, a gallery and customer quotes. Shop shows the eight single products and a refill section. Ritual walks through a morning and evening routine.

Built-in Wix apps: Wix Stores with 9 sample products, and Wix Forms with a contact form.

Good to know: product pages and the cart work on the live demo. Real orders need a Wix premium plan that accepts payments and a connected payment provider. Place a test order before launch, as Wix is still rolling out parts of the Studio Two checkout. The template needs Wix Studio Two, which Wix is rolling out to Wix Partners first, so check your access before you buy. Names, figures, quotes and contact details are fictional samples and the photos are Pexels placeholders, so replace them before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Shop, Ritual, About, Contact', 'Wix Stores with 9 sample products, including a Ritual Set', 'Live product grids on Home and Shop, plus the Wix Stores product page with Add to Cart', 'Ritual page with morning and evening routine sections and an FAQ', 'Refill programme and order promise sections', 'Wix Forms contact form on the Contact page', 'Press strip, photo gallery and customer quotes', 'Instrument Serif and Instrument Sans type on a blush and plum palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); to take real orders, a Wix premium plan that accepts payments and a connected payment provider, then a test order before launch (Wix is still rolling out parts of the Studio Two checkout); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Shop", "Ritual", "About", "Contact", "Product Page"], "apps": ["Wix Stores with 9 sample products", "Wix Forms (contact form)"], "fonts": ["Instrument Serif (headings)", "Instrument Sans (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/velour', 'draft', true, false,
    array['/previews/velour-skincare-store/cover.jpg', '/previews/velour-skincare-store/gallery.jpg', '/previews/velour-skincare-store/process.jpg', '/previews/velour-skincare-store/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'velour-skincare-store')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Brightline: Dental Clinic Wix Studio Two Template', 'brightline-dental',
    'Brightline is a Wix Studio Two template for dental clinics and other appointment-based practices. Poppins headings, DM Sans body text, a white and blue palette and rounded cards keep it friendly and clear.

It has five pages: Home, Treatments, About, Contact and Book Online. Home has a split hero, clinic stats, treatment cards, a dentist profile, a first visit section, patient quotes and an FAQ. Treatments shows six treatments and a fee table. About has a four-person team. Contact lists opening hours and travel details. Book buttons lead to the Wix Bookings Book Online page.

Built-in Wix apps: Wix Bookings with 6 sample services, sample staff and clinic hours, and Wix Forms with an appointment request form.

Good to know: the 6 sample services are set to pay in person. Taking real bookings needs a Wix premium plan that supports Wix Bookings, and your own staff, hours and time zone. The template needs Wix Studio Two, which Wix is rolling out to Wix Partners first, so check your access before you buy. Names, figures, quotes and contact details are fictional samples and the photos are Pexels placeholders, so replace them before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Treatments, About, Contact, Book Online', 'Wix Bookings with 6 sample appointment services, sample staff and clinic hours', 'Book buttons linked to the Wix Bookings Book Online page', 'Fee table with routine care and treatment prices', 'Six treatment cards and a four-step first visit section', 'Team section with four profiles', 'Wix Forms appointment request form on the Contact page', 'Opening hours, getting here and FAQ sections', 'Poppins and DM Sans type on a white and blue palette']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); to take bookings, a Wix premium plan that supports Wix Bookings; a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Treatments", "About", "Contact", "Book Online"], "apps": ["Wix Bookings with 6 sample services", "Wix Forms (appointment request form)"], "fonts": ["Poppins (headings)", "DM Sans (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/brightline', 'draft', true, false,
    array['/previews/brightline-dental/cover.jpg', '/previews/brightline-dental/gallery.jpg', '/previews/brightline-dental/process.jpg', '/previews/brightline-dental/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'brightline-dental')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Parlour & Co: Hair Salon Wix Studio Two Template', 'parlour-hair-salon',
    'Parlour & Co is a Wix Studio Two template for hair salons, barbers and beauty studios. Bricolage Grotesque headings, Inter body text and a cream, black and berry palette give it a confident, editorial look.

It has five pages: Home, Services, Team, Contact and Book Online. Home has a large hero, the salon story, a short price menu, four stylist profiles, a gallery of looks and client quotes. Services has a full price list in four groups. Team adds a model nights section. Contact lists opening hours. Book a chair buttons lead to the Wix Bookings Book Online page.

Built-in Wix apps: Wix Bookings with 15 sample services, sample stylists and salon hours, and Wix Forms with a booking request form.

Good to know: the 15 sample services are set to pay in person. Taking real bookings needs a Wix premium plan that supports Wix Bookings, and your own staff, hours and time zone. The template needs Wix Studio Two, which Wix is rolling out to Wix Partners first, so check your access before you buy. Names, figures, quotes and contact details are fictional samples and the photos are Pexels placeholders, so replace them before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Services, Team, Contact, Book Online', 'Wix Bookings with 15 sample services, sample stylists and salon hours', 'Book a chair buttons linked to the Wix Bookings Book Online page', 'Full price list in four groups: cut, colour, styling and treatments', 'Stylist profiles on Home and Team', 'Dark gallery section for recent looks', 'Wix Forms booking request form on the Contact page', 'Opening hours and a five-question FAQ', 'Bricolage Grotesque and Inter type on a cream, black and berry palette']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); to take bookings, a Wix premium plan that supports Wix Bookings; a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Services", "Team", "Contact", "Book Online"], "apps": ["Wix Bookings with 15 sample services", "Wix Forms (booking request form)"], "fonts": ["Bricolage Grotesque (headings)", "Inter (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/parlour-and-co', 'draft', true, false,
    array['/previews/parlour-hair-salon/cover.jpg', '/previews/parlour-hair-salon/gallery.jpg', '/previews/parlour-hair-salon/process.jpg', '/previews/parlour-hair-salon/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'parlour-hair-salon')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Atelier Nine: Fashion Store Wix Studio Two Template', 'atelier-nine-fashion-store',
    'Atelier Nine is a Wix Studio Two template for fashion boutiques, clothing labels and designer stores. Uppercase Syne headings, Space Grotesk body text and a black and white base with a cobalt accent give it a sharp, gallery-like look.

It has five pages: Home, Shop, Lookbook, About and Contact, plus the Wix Stores product page. Home has a centred hero, New in and Essentials product grids, a workroom section, stats and a large quote. Shop shows all twelve products and a buying guide. Lookbook presents six looks in two chapters.

Built-in Wix apps: Wix Stores with 12 sample products in three categories, and Wix Forms with an enquiries form.

Good to know: product pages and the cart work on the live demo. Real orders need a Wix premium plan that accepts payments and a connected payment provider. Place a test order before launch, as Wix is still rolling out parts of the Studio Two checkout. The template needs Wix Studio Two, which Wix is rolling out to Wix Partners first, so check your access before you buy. Names, figures, quotes and contact details are fictional samples and the photos are Pexels placeholders, so replace them before you publish. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Shop, Lookbook, About, Contact', 'Wix Stores with 12 sample products in three categories', 'Live New in, Essentials and full shop grids, plus the Wix Stores product page with Add to Cart', 'Lookbook page with six looks in two chapters', 'Workroom, house rules and stats sections', 'Wix Forms appointments and enquiries form on the Contact page', 'Square-cornered layout with large uppercase headings', 'Syne and Space Grotesk type on a black, white and cobalt palette', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); to take real orders, a Wix premium plan that accepts payments and a connected payment provider, then a test order before launch (Wix is still rolling out parts of the Studio Two checkout); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Shop", "Lookbook", "About", "Contact", "Product Page"], "apps": ["Wix Stores with 12 sample products", "Wix Forms (appointments and enquiries form)"], "fonts": ["Syne (headings)", "Space Grotesk (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/atelier-nine', 'draft', true, false,
    array['/previews/atelier-nine-fashion-store/cover.jpg', '/previews/atelier-nine-fashion-store/gallery.jpg', '/previews/atelier-nine-fashion-store/process.jpg', '/previews/atelier-nine-fashion-store/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'atelier-nine-fashion-store')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Aperture: Photographer Portfolio Wix Studio Two Template', 'aperture-photography',
    'Aperture is a dark-theme Wix Studio Two template for photographers, visual artists and creative studios. Space Grotesk headings, Inter body text and a near-black palette with a warm gold accent let the images lead.

It has four pages: Home, Work, About and Contact. Home has a large hero image, a featured series gallery, an about section with stats, a client name strip, a three-photo band, quotes from editors and clients, and a call to action. Work presents three photo series in separate captioned galleries. About has a full-width photo, a long-form bio, figures and a client list. Contact adds studio details and a five-question FAQ.

Built-in Wix app: Wix Forms, with a commission and print enquiry form on the Contact page.

Good to know: the template opens in Wix Studio Two, which Wix is rolling out to Wix Partners first, so check that your Wix account has Studio Two access before you buy. Names, figures, quotes and contact details are fictional samples, and the photos are Pexels stock placeholders. Replace them with your own before you publish. There is no shop or checkout: prints and licensing are offered by enquiry. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Four pages: Home, Work, About, Contact', 'Dark theme made for photography', 'Work page with three captioned series galleries', 'Featured series gallery and a three-photo band on Home', 'Long-form bio, figures and a client list on About', 'Wix Forms commission and print enquiry form on the Contact page', 'Five-question FAQ for commissions, prints and licensing', 'Space Grotesk and Inter type with a gold accent', 'Layouts set for desktop and mobile']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Work", "About", "Contact"], "apps": ["Wix Forms (commission and print enquiry form)"], "fonts": ["Space Grotesk (headings)", "Inter (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/aperture', 'draft', true, false,
    array['/previews/aperture-photography/cover.jpg', '/previews/aperture-photography/gallery.jpg', '/previews/aperture-photography/process.jpg', '/previews/aperture-photography/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'aperture-photography')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, demo_url, status, is_first_party, is_featured, preview_images)
  select null, c.id, 'Stackwise: SaaS Website Wix Studio Two Template', 'stackwise-saas',
    'Stackwise is a Wix Studio Two template for SaaS products, software startups and B2B tools. Sora headings, DM Sans body text and a white and indigo palette with outlined cards give it a crisp product-site look.

It has five pages: Home, Features, Pricing, About and Contact. Home has a centred hero with a dashboard photo, a customer name strip, six feature cards, two feature sections, stats, customer quotes, three pricing plans, an FAQ and a closing call to action. Features adds two more feature sections and a four-step setup. Pricing has an included-on-every-plan section, a worked example and a billing FAQ. About covers the company story and a four-person team.

Built-in Wix app: Wix Forms, with a demo or trial request form on the Contact page.

Good to know: the template opens in Wix Studio Two, which Wix is rolling out to Wix Partners first, so check that your Wix account has Studio Two access before you buy. Names, figures, quotes and contact details are fictional samples, and the photos are Pexels stock placeholders. Replace them with your own before you publish. The pricing plans are page content, not a billing system. The Standard license covers one site, for you or one client. The Extended license covers unlimited sites, including client work.',
    array['Five pages: Home, Features, Pricing, About, Contact', 'Six feature cards and four feature detail sections', 'Three-plan pricing table with a featured plan', 'Stats, customer quotes and a customer name strip', 'Four-step setup and three-step next steps sections', 'Leadership team section with four profiles', 'Wix Forms demo or trial request form on the Contact page', 'Bordered FAQ sections on Home, Pricing and Contact', 'Sora and DM Sans type on a white and indigo palette']::text[],
    '{"platform_version": "Wix Studio Two (2026)", "you_also_need": "A Wix account with Wix Studio Two access (Wix is rolling it out to Wix Partners first); a Wix premium plan to publish on your own domain", "delivery": "Wix template link", "pages": ["Home", "Features", "Pricing", "About", "Contact"], "apps": ["Wix Forms (demo or trial request form)"], "fonts": ["Sora (headings)", "DM Sans (body)"], "breakpoints": "Desktop and mobile layouts", "dependencies": []}'::jsonb, 'https://gambixa.wixstudio.com/stackwise', 'draft', true, false,
    array['/previews/stackwise-saas/cover.jpg', '/previews/stackwise-saas/gallery.jpg', '/previews/stackwise-saas/process.jpg', '/previews/stackwise-saas/mobile.jpg']::text[]
  from public.categories c
  where c.slug = 'wix-studio' and not exists (select 1 from public.assets where slug = 'stackwise-saas')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 7900), ('extended', 29900)) as t(tier, cents);
