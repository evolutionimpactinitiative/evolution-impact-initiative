export const programmes = [
  {
    id: 1,
    title: "Creative & Wellbeing",
    description: "Sip & Paint, Design It Yourself, and Jewellery Making. Creativity as a tool for confidence.",
    borderColor: "brand-blue",
    headingColor: "brand-blue",
    image: "/IMG_6880.JPG",
  },
  {
    id: 2,
    title: "Sport & Youth",
    description: "Boxing and team sports to promote discipline, resilience, and positive mentorship.",
    borderColor: "brand-green",
    headingColor: "brand-green",
    image: "/IMG_6881.jpg",
  },
  {
    id: 3,
    title: "Support & Outreach",
    description: "Seasonal food drives, back-to-school essentials, and family resource packs.",
    borderColor: "brand-dark",
    headingColor: "brand-dark",
    image: "/support-outreach.png",
  },
  {
    id: 4,
    title: "Community Events",
    description: "Summer Fun Day and Women's Empowerment Sessions to bring people together.",
    borderColor: "brand-accent",
    headingColor: "brand-dark",
    image: "/community-events.png",
  },
];

export const testimonials = [
  {
    id: 1,
    quote: "My daughter came home glowing with confidence after the Sip & Paint session. She felt proud of what she created, and so was I.",
    author: "Parent, Medway",
    borderColor: "brand-blue",
  },
  {
    id: 2,
    quote: "This programme gave my son something positive to look forward to every week. He's calmer, more focused, and actually excited about it.",
    author: "Parent, Medway",
    borderColor: "brand-green",
  },
  {
    id: 3,
    quote: "It feels safe here. Everyone is kind. I can be myself.",
    author: "Youth Participant",
    borderColor: "brand-dark",
  },
];

export const stats = [
  { value: "300+", label: "Community Members" },
  { value: "150+", label: "Young People Supported" },
  { value: "50+", label: "Families Reached" },
];

export const impactStats = [
  { value: "300+", label: "Community members engaged" },
  { value: "150+", label: "Young people supported" },
  { value: "50+", label: "Families supported" },
  { value: "10+", label: "Community events delivered" },
];

export const donationTiers = [
  { amount: "£10", description: "Could provide art materials for a full creative workshop", color: "brand-blue" },
  { amount: "£25", description: "Could fund a young person's place on a sport programme", color: "brand-green" },
  { amount: "£50", description: "Could contribute towards a family support pack", color: "brand-dark" },
  { amount: "£100+", description: "Could help us deliver a community event that brings families together", color: "brand-dark" },
];

export const fullDonationTiers = [
  { amount: "£5", description: "Provides refreshments for a community workshop" },
  { amount: "£10", description: "Funds creative materials for a youth art session" },
  { amount: "£25", description: "Supports a young person's place on a sport programme" },
  { amount: "£50", description: "Contributes to a family support pack" },
  { amount: "£100", description: "Helps deliver a full community event session" },
  { amount: "£250+", description: "Sponsors an entire workshop programme" },
];

export const values = [
  {
    title: "Inclusion",
    description: "Everyone is welcome. Our programmes are designed to be accessible, culturally responsive and open to all.",
  },
  {
    title: "Empowerment",
    description: "We don't do things for people. We build their confidence and skills to do things for themselves.",
  },
  {
    title: "Integrity",
    description: "We operate with transparency, accountability and honesty. We say what we do, and we do what we say.",
  },
  {
    title: "Community",
    description: "We grow stronger together. Everything we deliver is co-designed with local families, shaped by real needs.",
  },
  {
    title: "Joy",
    description: "We believe joy is a form of community care. Celebration, creativity and laughter are not extras; they're essential.",
  },
];

export const upcomingEvents: Array<{
  id: number;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  description: string;
  fullDescription: string;
  image: string;
  category: string;
  ageGroup: string;
  price: string;
  capacity: string;
  whatToBring: string[];
  accessibility: string;
}> = [];

export const pastEvents = [
  {
    id: 1,
    slug: "summer-warriors-day-2025",
    title: "Evolution Kids: Summer Warriors Day",
    date: "Saturday, 19th July 2025",
    location: "Evolution Combat Academy, Rochester, Kent",
    description: "FREE kids martial arts event for ages 5-11. Two hours of boxing, kickboxing, BJJ, and obstacle courses.",
    fullDescription: `Give your child a taste of martial arts and fitness in a safe, supportive space! This wasn't just about sport - it was about confidence, discipline, focus, and fun. Children left feeling proud, empowered, and full of positive energy.

This high-energy event provided children aged 5-11 with an introduction to martial arts in a fun, inclusive environment delivered by qualified coaches.

Event Activities:
- Boxing Basics
- Kickboxing & K1 Fun
- Brazilian Jiu-Jitsu Play Zone
- Obstacle Course & Relay Challenges
- Medals & Certificates for All Kids!

Special Awards:
Every child received recognition, with special awards given for:
- Bravest Warrior
- Best Energy
- Most Respectful

This event successfully provided children with qualified coaches delivering safe, supportive instruction in an inclusive environment welcoming all children. High-energy fun activities for every participant, confidence-building through martial arts and fitness, and completely free access to quality martial arts instruction.

Delivered in Partnership: Evolution Impact Initiative CIC x Evolution Combat Academy (ECA)`,
    stats: "Our first event! Multiple children participated with medals and certificates for all",
    testimonial: "Thank you to all the families who participated and made this martial arts experience a huge success!",
    image: "/summer-warriors-day.png",
    category: "Sport & Youth",
  },
  {
    id: 2,
    slug: "back-to-school-giveaway-2025",
    title: "Back to School Giveaway",
    date: "Saturday, 30th August 2025",
    location: "Evolution Combat Academy, Rochester",
    description: "Free school uniforms and supplies for children aged 5-11. Backpacks filled with essentials at no cost.",
    fullDescription: `Get ready for a fresh start to the school year! Evolution Impact Initiative presented the Back-To-School Giveaway - a special community event providing free school uniforms and supplies to children in Medway. Our mission was to ensure every child had the essentials they needed to step into the new academic year with confidence.

This family-friendly event was open to children aged 5-11 years and featured backpacks filled with school essentials, uniforms, and more - all at no cost. Parents and guardians were warmly invited to join and pick up supplies for their kids.

Event Highlights:
- Free school uniforms for children aged 5-11
- Backpacks filled with school essentials
- Community support and family-friendly atmosphere
- No cost to families - completely free event

Impact:
The event successfully supported numerous families in the Medway area, ensuring children had the resources they needed for a strong start to the school year. Together, we built a supportive community for Medway's future.

This event has already taken place. Thank you to everyone who participated and made this community initiative a success!`,
    stats: "Our second event! Multiple families supported with free uniforms and school supplies",
    testimonial: "Thank you to everyone who participated and made this community initiative a success!",
    image: "/back-to-school-2025.png",
    category: "Support & Outreach",
  },
  {
    id: 5,
    slug: "sip-and-paint-kids-2025",
    title: "Sip & Paint for Kids",
    date: "Saturday, 27th September 2025",
    location: "Gillingham Children & Family Hub, Kent",
    description: "A creative weekend experience for children. Free entry, all materials provided, kids keep their artwork!",
    fullDescription: `Looking for a fun and inspiring activity for your little ones? Join us for our Sip & Paint Kids Event - a safe, welcoming space where children can explore their creativity, enjoy a refreshing drink, and take home their very own masterpiece!

This event is all about fun, confidence, and self-expression, giving kids the chance to try something new while parents relax knowing they're in a supportive environment.

Event Benefits:
- Free entry (community-supported initiative)
- Children keep the artwork they create
- Fun, social and confidence-building activity
- All materials provided

Spaces were limited and filled quickly. This creative experience brought together children from across the community for an afternoon of artistic expression and fun.

Creativity - Fun - Community`,
    stats: "Our third event! Children created and took home their own artwork",
    testimonial: "A wonderful creative experience for kids in a supportive environment!",
    image: "/sip-paint-kids-2025.png",
    category: "Creative & Wellbeing",
  },
  {
    id: 6,
    slug: "child-safety-programme-2025",
    title: "FREE Child Safety Programme",
    date: "Sunday, 28th September 2025",
    location: "Evolution Combat Academy, Rochester, Kent",
    description: "Essential safety skills training for children aged 5-11. Verbal and physical self-protection in a fun, supportive environment.",
    fullDescription: `Following the successful Safety Talks delivered at Evolution Combat Academy, NEXGEN PROTECTION launched the Child Safety Programme - a vital one-day training designed to teach children essential safety skills in a fun and supportive environment.

This session empowered children with both verbal and physical self-protection skills, giving them the confidence to deal with real-life situations such as travelling to and from school and responding to unwanted stranger interactions.

Programme Benefits:
- FREE for this launch event (normally £25-£50 per child)
- Covers personal safety, travel safety & stranger awareness
- Practical tools to build confidence and awareness
- Parents welcome to attend (maximum two children per adult)
- Designed for children aged 5-11 years old

What to Bring:
- Comfortable clothes (no skirts/dresses)
- Light snacks & drinks for short breaks

Delivered in Partnership:
This event was proudly brought to you by Evolution Combat Academy x NEXGEN PROTECTION x Evolution Impact Initiative CIC

Keeping Your Children Safe & Confident`,
    stats: "Our fourth event! Children learned essential safety and self-protection skills",
    testimonial: "Empowering children with confidence and practical safety skills for real-life situations!",
    image: "/child-safety-programme-2025.png",
    category: "Sport & Youth",
  },
  {
    id: 7,
    slug: "jewellery-making-workshop-2025",
    title: "Kids' Jewellery Making Workshop",
    date: "Saturday, 25th October 2025",
    location: "Gillingham Children & Family Hub, Kent",
    description: "Free creative workshop where children design and make their own bracelets, necklaces, and keychains to take home!",
    fullDescription: `Looking for a fun, hands-on activity that helps children explore creativity and self-expression? Join us for our Kids' Jewellery Making Workshop - a free, community event where young creators designed and made their own bracelets, necklaces, and keychains to take home!

This event promoted creativity, focus, and fine motor skills - while encouraging teamwork and confidence. Children had the freedom to create their own designs, learn basic crafting techniques, and proudly showcase their work at the end of the session.

Event Highlights:
- Free entry - supported by Evolution Impact Initiative CIC
- All materials provided - children take home what they make
- Boosts creativity, confidence, and social skills
- Safe, supervised and inclusive environment
- Great weekend activity for local families
- Light refreshments available

What Children Created:
- Custom bracelets with colorful beads and charms
- Personalized necklaces they designed themselves
- Fun keychains to keep or gift to friends and family
- All items were theirs to take home and treasure!

Why It Matters:
Our workshops are designed to inspire creativity while supporting children's wellbeing and emotional growth. Jewellery making encourages focus, patience, and self-expression - key skills that improve confidence and mental wellbeing in a fun, engaging way.

Creativity - Confidence - Community`,
    stats: "Our fifth event! Children created custom bracelets, necklaces, and keychains",
    testimonial: "A wonderful creative experience that boosted confidence and self-expression!",
    image: "/jewellery-making-2025.png",
    category: "Creative & Wellbeing",
  },
  {
    id: 8,
    slug: "big-bake-off-christmas-2025",
    title: "The Big Bake Off - Christmas Edition",
    date: "Saturday, 13th December 2025",
    location: "Gillingham Family Hub, Kent",
    description: "A festive team-based baking challenge where kids competed to create, decorate, and present Christmas cupcakes!",
    fullDescription: `Get ready for a festive afternoon full of fun, flour, and friendly competition!

The Big Bake Off - Christmas Edition was a joyful, team-based baking challenge where kids competed to create, decorate, and present their best Christmas cupcakes!

Working in teams, each child took on a role, collaborated with others, and showcased their creativity through baking. The event ended with a judging round where cupcakes were scored for taste, design, texture, and teamwork - and the winning team walked away with a special prize!

Event Highlights:
- Free to attend - supported by Evolution Impact Initiative CIC
- All ingredients and materials provided
- Children worked in teams of 4 with a team leader
- Judging based on creativity, teamwork, taste, and design
- Prizes for the winning team - baking kits to take home!
- Safe, inclusive, and supervised environment

What the Kids Did:
- Baked festive cupcakes in small teams
- Decorated and presented their baked goods to a panel of judges
- Learned basic baking and presentation skills
- Gained confidence through teamwork and creativity

Why It Matters:
This festive event was more than just baking - it was about building teamwork and communication skills, encouraging creativity and confidence, bringing children and families together for a joyful experience, and spreading holiday cheer in a meaningful, hands-on way.

Creativity - Teamwork - Holiday Fun`,
    stats: "Our sixth event! Teams competed in a festive cupcake baking challenge",
    testimonial: "A wonderful festive experience bringing families together through creativity and teamwork!",
    image: "/big-bake-off-2025.png",
    category: "Creative & Wellbeing",
  },
  {
    id: 9,
    slug: "christmas-turkey-giveaway-2025",
    title: "Christmas Turkey Giveaway 2025",
    date: "Tuesday, 23rd December 2025",
    location: "Medway",
    description: "Supporting families in need this Christmas. Fifty turkeys distributed to households across Medway.",
    fullDescription: `Medway Soup Kitchen CIC in partnership with Evolution Impact Initiative CIC ran a Christmas Turkey Giveaway for families who were experiencing financial hardship this holiday season.

On Tuesday 23rd December 2025, we distributed fifty turkeys to households across Medway so families could enjoy a festive meal at home without stress or financial pressure.

Christmas can be overwhelming for those struggling with the cost of living. A turkey may seem small, but it can make a big difference.

Who This Was For:
This support was for individuals and families in Medway who found it difficult to afford Christmas food. Priority was given to households with children. There was no requirement to explain circumstances - if families felt they needed support, they were welcome to register.

What Families Received:
- One turkey per household
- Collection from Medway

Why This Matters:
A Christmas meal is more than food. It is dignity, family and celebration. Together we relieved stress, reduced food insecurity and created moments of joy for families who were struggling.

Delivered in Partnership:
Medway Soup Kitchen CIC x Evolution Impact Initiative CIC

Small Acts - Big Impact`,
    stats: "Our seventh event! 50 turkeys distributed to families across Medway",
    testimonial: "A Christmas meal is more than food. It is dignity, family and celebration.",
    image: "/turkey-giveaway-2025.png",
    category: "Support & Outreach",
  },
  {
    id: 10,
    slug: "valentines-sip-and-paint-2026",
    title: "Valentine's Sip & Paint",
    date: "Saturday, 14th February 2026",
    location: "Sunlight Centre, Gillingham, Kent",
    description: "A creative celebration for Children's Mental Health Week. Valentine's-themed painting for children aged 4-11.",
    fullDescription: `Join us for a special Valentine's Sip & Paint event celebrating Children's Mental Health Week! This creative, fun-filled session gave children the chance to express themselves through art in a safe and supportive environment.

Painting and creative activities are proven to support emotional wellbeing, helping children relax, build confidence, and explore their feelings in a positive way.

Each child created their own Valentine's-themed artwork to take home, while enjoying refreshments and making new friends.

Event Highlights:
- Free entry - supported by Evolution Impact Initiative CIC
- All art materials and supplies provided
- Valentine's-themed painting activity
- Children take home their artwork
- Refreshments included
- Safe, inclusive, and supervised environment

Why Children's Mental Health Week Matters:
Children's Mental Health Week is a national campaign that shines a light on the importance of children and young people's mental health.

Creative activities like painting help children:
- Express emotions they may find hard to put into words
- Build confidence and self-esteem
- Reduce stress and anxiety
- Develop focus and mindfulness
- Connect with others in a relaxed setting

What Children Experienced:
- Step-by-step guided painting session
- All materials provided
- A welcoming space for children of all abilities
- A finished painting to take home and treasure

Creativity - Wellbeing - Community`,
    stats: "Our first event of 2026! Celebrating Children's Mental Health Week through creativity",
    testimonial: "A wonderful way to celebrate Children's Mental Health Week through art and self-expression!",
    image: "/valentines-sip-paint-2026.png",
    category: "Creative & Wellbeing",
  },
];

export const pillars = [
  {
    id: 1,
    title: "Creative & Wellbeing",
    tagline: "Creativity builds confidence.",
    description: "Creative workshops that promote self-expression, emotional wellbeing and genuine connection. Our sessions are open to all ages and abilities.",
    programmes: ["Sip & Paint", "Design It Yourself", "Jewellery Making", "Youth Creative Sessions", "Creative Summer Sessions"],
    outcomes: ["Self-confidence", "Emotional expression", "Social connection", "Fine motor skills", "Sense of achievement"],
    image: "/IMG_6880.JPG",
    color: "brand-blue",
  },
  {
    id: 2,
    title: "Sport & Youth Development",
    tagline: "Discipline. Resilience. Growth.",
    description: "Structured sport programmes designed to do much more than build fitness. We use boxing, team training and physical challenges as vehicles for character development.",
    programmes: ["Youth Boxing & Fitness (non-contact)", "Team-Building Workshops", "Mentorship Through Sport", "Seasonal Sport Camps (HAF-aligned)"],
    outcomes: ["Physical fitness", "Emotional regulation", "Goal-setting", "Positive relationships", "Leadership"],
    image: "/IMG_6881.jpg",
    color: "brand-green",
  },
  {
    id: 3,
    title: "Community Support & Outreach",
    tagline: "Showing up when it matters most.",
    description: "Direct, practical support for families and individuals navigating challenging times.",
    programmes: ["Seasonal Food Support", "Back-to-School Drives", "Family Resource Packs", "Signposting & Referrals"],
    outcomes: ["Practical support", "Reduced financial stress", "Access to services", "Community connection", "Dignity"],
    image: "/support-outreach.png",
    color: "brand-dark",
  },
  {
    id: 4,
    title: "Community Events & Celebration",
    tagline: "Joy is community care.",
    description: "Safe, vibrant events that bring people together, celebrate local talent and strengthen community bonds.",
    programmes: ["Summer Fun Day (flagship)", "Women's Empowerment Sessions", "Community Networking Events", "Family Celebration Events"],
    outcomes: ["Social connection", "Belonging", "Community pride", "Access to orgs", "Fun"],
    image: "/community-events.png",
    color: "brand-accent",
  },
];

export const teamMembers = [
  {
    name: "M Ramba",
    role: "Co-founder & Managing Director",
    bio: "Driving strategy, partnerships, and mission alignment",
    email: "macram@evolutionimpactinitiative.co.uk",
    image: "/Team/Macram.jpg",
  },
  {
    name: "A Smith",
    role: "Co-founder & Managing Director",
    bio: "Driving partnerships, networking, facilities, and content creation.",
    email: "ashley@evolutionimpactinitiative.co.uk",
    image: "/Team/Ashley.jpg",
  },
  {
    name: "B Emuchay",
    role: "Finance & Funding Lead (Treasurer)",
    bio: "Managing budgets, funding applications, and financial reporting",
    email: "blessing@evolutionimpactinitiative.co.uk",
    image: "/Team/Blessing.jpg",
  },
  {
    name: "F Ayeni",
    role: "Partnerships & Outreach Lead",
    bio: "Building collaborations with schools, councils, charities, and the wider community.",
    email: "funmi@evolutionimpactinitiative.co.uk",
    image: "/Team/Funmi.jpg",
  },
  {
    name: "L Rogers",
    role: "Communications & Marketing Lead",
    bio: "Managing social media, branding, and PR to grow visibility and community engagement.",
    email: "luke@evolutionimpactinitiative.co.uk",
    image: "/Team/Luke.jpg",
  },
  {
    name: "N Ramba",
    role: "Operations & Compliance Lead",
    bio: "Overseeing daily operations, safeguarding, compliance, and CIC reporting.",
    email: "nevien@evolutionimpactinitiative.co.uk",
    image: "/Team/Nevien.jpg",
  },
];

export const navLinks = [
  { href: "/about", label: "About Us" },
  { href: "/our-work", label: "Our Work" },
  { href: "/events", label: "Events" },
  { href: "/donate", label: "Donate" },
  { href: "/contact", label: "Contact" },
];

export const footerNav = [
  { href: "/about", label: "About Us" },
  { href: "/our-work", label: "Our Work" },
  { href: "/events", label: "Events" },
  { href: "/donate", label: "Donate" },
];

export const footerInvolve = [
  { href: "/get-involved", label: "Volunteer" },
  { href: "/get-involved#partner", label: "Partner With Us" },
  { href: "/contact", label: "Contact Us" },
];

export const footerGovernance = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/safeguarding", label: "Safeguarding Policy" },
  { href: "/cic-statement", label: "CIC Statement" },
  { href: "/accessibility", label: "Accessibility" },
];
