// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to dfinition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
	const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
	console.log(supabaseUrl, supabaseAnonKey)
	const supabaseClient = createClient(
		supabaseUrl,
		supabaseAnonKey,
		{ global: { headers: { Authorization: req.headers.get('Authorization')! } } }
	);
	const books = await supabaseClient.from('Books').select('*');
	console.log(books);
	const auth = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');

	const { name } = await req.json();
	const data = {
		message: `Hello ${name}!`
	};

	return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});
