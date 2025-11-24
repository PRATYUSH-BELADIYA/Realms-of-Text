// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wrfakjoxwkmknzxplcqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZmFram94d2tta256eHBsY3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDUzMzksImV4cCI6MjA3OTEyMTMzOX0.Asph_8gAKZMBi3H2UJ7ugJJHsrFGdhxGFOCnj4Yzx50';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to save
export const saveToCloud = async (email, playerData) => {
    const { error } = await supabase
        .from('saves')
        .upsert({ id: email , data: playerData }) // upsert = insert or update
    
    if (error) console.error('Error saving:', error);
    return !error;
};

// Helper to load
export const loadFromCloud = async (email) => {
    const { data, error } = await supabase
        .from('saves')
        .select('data')
        .eq('id', email)
        .single();

    if (error) {
        console.error('Error loading:', error);
        return null;
    }
    return data ? data.data : null;
};