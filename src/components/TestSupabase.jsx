import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestSupabase = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Test fetching approved listings
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            categories(name),
            user_profiles(full_name, email, phone)
          `)
          .eq('status', 'approved')
          .limit(5);

        if (listingsError) throw listingsError;

        console.log('Listings:', listings);
        setData(listings);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Supabase Test Results</h2>
      <p>Number of approved listings: {data?.length || 0}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestSupabase;