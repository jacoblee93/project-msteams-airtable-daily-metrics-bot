const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

/**
* An API endpoint triggered daily that fetches user signup data from Airtable,
* summarizes it, and send the results to Microsoft Teams.
* @returns {object} result Your return value
*/
module.exports = async () => {

  // Store API Responses
  const result = {};

  result.airtable = {};
  result.airtable.selectQueryResult = await lib.airtable.query['@0.4.3'].select({
    table: `Users`,
    where: [
      {
        'Created At__date_gte': new Date(new Date().getTime() - 86400000)
      }
    ]
  });

  let formattedSignupText = result.airtable.selectQueryResult.rows.slice(0, 10).map((signup) => {
    let signupText = `**${signup.fields['Username']}** [${signup.fields['Email']}](mailto:${signup.fields['Email']})<br>`;
    if (signup.fields['Company']) {
      signupText += `*${signup.fields['Company']}*`;
    }
    if (signup.fields['Title']) {
      signupText += ` *${signup.fields['Title']}*`;
    }
    return signupText;
  }).join('<br>');

  let messageBody = `There were **${result.airtable.selectQueryResult.rows.length}** signups in the last 24 hours!`;
  if (result.airtable.selectQueryResult.rows.length) {
    messageBody += ` Here are the most recent ones:<br><br>${formattedSignupText}`;
  }

  result.microsoftteams = {};
  result.microsoftteams.messageResult = await lib.microsoftteams.messages['@0.0.0'].create({
    channel: `General`,
    body: messageBody
  });

  return result;

};