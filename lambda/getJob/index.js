const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let payload = JSON.parse(event.body);
    let { data: be_jobs } = await supabase.from('be_jobs').select('*').eq('batchId', payload.batchId);
    let { data: be_items } = await supabase.from('be_jobs').select('*').eq('batchId', payload.batchId);

    const job = be_jobs[0];
    job.items = be_items;

    return {
        status: 200,
        message: job
    };
};
