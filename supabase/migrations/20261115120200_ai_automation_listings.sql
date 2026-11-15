-- AI & Automation listings: six n8n workflow packs and the Local Marketing
-- Skills pack for Claude. They go in as drafts. An admin uploads each pack's
-- zip on the admin page (Files), then publishes it with admin_publish_asset,
-- which refuses any asset that has no real file to deliver. Ratings and sales
-- start at zero.

create or replace function public.admin_publish_asset(p_asset uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admins only';
  end if;
  if not exists (select 1 from asset_files where asset_id = p_asset)
     and not exists (select 1 from asset_packages where asset_id = p_asset and install_url is not null) then
    raise exception 'Upload the files this asset delivers before publishing it';
  end if;
  if not exists (select 1 from asset_licenses where asset_id = p_asset) then
    raise exception 'This asset has no licence prices';
  end if;
  update assets set status = 'approved', updated_at = now() where id = p_asset;
end;
$$;
revoke all on function public.admin_publish_asset(uuid) from public, anon;
grant execute on function public.admin_publish_asset(uuid) to authenticated;


with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'AI Speed-to-Lead — n8n Workflow Pack', 'ai-speed-to-lead',
    'Leads go cold fast: most people book whoever replies first. This workflow catches each form submission, has AI score it and write a reply that answers what the person actually asked, emails it from your Gmail, adds the lead to a Google Sheet and pings Slack when the score is high. It works with any form tool that can send a webhook: Webflow, Wix, WordPress (WPForms, Gravity Forms, Contact Form 7 add-ons), Typeform, Tally, Jotform, Framer and more. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['Receives form submissions on a webhook and answers the form tool at once', 'Maps the field names of most form tools to one shape (name, email, phone, service, message)', 'Skips submissions with no email and no phone', 'Scores each lead 1-10 with a reason, urgency and one-line summary', 'Writes and sends a personal first reply from your Gmail, with your booking link', 'Adds every lead to a Leads sheet and alerts Slack when the score reaches your threshold']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 1 workflow file + error alert, README, sample data", "you_also_need": "OpenAI API key, Google account, Slack, a website form", "ai_cost": "About $0.001 per lead with gpt-4.1-mini", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 13 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/ai-speed-to-lead/cover.jpg', '/previews/ai-speed-to-lead/workflow.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'ai-speed-to-lead')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 4900), ('extended', 14900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'AI Website Chatbot — n8n Workflow Pack', 'ai-website-chatbot',
    'Visitors ask the same questions at 10pm that you answer all day. This workflow puts an AI assistant on your site that answers only from a Google Doc you control, keeps the thread of the conversation, and saves anyone who wants a quote, booking or call back to a Google Sheet. No vector database, no extra hosting: update the doc and the answers change. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['Embeds on any website (Wix, Webflow, WordPress, Shopify, Framer, plain HTML) with one snippet', 'Answers from your knowledge doc and says so when it does not know', 'Remembers the last 10 messages of each visitor''s conversation', 'Collects name and email or phone, then saves the lead with a summary to a Google Sheet', 'Puts your phone number first for urgent problems', 'Refuses to guess prices, availability or give professional advice']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 1 workflow file + error alert, README, sample data", "you_also_need": "OpenAI API key, Google account, your website", "ai_cost": "About $0.002 per message with gpt-4.1-mini and a 3-page knowledge doc", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 7 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/ai-website-chatbot/cover.jpg', '/previews/ai-website-chatbot/workflow.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'ai-website-chatbot')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 5900), ('extended', 17900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'AI Inbox Assistant — n8n Workflow Pack', 'ai-inbox-assistant',
    'For owners and small teams who live in their inbox. Each new email is classified, summarised and logged; anyone waiting on an answer gets a draft reply saved in the same Gmail thread, written in your style with [confirm] markers wherever a fact is needed; urgent ones ping you in Slack. You stay in control: the workflow never sends email. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['Checks Gmail every minute for new inbox mail (promotions and social tabs excluded)', 'Strips quoted history so the AI reads only the new message', 'Classifies into 9 categories with a priority and one-line summary', 'Saves a threaded draft reply when someone is waiting on you; never sends', 'Logs every email to a Google Sheet with a link back to Gmail', 'Sends a Slack alert for urgent mail: money at risk, angry customers, same-day deadlines']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 1 workflow file + error alert, README, sample data", "you_also_need": "OpenAI API key, Gmail or Google Workspace, Google Sheets, Slack", "ai_cost": "About $0.001 per email with gpt-4.1-mini; 50 emails a day is roughly $1.50 a month", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 13 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/ai-inbox-assistant/cover.jpg', '/previews/ai-inbox-assistant/workflow.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'ai-inbox-assistant')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 4900), ('extended', 14900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'Shopify AI Product Copy — n8n Workflow Pack', 'shopify-ai-product-copy',
    'Thin or copied product descriptions cost you search traffic and sales. Tag the products that need work, and every morning this pack writes a description, SEO title and meta description for each one in your brand voice, using only the facts in your product data. The drafts land in a Google Sheet; edit what you like, set a row to approved, and the second workflow publishes it to Shopify within the hour. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['Finds products by tag through the Shopify Admin GraphQL API (no third-party app to install in your store)', 'Writes 80-180 word descriptions with a feature list, an SEO title (60 characters) and meta description (155 characters)', 'Uses only your product facts and lists missing facts instead of inventing them', 'Puts every draft in a Google Sheet for review, with a link to the product in your admin', 'Publishes approved rows, removes the tag and records the result', 'Never changes prices, images, variants or anything else']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 2 workflow files + error alert, README, sample data", "you_also_need": "Shopify store, OpenAI API key, Google Sheets", "ai_cost": "About $0.002 per product with gpt-4.1-mini", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 16 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/shopify-ai-product-copy/cover.jpg', '/previews/shopify-ai-product-copy/workflow.jpg', '/previews/shopify-ai-product-copy/workflow-2.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'shopify-ai-product-copy')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 5900), ('extended', 17900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'AI Content Repurposer — n8n Workflow Pack', 'ai-content-repurposer',
    'You wrote the article; now it needs to live on five other channels. Submit a link or paste the text into a simple form and this workflow writes a LinkedIn post, an X thread, a Facebook post, an Instagram caption, a 30-45 second video script and a newsletter blurb, each shaped for its platform and limited to what the article actually says. Every draft lands as a row in a Google Sheet with a status column, ready for your scheduler. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['A form you can bookmark: paste a link or the article text, plus optional notes', 'Reads the article from the page, skipping menus, footers and scripts', 'Writes six drafts to platform lengths and formats', 'Uses only what the article says: no invented statistics, quotes or results', 'Adds one row per platform to a Content sheet with status and publish date columns', 'Explains what to do when a page cannot be read (paste the text instead)']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 1 workflow file + error alert, README, sample data", "you_also_need": "OpenAI API key, Google Sheets", "ai_cost": "About $0.01 per article with gpt-4.1-mini", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 10 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/ai-content-repurposer/cover.jpg', '/previews/ai-content-repurposer/workflow.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'ai-content-repurposer')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 3900), ('extended', 11900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'AI Invoice Extractor — n8n Workflow Pack', 'ai-invoice-extractor',
    'Typing supplier invoices into a spreadsheet or accounting tool is slow and error-prone. This workflow watches Gmail for PDF invoices, receipts and bills, extracts the vendor, invoice number, dates, currency, subtotal, tax, total and line items, and adds a row to a Google Sheet marked "to review". Bills due within a week, or ones the AI was unsure about, are flagged in Slack. It copies values exactly as printed and leaves blanks rather than guessing. Bring your own n8n (Cloud or self-hosted) and AI API key; model usage is billed by your provider. Not affiliated with n8n GmbH.',
    array['Watches Gmail for emails with PDF attachments that look like invoices, receipts, bills or statements', 'Handles several PDFs in one email', 'Extracts 13 fields plus up to 20 line items, with a confidence rating', 'Leaves fields blank instead of guessing, and explains unclear dates', 'Logs scanned PDFs (no text layer) for manual entry instead of failing', 'Flags bills due within 7 days or extracted with less than high confidence']::text[],
    '{"platform_version": "n8n 2.x (checked on 2.47.7)", "delivery": "Zip download: 1 workflow file + error alert, README, sample data", "you_also_need": "OpenAI API key, Gmail or Google Workspace, Google Sheets, Slack", "ai_cost": "Under $0.002 per invoice with gpt-4.1-mini", "tested": "Run end to end in n8n 2.47.7 with sample data and stand-in accounts; all 13 nodes checked against n8n''s own node definitions"}'::jsonb, 'draft', true,
    array['/previews/ai-invoice-extractor/cover.jpg', '/previews/ai-invoice-extractor/workflow.jpg']::text[]
  from public.categories c
  where c.slug = 'n8n-workflows' and not exists (select 1 from public.assets where slug = 'ai-invoice-extractor')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 4900), ('extended', 14900)) as t(tier, cents);

with a as (
  insert into public.assets (seller_id, category_id, title, slug, description, features, compatibility, status, is_first_party, preview_images)
  select null, c.id, 'Local Marketing Skills for Claude — Agent Skills Pack', 'local-marketing-skills',
    'Eight Agent Skills that make Claude a local-marketing specialist for agencies and freelancers who market trades, clinics, salons, restaurants and shops: a brand voice guide the other skills follow, local service pages with FAQs and JSON-LD, a month of Google Business Profile posts, review replies, a scored local SEO audit, ad copy within platform limits, a one-page client report and a pre-launch site check. Each skill marks anything the owner must confirm instead of inventing it. Works in Claude Code, the Claude apps (on plans that include Skills) and the Claude API. Not affiliated with Anthropic.',
    array['8 skills, each a SKILL.md plus templates', 'brand-voice guide that every other skill reads', 'Service pages with LocalBusiness, Service and FAQPage JSON-LD', 'GBP posts, review replies and ad copy sized to each platform''s limits', 'Local SEO audit with a score and a 30-day plan', 'Monthly client report and pre-launch QA checklist', 'Never invents reviews, ratings, licences or results; marks unknowns [confirm]', 'One-click upload zips for the Claude apps']::text[],
    '{"platform_version": "Claude Code, Claude apps with Skills, Claude API", "delivery": "Zip download: 8 skill folders, 8 upload-ready zips, README", "you_also_need": "A Claude plan that includes Skills, or Claude Code", "tested": "Every SKILL.md checked for valid frontmatter and file references"}'::jsonb, 'draft', true,
    array['/previews/local-marketing-skills/cover.jpg', '/previews/local-marketing-skills/inside.jpg']::text[]
  from public.categories c
  where c.slug = 'ai-agent-kits' and not exists (select 1 from public.assets where slug = 'local-marketing-skills')
  returning id
)
insert into public.asset_licenses (asset_id, tier, price_cents)
select id, t.tier::license_tier, t.cents from a, (values ('standard', 3900), ('extended', 11900)) as t(tier, cents);
