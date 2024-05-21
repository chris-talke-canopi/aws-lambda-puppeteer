const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let { data: be_jobs, error } = await supabase.from('be_jobs').select('*').order('id', false);

    return {
        status: 200,
        message: be_jobs
    };
};
