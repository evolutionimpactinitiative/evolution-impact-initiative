-- Import registrations for Valentine's Sip & Paint and The Big Bake Off Christmas Edition
-- Run this in Supabase SQL Editor


-- Valentine's Sip & Paint (53 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'valentine-s-sip-paint-2026';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: valentine-s-sip-paint-2026'; RETURN; END IF;

  -- Adelaide Gbadamosi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Adelaide Gbadamosi', 'adelaide.olu@gmail.com', '07506310832', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Fareed OLUJIDE', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Fareedah Olujide', 8, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Raheemah OLUJIDE', 4, 3, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Raheem OLUJIDE', 4, 4, true);

  -- Amy Bevan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Amy Bevan', 'smoocher76@hotmail.com', '07910752380', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amelia-Rose Bevan', 10, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Sienna Bevan', 8, 2, true);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amara Okaro', 9, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Kamsi Okaro', 4, 3, true);

  -- Charlene hull
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Charlene hull', 'hullcharlene@hotmail.com', '07814637643', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Sienna Francis', 10, 1, true);

  -- Christine Takyi
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Christine Takyi', 'christine.takyi@gmail.com', '07540361131', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Jaxon Ababio', 5, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Joel Ababio', 8, 2, true);

  -- Deborah Onawole
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Deborah Onawole', 'debbieadebowale@ymail.com', '07804924062', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Nathaniel Onawole', 6, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Damian Onawole', 4, 2, true);

  -- Dorothy Marowa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Dorothy Marowa', 'dorothymarowa@ymail.com', '07731940490', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Taliah Murawu', 7, 1, true);

  -- Elsa Manitou
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Elsa Manitou', 'elsamanitou@hotmail.co.uk', '07825107894', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ashar Eletu', 8, 1, true);

  -- Enoto
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Enoto', 'enoto4u@yahoo.com', '07553759469', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Blessed Eluwole', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Excellent Eluwole', 4, 2, true);

  -- Ethel Boakye
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ethel Boakye', 'geogabi.ep@gmail.com', '07922183809', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Geovanna Asante', 7, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Gabriella Asante', 5, 2, true);

  -- Florence Tembo
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Florence Tembo', 'Floandrea61@gmail.com', '07428873754', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Miles-Cliff Phiri', 7, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ethan Chiriseri', 10, 2, true);

  -- Funmi Falana
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Funmi Falana', 'fumzy90@gmail.com', '07947750600', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Noah Falana', 7, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Nyle Falana', 4, 2, true);

  -- Gemma colucci
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma colucci', 'gemmacolucci01@outlook.com', '07951617255', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Misha Joseph', 10, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amiyah Grant', 7, 2, true);

  -- Hazel Elba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Hazel Elba', 'hazelashley2017@gmail.com', '07904258306', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Asher Elba', 7, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Avalina Elba', 5, 2, true);

  -- Kadie Creed
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kadie Creed', 'kadiec@live.co.uk', '07746504696', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Matilda Murty', 4, 1, true);

  -- Kelechi Eleba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kelechi Eleba', 'eleba.kelechi@gmail.com', '07823717759', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Bryan Eleba', 5, 1, true);

  -- Kunle Kareem
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Kunle Kareem', 'dotkaro28@gmail.com', '07931114425', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Jayden Kareem', 8, 1, true);

  -- Lauren Dempsey
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lauren Dempsey', 'leo1991484@gmail.com', '07500807644', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ivy Dempsey', 7, 1, true);

  -- Leanne Bagley
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Leanne Bagley', 'leannebagley2023@gmail.com', '07889674187', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Rupert Bagley', 6, 1, true);

  -- Lesley Badu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lesley Badu', 'lesley.felix1@gmail.com', '07581007325', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Aaron Nwoke', 4, 1, true);

  -- Lisa Hutchinson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lisa Hutchinson', 'lisahutchins4@hotmail.com', '07411888836', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Vincenzo Albano', 4, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Lorena-Rose Albano', 9, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Viviana-Grace Albano', 9, 3, true);

  -- Marika Wadin
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Marika Wadin', 'marikawadin@hotmail.com', '07474050545', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Evelyn Curtis', 6, 1, true);

  -- Mechojare
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Mechojare', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Chukwuka Okwuokei', 6, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Osinobichukwu Okwuokei', 5, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Elizabeth Saly', 9, 3, true);

  -- Michelle C
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Michelle C', 'mmatthewekuku@gmail.com', '07713177037', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Aliyah C', 6, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ilora C', 5, 2, true);

  -- Nevien Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nevien Ramba', 'rnevien@yahoo.co.uk', '07927383215', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amanie Udoh', 9, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'AJ Udoh', 6, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Nylah Thompson-Ramba', 5, 3, true);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Darcey Jones', 4, 1, true);

  -- Olajide ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Mofopefoluwa Ogidan', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Mofiyinfoluwa Ogidan', 6, 2, true);

  -- Oludotun Orimolade
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Oludotun Orimolade', 'danoludotun@gmail.com', '07909179717', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Dominic Orimolade', 6, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Emmanuel Orimolade', 5, 2, true);

  -- Phoebe Opoku-Asiedu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Phoebe Opoku-Asiedu', 'aketesia.yaa@gmail.com', '07543812565', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Esme Opoku-Asiedu', 4, 1, true);

  -- Remi Anderson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Remi Anderson', 'remi_curtis@yahoo.co.uk', '07772616620', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ziyana Anderson', 7, 1, true);

  -- Richenda Polson
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Richenda Polson', 'rsp3rope@hotmail.com', '07903800794', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Syre Polson Williamson', 4, 1, true);

  -- Rochelle Curtis
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Rochelle Curtis', 'rochelle.curtis100@gmail.com', '07846807732', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Eliyanah Uzuga Mendez', 4, 1, true);

  -- Victoria Moreno Lamas
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Victoria Moreno Lamas', 'spainlamas2@gmail.com', '07885236296', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Elisa D''Mello', 7, 1, true);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Adrian Udoh', 4, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Adriana Udoh', 4, 2, true);

  -- Sonya Bryant
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sonya Bryant', 'freemansonya30@gmail.com', '07784755106', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Reuben Bryant', 9, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Iziah Bryant', 10, 2, true);

  -- Shinead Kanu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Shinead Kanu', 'mrsshineadkanu@gmail.com', '07933188899', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Charis kanu', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Jonathan Kanu', 7, 2, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Joel Kanu', 5, 3, true);

END $$;


-- The Big Bake Off Christmas Edition (22 registrations)
DO $$
DECLARE
  v_event_id UUID;
  v_reg_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'the-big-bake-off-christmas-edition-2026';
  IF v_event_id IS NULL THEN RAISE NOTICE 'Event not found: the-big-bake-off-christmas-edition-2026'; RETURN; END IF;

  -- Andris Kuliss
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Andris Kuliss', 'kuilis71@gmail.com', '07707387193', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'PATRICIJA', 7, 1, true);

  -- Brookie
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Brookie', 'jussbrookie@gmail.com', '07782509273', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Josiah', 9, 1, true);

  -- Careene Okaro
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Careene Okaro', 'careeneokaro@outlook.com', '07946115833', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amara Okaro', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Chizara Okaro', 7, 2, true);

  -- Chantelle Lazarus
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Chantelle Lazarus', 'chantellelazarus@gmail.com', '07931979459', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Nalah Lazarus', 7, 1, true);

  -- Choja
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Choja', 'mechojare@gmail.com', '07448163445', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Chukwuka Okwuokei', 6, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Osinobi Okwuokei', 5, 2, true);

  -- Dorothy Marowa
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Dorothy Marowa', 'dorothymarowa@ymail.com', '07731940490', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Taliah Murawu', 7, 1, true);

  -- Gemma
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Gemma', 'gemmawillard8@gmail.com', '07903924072', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Miya Goldsmith', 9, 1, true);

  -- Ifeoluwa Agbaeze
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ifeoluwa Agbaeze', 'ifemyself@gmail.com', '07512631372', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Chimamanda Agbaeze', 6, 1, true);

  -- Isoken Anthony-Ihianle
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Isoken Anthony-Ihianle', 'isoken.ai@gmail.com', '07771096027', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Otosa', 5, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Oghoghosa Annaliese', 8, 2, true);

  -- Karen Walker
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Karen Walker', 'karenfingers@mail.com', '07758965146', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Emily Little', 10, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Phoebe little', 8, 2, true);

  -- Lauren Dempsey
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Lauren Dempsey', 'leo1991484@gmail.com', '07500807644', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ivy Dempsey', 7, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Hugo Dempsey', 5, 2, true);

  -- Macram Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Macram Ramba', 'rambamacram@gmail.com', '07961614219', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Nylah-Rose Thompson-Ramba', 5, 1, true);

  -- Marika Wadin
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Marika Wadin', 'marikawadin@hotmail.com', '07474050545', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Evelyn Curtis', 6, 1, true);

  -- Michael Redfren
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Michael Redfren', 'mike.ace85@outlook.com', '07585949096', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Emily Redfren', 10, 1, true);

  -- Ms Victoria Moreno Lamas
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Ms Victoria Moreno Lamas', 'spainlamas2@gmail.com', '07885236296', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Elisa', 7, 1, true);

  -- Nicola Jones
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Nicola Jones', 'Nicolaj_26@hotmail.co.uk', '07722504260', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Darcey jones', 5, 1, true);

  -- Olajide Ogidan
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Olajide Ogidan', 'ogidex11@yahoo.com', '07878167168', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Mofopefoluwa ogidan', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Mofiyinfoluwa ogidan', 6, 2, true);

  -- Sarah Anang
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Sarah Anang', 'sarahanang@yahoo.co.uk', '07897544855', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Afia', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Fifi', 6, 2, true);

  -- Shinead Kanu
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Shinead Kanu', 'mrsshineadkanu@gmail.com', '07933188899', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Charis kanu', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Jonathan Kanu', 7, 2, true);

  -- Stacey Harlow-Singh
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Stacey Harlow-Singh', 'staceyhs@hotmail.co.uk', '07535621856', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Isla Taylor', 6, 1, true);

  -- Winnie Ramba
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Winnie Ramba', 'winniejustin@yahoo.com', '07369266716', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Amanie Udah', 9, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Ambago Aj Udah', 6, 2, true);

  -- Yasmine Ali
  INSERT INTO registrations (event_id, parent_name, parent_email, parent_phone, status, attended, photo_video_consent)
  VALUES (v_event_id, 'Yasmine Ali', 'yasmineally@ymail.com', '07424436790', 'confirmed', 'yes', true)
  RETURNING id INTO v_reg_id;
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Tesneem jaji', 8, 1, true);
  INSERT INTO registration_children (registration_id, child_name, child_age, display_order, attended)
  VALUES (v_reg_id, 'Tamara jaji', 7, 2, true);

END $$;
