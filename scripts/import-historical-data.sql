-- Historical Events Import
-- Generated from Excel spreadsheet
-- Run this in Supabase SQL Editor

-- =====================
-- INSERT EVENTS
-- =====================

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('the-big-bake-off-2025', 'The Big Bake Off', 'A fun baking event for kids to learn cooking skills and make delicious treats.', 'creative', '2025-07-12', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('valentines-sip-paint-2025', 'Valentines Sip & Paint', 'A creative painting session for kids celebrating Valentines Day.', 'creative', '2025-02-14', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('jewellery-making-2025', 'Jewellery Making', 'Children learn to create beautiful handmade jewellery pieces.', 'creative', '2025-07-19', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('safety-programme-28-09-25-2025', 'Safety Programme 28-09-25', 'Educational programme teaching children about personal safety.', 'support', '2025-09-28', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('sip-paint-kids-edition-27-0-2025', 'Sip & Paint Kids Edition - 27-0', 'A fun painting workshop designed especially for children.', 'creative', '2025-07-27', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('back-to-school-giveaway-2025', 'Back to school Giveaway', 'Community event providing school supplies to families in need.', 'community', '2025-08-30', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (slug, title, short_description, category, date, start_time, end_time, venue_name, venue_address, total_slots, waitlist_slots, cost, status, event_type)
VALUES ('evolution-summer-warriors-day-2025', 'Evolution Summer Warriors Day', 'A day of sports, games, and outdoor activities for young warriors.', 'sport', '2025-07-26', '10:00', '14:00', 'Gillingham Children & Family Hub', 'Gillingham, Kent', 30, 10, 'FREE', 'published', 'children')
ON CONFLICT (slug) DO NOTHING;


-- =====================
-- INSERT REGISTRATIONS
-- =====================


-- The Big Bake Off (22 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'the-big-bake-off-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: the-big-bake-off-2025'; RETURN; END IF;

  -- Andris Kuliss
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Andris Kuliss', 'kuilis71@gmail.com', '07707387193', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'PATRICIJA', 7, 1);

  -- Brookie
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Brookie', 'jussbrookie@gmail.com', '07782509273', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Josiah', 9, 1);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amara Okaro', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2);

  -- Chantelle Lazarus
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chantelle Lazarus', 'chantellelazarus@gmail.com', '07931979459', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nalah Lazarus', 7, 1);

  -- Choja
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Choja', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chukwuka Okwuokei', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Osinobi Okwuokei', 5, 2);

  -- Dorothy Marowa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Dorothy Marowa', 'dorothymarowa@ymail.com', '07731940490', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Taliah Murawu', 7, 1);

  -- Gemma
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma', 'gemmawillard8@gmail.com', '07903924072', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Miya Goldsmith', 9, 1);

  -- Ifeoluwa Agbaeze
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ifeoluwa Agbaeze', 'ifemyself@gmail.com', '07512631372', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chimamanda Agbaeze', 6, 1);

  -- Isoken Anthony-Ihianle
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Isoken Anthony-Ihianle', 'isoken.ai@gmail.com', '07771096027', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Otosa', 5, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oghoghosa Annaliese', 8, 2);

  -- Karen Walker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Karen Walker', 'karenfingers@mail.com', '07758965146', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emily Little', 10, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Phoebe little', 8, 2);

  -- Lauren Dempsey
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lauren Dempsey', 'leo1991484@gmail.com', '07500807644', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ivy Dempsey', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Hugo Dempsey', 5, 2);

  -- Macram Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Macram Ramba', 'rambamacram@gmail.com', '07961614219', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nylah-Rose Thompson-Ramba', 5, 1);

  -- Marika Wadin
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Marika Wadin', 'marikawadin@hotmail.com', '07474050545', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Evelyn Curtis', 6, 1);

  -- Michael Redfren
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Michael Redfren', 'mike.ace85@outlook.com', '07585949096', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emily Redfren', 10, 1);

  -- Ms Victoria Moreno Lamas
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ms Victoria Moreno Lamas', 'spainlamas2@gmail.com', '07885236296', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Elisa', 7, 1);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'Nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Darcey jones', 5, 1);

  -- Olajide Ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide Ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofopefoluwa ogidan', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofiyinfoluwa ogidan', 6, 2);

  -- Sarah Anang
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sarah Anang', 'sarahanang@yahoo.co.uk', '07897544855', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Afia', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Fifi', 6, 2);

  -- Shinead Kanu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Shinead Kanu', 'mrsshineadkanu@gmail.com', '07933188899', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Charis kanu', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jonathan Kanu', 7, 2);

  -- Stacey Harlow-Singh
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Stacey Harlow-Singh', 'staceyhs@hotmail.co.uk', '07535621856', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Isla Taylor', 6, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '07369266716', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udah', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ambago Aj Udah', 6, 2);

  -- Yasmine Ali
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yasmine Ali', 'yasmineally@ymail.com', '07424436790', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Tesneem jaji', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Tamara jaji', 7, 2);

END $$;


-- Valentines Sip & Paint (53 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'valentines-sip-paint-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: valentines-sip-paint-2025'; RETURN; END IF;

  -- Adelaide Gbadamosi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Adelaide Gbadamosi', 'adelaide.olu@gmail.com', '07506310832', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Fareed OLUJIDE', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Fareedah Olujide', 8, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Raheemah OLUJIDE', 4, 3);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Raheem OLUJIDE', 4, 4);

  -- Amy Bevan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Amy Bevan', 'smoocher76@hotmail.com', '07910752380', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amelia-Rose Bevan', 10, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Sienna Bevan', 8, 2);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amara Okaro', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Kamsi Okaro', 4, 3);

  -- Charlene hull
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Charlene hull', 'hullcharlene@hotmail.com', '07814637643', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Sienna Francis', 10, 1);

  -- Christine Takyi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Christine Takyi', 'christine.takyi@gmail.com', '07540361131', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jaxon Ababio', 5, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joel Ababio', 8, 2);

  -- Deborah Onawole
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Deborah Onawole', 'debbieadebowale@ymail.com', '07804924062', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathaniel Onawole', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Damian Onawole', 4, 2);

  -- Dorothy Marowa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Dorothy Marowa', 'dorothymarowa@ymail.com', '07731940490', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Taliah Murawu', 7, 1);

  -- Elsa Manitou
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Elsa Manitou', 'elsamanitou@hotmail.co.uk', '07825107894', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ashar Eletu', 8, 1);

  -- Enoto
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Enoto', 'enoto4u@yahoo.com', '07553759469', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Blessed Eluwole', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Excellent Eluwole', 4, 2);

  -- Ethel Boakye
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ethel Boakye', 'geogabi.ep@gmail.com', '07922183809', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Geovanna Asante', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Gabriella Asante', 5, 2);

  -- Florence Tembo
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Florence Tembo', 'Floandrea61@gmail.com', '07428873754', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Miles-Cliff Phiri', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ethan Chiriseri', 10, 2);

  -- Funmi Falana
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Funmi Falana', 'fumzy90@gmail.com', '07947750600', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Noah Falana', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nyle Falana', 4, 2);

  -- Gemma colucci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma colucci', 'gemmacolucci01@outlook.com', '07951617255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Misha Joseph', 10, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amiyah Grant', 7, 2);

  -- Hazel Elba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Hazel Elba', 'hazelashley2017@gmail.com', '07904258306', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Asher Elba', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Avalina Elba', 5, 2);

  -- Kadie Creed
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kadie Creed', 'kadiec@live.co.uk', '07746504696', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Matilda Murty', 4, 1);

  -- Kelechi Eleba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kelechi Eleba', 'eleba.kelechi@gmail.com', '07823717759', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Bryan Eleba', 5, 1);

  -- Kunle Kareem
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kunle Kareem', 'dotkaro28@gmail.com', '07931114425', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jayden Kareem', 8, 1);

  -- Lauren Dempsey
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lauren Dempsey', 'leo1991484@gmail.com', '07500807644', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ivy Dempsey', 7, 1);

  -- Leanne Bagley
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Leanne Bagley', 'leannebagley2023@gmail.com', '07889674187', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rupert Bagley', 6, 1);

  -- Lesley Badu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lesley Badu', 'lesley.felix1@gmail.com', '07581007325', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Aaron Nwoke', 4, 1);

  -- Lisa Hutchinson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lisa Hutchinson', 'lisahutchins4@hotmail.com', '07411888836', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Vincenzo Albano', 4, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Lorena-Rose Albano', 9, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Viviana-Grace Albano', 9, 3);

  -- Marika Wadin
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Marika Wadin', 'marikawadin@hotmail.com', '07474050545', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Evelyn Curtis', 6, 1);

  -- Mechojare
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Mechojare', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chukwuka Okwuokei', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Osinobichukwu Okwuokei', 5, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Elizabeth Saly', 9, 3);

  -- Michelle C
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Michelle C', 'mmatthewekuku@gmail.com', '07713177037', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Aliyah C', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ilora C', 5, 2);

  -- Nevien Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nevien Ramba', 'rnevien@yahoo.co.uk', '07927383215', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'AJ Udoh', 6, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nylah Thompson-Ramba', 5, 3);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Darcey Jones', 4, 1);

  -- Olajide ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofopefoluwa Ogidan', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofiyinfoluwa Ogidan', 6, 2);

  -- Oludotun Orimolade
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Oludotun Orimolade', 'danoludotun@gmail.com', '07909179717', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Dominic Orimolade', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emmanuel Orimolade', 5, 2);

  -- Phoebe Opoku-Asiedu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Phoebe Opoku-Asiedu', 'aketesia.yaa@gmail.com', '07543812565', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Esme Opoku-Asiedu', 4, 1);

  -- Remi Anderson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Remi Anderson', 'remi_curtis@yahoo.co.uk', '07772616620', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ziyana Anderson', 7, 1);

  -- Richenda Polson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Richenda Polson', 'rsp3rope@hotmail.com', '07903800794', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Syre Polson Williamson', 4, 1);

  -- Rochelle Curtis
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Rochelle Curtis', 'rochelle.curtis100@gmail.com', '07846807732', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Eliyanah Uzuga Mendez', 4, 1);

  -- Victoria Moreno Lamas
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Victoria Moreno Lamas', 'spainlamas2@gmail.com', '07885236296', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Elisa D''Mello', 7, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Adrian Udoh', 4, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Adriana Udoh', 4, 2);

  -- Sonya Bryant
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sonya Bryant', 'freemansonya30@gmail.com', '07784755106', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Reuben Bryant', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Iziah Bryant', 10, 2);

  -- Shinead Kanu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Shinead Kanu', 'mrsshineadkanu@gmail.com', '07933188899', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Charis kanu', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jonathan Kanu', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joel Kanu', 5, 3);

END $$;


-- Jewellery Making (32 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'jewellery-making-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: jewellery-making-2025'; RETURN; END IF;

  -- Amy Bevan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Amy Bevan', 'smoocher76@hotmail.com', '07910752380', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amelia-Rose Bevan', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Sienna Bevan', 8, 2);

  -- Andris Kuliss
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Andris Kuliss', 'kuilis71@gmail.com', '07707387193', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Patricija', 7, 1);

  -- Ariike Fadeyi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ariike Fadeyi', 'fadeyiempire@gmail.com', '07860107428', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Iremide Fadeyi', 10, 1);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amara Okaro', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2);

  -- Chantelle Lazarus
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chantelle Lazarus', 'chantellelazarus@gmail.com', '07931979459', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Noah Lazarus', 10, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nahla Lazarus', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rivah Lazarus', 5, 3);

  -- Dorothy Marowa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Dorothy Marowa', 'dorothymarowa@ymail.com', '07731940490', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Dorothy Morowa', 7, 1);

  -- Ethel Boakye
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ethel Boakye', 'geogabi.ep@gmail.com', '07922183809', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Geovanna Asante', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Gabriella Asante', 5, 2);

  -- Gemma Colucci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma Colucci', 'gemmacolucci01@outlook.com', '07951617255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Misha Joseph', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amiyah Grant', 7, 2);

  -- Ify Ngaka
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ify Ngaka', 'uniqval@gmail.com', '07459142178', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Sophia Chizitere Ngaka', 5, 1);

  -- Kelechi Eleba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kelechi Eleba', 'uzowuru.kelechi2@gmail.com', '07823717759', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Bryan Chiagoziem Eleba', 5, 1);

  -- Lauren Dempsey
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lauren Dempsey', 'leo1991484@gmail.com', '07500807644', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ivy Dempsey', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Hugo Dempsey', 5, 2);

  -- Lubna Ali
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lubna Ali', 'lubnaali778899@gmail.com', '07309102635', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Anas Ali', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mohsin Ali', 6, 2);

  -- Mechojare
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Mechojare', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chukwuka', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Osinobi', 5, 2);

  -- Melanie Collett
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Melanie Collett', 'jademel55@yahoo.com', '07597310312', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rosie Cook', 8, 1);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Darcey Jones', 5, 1);

  -- Olajide Ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide Ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofopefoluwa Ogidan', 8, 1);

  -- Omotokunbo Ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Omotokunbo Ogidan', 'toksybee2007@yahoo.com', '07897371347', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofiyinfoluwa Ogidan', 6, 1);

  -- Precious Nwankwo
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Precious Nwankwo', 'amprecious139@gmail.com', '07537954555', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nadia Nwankwo', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathan Nwankwo', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nicky Nwankwo', 6, 3);

  -- Sarag Anang
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sarag Anang', 'sarahanang@yahoo.co.uk', '07897544855', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Afia Ackah', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Fiifi Ackah', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Paula Howard', 5, 3);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Temi Roland', 8, 4);

  -- Shinead Kanu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Shinead Kanu', 'mrsshineadkanu@gmail.com', '07933188899', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Charis Kanu', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jonathan Kanu', 7, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joshua Kanu', 5, 3);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joel Kanu', 5, 4);

  -- Siji Arun
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Siji Arun', 'siji.snny@hotmail.com', '07459568140', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathaniel', 8, 1);

  -- Taiwo Abrahams
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Taiwo Abrahams', 'taiwoliadi2016@gmail.com', '07440376021', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oluwapamilerin Abrahams', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oluwepelumi Abrahams', 5, 2);

  -- Victorua Moreno Lamas
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Victorua Moreno Lamas', 'spainlamas2@gmail.com', '07885236296', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Elisa', 7, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '07369266716', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ambago AJ Udoh', 6, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nylah-Rose Thompson', 5, 3);

  -- Yagmur Gulsen
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yagmur Gulsen', 'yagmurgulsen281@gmail.com', '07367452313', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Havin Gulsen', 5, 1);

  -- Yetunde Makinwa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yetunde Makinwa', 'yetundemakinwa1@gmail.com', '07984648501', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Esther Makinwa', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Israel Makinwa', 10, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'David Makinwa', 12, 3);

END $$;


-- Safety Programme 28-09-25 (5 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'safety-programme-28-09-25-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: safety-programme-28-09-25-2025'; RETURN; END IF;

  -- Eunice OLUWASOLA
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Eunice OLUWASOLA', 'kemsol201@yahoo.com', '757250776', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jimmy Babatund', 12, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Lois Babatunde', 7, 2);

  -- Victoria Jarvis
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Victoria Jarvis', 'v.aird@live.co.uk', '07512232794', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ocean Jarvis', 12, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ambago AJ Udoh', 6, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nylah-Rose Thompson', 5, 3);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amara Okaro', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2);

  -- Bethany singh
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Bethany singh', 'bethanysingh0809@gmail.com', '07593189217', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Riley tournay', 10, 1);

END $$;


-- Sip & Paint Kids Edition - 27-0 (43 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'sip-paint-kids-edition-27-0-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: sip-paint-kids-edition-27-0-2025'; RETURN; END IF;

  -- Abdulrazaq Ajayi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Abdulrazaq Ajayi', 'hajilegzy2000@yahoo.com', '07575389690', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Kamilah Ajayi', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Khaleed Ajayi', 10, 2);

  -- Adekunle Ridwan Shodiya
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Adekunle Ridwan Shodiya', 'adekunleridwan115@yahoo.com', '07407207385', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amatul-azeem Shodiya', 5, 1);

  -- Adeperosoye Adenuga
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Adeperosoye Adenuga', 'adeperosoye1996@gmail.com', '07496092394', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oluwamayomide Adenuga', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oluwakayomide Adenuga', 3, 2);

  -- Aleksandra Yordanova
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Aleksandra Yordanova', 'sandyyordanova@gmail.com', '07749772006', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Elizabeth Gigova', 5, 1);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amara Okaro', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2);

  -- Chinonyerem U. Ihechukwu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chinonyerem U. Ihechukwu', 'chinoihechukwu@yahoo.com', '07438217264', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chinedum Lucky Ihechukwu', 11, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chinonyerem Favour Ihechukwu', 10, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chiagoziem Kingsley Ihechukwu', 7, 3);

  -- Christine Benocci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Christine Benocci', 'christinebenocci@aol.com', '07966910518', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ema Zibaite', 11, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oscar Laws', 8, 2);

  -- Deborah Onawole
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Deborah Onawole', 'debbieadebowale@ymail.com', '07804924062', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathaniel onawole', 6, 1);

  -- Fiona Lee
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Fiona Lee', 'missfionalee@gmail.com', '07767049935', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Khaely King', 11, 1);

  -- Folabomi Oshiyemi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Folabomi Oshiyemi', 'bomiitrouper@yahoo.com', '07507126606', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathan fagbesa', 9, 1);

  -- Folake Ariyo
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Folake Ariyo', 'folake1992@hotmail.com', '07943715665', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Serayah Ariyo', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Micah Ariyo', 5, 2);

  -- Gemma Colucci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma Colucci', 'gemmacolucci01@outlook.com', '07951617255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amiyah grant', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Misha joseph', 9, 2);

  -- Ifeoluwa Agbaeze
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ifeoluwa Agbaeze', 'ifemyself@gmail.com', '07512631372', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chimamanda Agbaeze', 6, 1);

  -- Karen Walker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Karen Walker', 'karenfingers@mail.com', '07758965146', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emily little', 11, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Phoebe little', 7, 2);

  -- Lubna Lubna Ali
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lubna Lubna Ali', 'lubnaali778899@gmail.com', '07309102635', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mohsin Ali', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Anas Ali', 8, 2);

  -- Mechojare
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Mechojare', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chukwuka', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Osinobichukwu', 5, 2);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'Nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Darcey jones', 5, 1);

  -- Omowumi Adeyemi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Omowumi Adeyemi', 'omowumiadeyemi01@gmail.com', '07713953527', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Christabella Adeyemi', 6, 1);

  -- Orimolade Oludotun Daniel
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Orimolade Oludotun Daniel', 'danoludotun@gmail.com', '07909179717', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Dominic Orimolade', 6, 1);

  -- Salaudeen Kasim
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Salaudeen Kasim', 'oyakaz16@gmail.com', '07903106512', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Salaudeen Omotayo Salaudeen', 12, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Saludeen AbdulSalam', 10, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Saludeen Sururah', 5, 3);

  -- Sonya Bryant
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sonya Bryant', 'freemansonya30@gmail.com', '07784755106', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Reuben Bryant', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Iziah Bryant', 11, 2);

  -- Sophie Laws
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sophie Laws', 'sophiecupman@hotmail.com', '07515466136', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jacob laws', 5, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ivy Laws', 5, 2);

  -- Stacey Harlow-Singh
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Stacey Harlow-Singh', 'staceyhs@hotmail.co.uk', '75352621856', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Isla Taylor', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Leo Taylor', 2, 2);

  -- Thomas van Hennik
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Thomas van Hennik', 'vh.thomas@gmail.com', '07523782166', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Atlas van Hennik', 2, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ambago AJ Udoh', 6, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nylah-Rose Thompson', 5, 3);

END $$;


-- Back to school Giveaway (25 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'back-to-school-giveaway-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: back-to-school-giveaway-2025'; RETURN; END IF;

  -- Adeola Jolaoso
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Adeola Jolaoso', 'adeneye.adeola@yahoo.com', '07586094461', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Zain Jalaosho', 8, 1);

  -- Ayobami Awolumate
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ayobami Awolumate', 'awolumate.a@yahoo.com', '07480464649', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Farhana Faronbi', 9, 1);

  -- Chantalle Collu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chantalle Collu', 'chantallecollu@yahoo.co,uk', '07534788042', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nyla Collu', 10, 1);

  -- Charmagne Collins
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Charmagne Collins', 'charrob8790@gmail.com', '07535154571', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Eddie-Reece Cadwallader', 10, 1);

  -- Christiana Odekunle
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Christiana Odekunle', 'abxristy@yahoo.com', '07415921867', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jedidah Abdul', 9, 1);

  -- Esther Oke
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Esther Oke', 'glotiouseesther@yahoo.com', '07727362631', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oluwademilade Oke', 10, 1);

  -- Fola Oshiyemi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Fola Oshiyemi', 'bomiitrouper@yahoo.com', '07507126686', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nathan Fagbesa', 9, 1);

  -- Isoken
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Isoken', 'iskiyawe@gmail.com', '07771096027', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Ian', 5, 1);

  -- Lisa Hutchinson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lisa Hutchinson', 'lisahutchins4@hotmail.com', '07411888836', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Viviama-Grace Albano', 9, 1);

  -- Lubna Ali
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lubna Ali', 'lubnaali778899@gmail.com', '07309102635', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Muhammed Anas Ali', 8, 1);

  -- Mechojare
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Mechojare', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Chukwuka', 6, 1);

  -- Nonye Lawani
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nonye Lawani', 'nonyelawani@gmail.com', '07817656278', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rieme Lawani', 9, 1);

  -- Olajide Ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide Ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mofopefoluwa Justina', 8, 1);

  -- Oluwatobi Olatunji
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Oluwatobi Olatunji', 'tobibukun@gmail.com', '07737156555', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emmauel Olatunji', 11, 1);

  -- Onyekachi Lois Akoma-Chimaobi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Onyekachi Lois Akoma-Chimaobi', 'iweajunwaonyekachi@yahoo.com', '07963777048', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Nmeri Amadi', 10, 1);

  -- Opeyemi Roseline Aiyeonipekun
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Opeyemi Roseline Aiyeonipekun', 'h2irosdem@gmail.com', '07979456145', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Aiyeonipekun Blessing', 11, 1);

  -- Precious Oduntan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Precious Oduntan', 'preciousoduntan@gmail.com', '07596057427', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Mathew Oshobu', 5, 1);

  -- Rachael Ajayi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Rachael Ajayi', 'xtoyin@gmail.com', '07377370803', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Etsesomi Oceania Dada', 10, 1);

  -- Saidi Adelekan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Saidi Adelekan', 'elevateddeji2@gmail.com', '07424746639', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Tomi', 5, 1);

  -- Sarah Ack
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sarah Ack', 'sarajanang@yahoo.co.uk', '07466880380', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Afii Ack', 8, 1);

  -- Temitope Adegoke
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Temitope Adegoke', 'topsyjay4@gmail.com', '07361557919', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'David', 7, 1);

  -- Ujuamara Okoli
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ujuamara Okoli', 'delightujuamara@gmail.com', '07388913208', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Uchechukwu Okoli', 6, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '07369266716', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udah', 9, 1);

  -- Yetunde
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yetunde', 'yetailove@gmail.com', '07984648501', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Irsael Makinwa', 10, 1);

END $$;


-- Evolution Summer Warriors Day (23 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'evolution-summer-warriors-day-2025';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: evolution-summer-warriors-day-2025'; RETURN; END IF;

  -- Ade
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ade', 'bimtoy@ymail.com', '07413008317', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Lamar', 8, 1);

  -- Alando Mcneish
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Alando Mcneish', 'alandomcneish93@outlook.com', '07951257684', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Zackariah Wallace', 9, 1);

  -- Amber Rogers
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Amber Rogers', 'yasmin.rogers1@gmail.com', '07935251857', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Tommy Beaney', 11, 1);

  -- Brookie Odutolu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Brookie Odutolu', 'jussbrookie@gmail.com', '07782509273', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Josiah Adeyemo', 9, 1);

  -- Byron Walker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Byron Walker', 'supreme-choice@hotmail.com', '07787893337', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Jayden Walker', 5, 1);

  -- Chloe Joce
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chloe Joce', 'chloejoce95@gmail.com', '07710409255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Teddie Joce', 5, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Frankie Joce', 8, 2);

  -- Ekenedilichukwu Edenjoku
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ekenedilichukwu Edenjoku', 'ekens01@yahoo.co.uk', '07415324027', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Anthony Edenjoku', 9, 1);

  -- Folake Ariyo
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Folake Ariyo', 'folake1992@hotmail.com', '07943715665', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joanna Jaiyeola', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Joshua Jaiyeola', 6, 2);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Micah Ariyo', 5, 3);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Feyi Ariyo', 9, 4);

  -- Gemma Colluci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma Colluci', 'freemansonya30@gmail.com', '07951617255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amiyah Grant', 7, 1);

  -- Ian Donohue
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ian Donohue', 'idonohue84id@gmail.com', '07930199635', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Oakley Donohue', 7, 1);

  -- Joanne Cooper
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Joanne Cooper', 'cooperjoanne73@yahoo.com', '07467297470', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Max Cooper', 12, 1);

  -- Jon Moss
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Jon Moss', 'jonboymoss1973@gmail.com', '07894171262', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Thea Moss', 8, 1);

  -- Karen Walker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Karen Walker', 'karenfingers@mail.com', '07758965146', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Phoebe Little', 7, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Emily Little', 9, 2);

  -- Leanne Bagley
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Leanne Bagley', 'leannebagley2023@gmail.com', '07889674187', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rupert Bagley', 6, 1);

  -- Louise Tucker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Louise Tucker', 'loukerrytuck21@gmail.com', '07887717104', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Henry Tucker', 11, 1);

  -- Marika Wadin
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Marika Wadin', 'marikawadin@hotmail.com', '07474050545', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Evelyn Curtis', 6, 1);

  -- Melanie Collett
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Melanie Collett', 'jademel55@yahoo.com', '07597310312', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Rosie Cook', 8, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Tommy Lee-Cook', 9, 2);

  -- Nathan Cockerton
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nathan Cockerton', 'nathancockerton@hotmail.com', '07495274999', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Blake Cickerton', 6, 1);

  -- Sonya Bryant
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sonya Bryant', 'freemansonya30@gmail.com', '07784755106', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Reuben Bryant', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Iziah Bryant', 10, 2);

  -- Suzanne Pearson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Suzanne Pearson', 'suzannepearson1@hotmail.co.uk', '07399419779', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Michael Dunne', 9, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Lacey Dunne', 12, 2);

  -- Terry Webb
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Terry Webb', 'tfjwebb180@gmail.com', '07355389444', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Toni Webb', 5, 1);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '07369266716', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'AJ Udih', 6, 1);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 2);

  -- Yasmin Rogers
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yasmin Rogers', 'yasmin.rogers1@gmail.com', '07935251857', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order)
  VALUES (v_reg_id, 'Wayne Willett', 11, 1);

END $$;
