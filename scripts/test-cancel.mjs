import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function testCancelFlow() {
  console.log('Creating test registration...');

  // Get first event
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (!events?.length) {
    console.error('No events found');
    return;
  }

  const event = events[0];
  console.log('Using event:', event.title);

  // Create test registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({
      event_id: event.id,
      parent_name: 'Test Parent',
      parent_email: 'hello@evolutionimpactinitiative.co.uk',
      parent_phone: '07123456789',
      status: 'confirmed'
    })
    .select()
    .single();

  if (regError) {
    console.error('Failed to create registration:', regError);
    return;
  }

  console.log('Created registration:', registration.id);

  // Add test child
  await supabase
    .from('registration_children')
    .insert({
      registration_id: registration.id,
      child_name: 'Test Child',
      child_age: 8,
      display_order: 0
    });

  // Generate cancel link
  const BASE_URL = 'http://localhost:3000';
  const cancelLink = `${BASE_URL}/cancel-registration?id=${registration.id}`;

  console.log('\n=== TEST CANCEL LINK ===');
  console.log(cancelLink);
  console.log('========================\n');

  // Send test email with cancel link
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: 'Evolution Impact Initiative <hello@evolutionimpactinitiative.co.uk>',
    to: 'hello@evolutionimpactinitiative.co.uk',
    subject: `Test Cancel: ${event.title}`,
    html: `
      <h1>Test Registration Created</h1>
      <p>Click below to test the cancellation flow:</p>
      <p><a href="${cancelLink}" style="background: #17559D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Cancel Registration</a></p>
      <p>Or copy this link: ${cancelLink}</p>
      <hr>
      <p>Registration ID: ${registration.id}</p>
      <p>Event: ${event.title}</p>
    `
  });

  if (emailError) {
    console.error('Email error:', emailError);
  } else {
    console.log('Test email sent! ID:', emailData?.id);
  }
}

testCancelFlow();
