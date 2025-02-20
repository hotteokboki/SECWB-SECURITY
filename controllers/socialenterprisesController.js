const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getSocialEnterprisesByProgram = async (programId) => {
  try {
    // Query to get social enterprises by program_id
    const query = 'SELECT se_id, team_name, abbr FROM SocialEnterprises WHERE program_id = $1';
    const values = [programId];

    const result = await pgDatabase.query(query, values);

    // If no social enterprises are found, return an empty array
    if (!result.rows.length) {
      return [];
    }

    // Map the results to the desired format
    return result.rows.map(se => ({
      text: se.team_name, 
      abbr: se.abbr,
      callback_data: `enterprise_${se.se_id}`
    }));
  } catch (error) {
    console.error("Error fetching Social Enterprises:", error);
    return [];
  }
};

exports.getSocialEnterpriseByID = async (se_id) => {
  try {
    console.log(`🔍 Fetching social enterprise with ID: ${se_id}`);

    // Query to get a social enterprise by se_id
    const query = 'SELECT * FROM "socialenterprises" WHERE "se_id" = $1';
    const values = [se_id];

    const result = await pgDatabase.query(query, values);

    // If no matching social enterprise is found, return null
    if (!result.rows.length) {
      console.log(`⚠️ No social enterprise found for ID: ${se_id}`);
      return null;
    }

    return result.rows[0]; // Return the first (and only) matching row
  } catch (error) {
    console.error("❌ Error fetching social enterprise:", error);
    return null;
  }
};

exports.getAllSocialEnterprises = async () => {
  try {
    const res = await pgDatabase.query('SELECT * FROM socialenterprises');
    
    if (!res.rows || res.rows.length === 0) {
      console.error("No SE found");
      return null; // or return an empty array []
    }

    return res.rows; // return the list of users
  } catch (error) {
    console.error("Error fetching user:", error);
    return null; // or handle error more gracefully
  }
};

exports.getAllSocialEnterprisesWithMentorship = async () => {
  try {
      const query = `
      SELECT 
          se.se_id, 
          se.team_name, 
          p.name AS program_name, -- ✅ Fetch program name
          COALESCE(
              JSON_AGG(
                  CASE 
                      WHEN m.mentor_id IS NOT NULL 
                      THEN JSON_BUILD_OBJECT(
                          'mentor_id', m.mentor_id,
                          'mentor_name', CONCAT(m.mentor_firstname, ' ', m.mentor_lastname)
                      ) 
                      ELSE NULL 
                  END
              ) FILTER (WHERE m.mentor_id IS NOT NULL), 
              '[]'
          ) AS mentors
      FROM socialenterprises AS se
      LEFT JOIN mentorships AS ms ON se.se_id = ms.se_id
      LEFT JOIN mentors AS m ON ms.mentor_id = m.mentor_id
      LEFT JOIN programs AS p ON se.program_id = p.program_id -- ✅ Join with programs table
      GROUP BY se.se_id, se.team_name, p.name;
      `;

      const result = await pgDatabase.query(query);
      return result.rows.length ? result.rows : [];
  } catch (error) {
      console.error("❌ Error fetching social enterprises with mentorship info:", error);
      return [];
  }
};

