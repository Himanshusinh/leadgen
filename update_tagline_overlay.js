const fs = require('fs');
const path = require('path');

function main() {
  const filePath = path.join(__dirname, 'email_template.html');
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Search for the HERO IMAGE and TAGLINE blocks to replace
  const targetPattern = `                    <!-- HERO IMAGE -->
                    <tr>
                        <td align="center" style="padding: 0;">
                            <img src="/ChatGPT%20Image%20Jul%202,%202026,%2001_10_10%20PM.png" width="100%" alt="Flybit Dynamics Drone Light Show" style="display: block; width: 100%; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;" />
                        </td>
                    </tr>

                    <!-- TAGLINE -->
                    <tr>
                        <td align="center" style="padding: 35px 40px 15px 40px;">
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 16px; color: #f3ead9; text-align: center; margin: 0; line-height: 1.6; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);">
                                "We craft experiences that touch hearts and create memories that last a lifetime."
                            </p>
                        </td>
                    </tr>`;

  const replacement = `                    <!-- HERO IMAGE WITH OVERLAY TEXT AT THE BOTTOM -->
                    <tr>
                        <td align="center" background="/ChatGPT%20Image%20Jul%202,%202026,%2001_10_10%20PM.png" bgcolor="#0a0a0c" valign="bottom" style="background-image: url('/ChatGPT%20Image%20Jul%202,%202026,%2001_10_10%20PM.png'); background-position: center bottom; background-size: cover; background-repeat: no-repeat; height: 380px; padding: 0;">
                            <!--[if gte mso 9]>
                            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:650px;height:380px;">
                              <v:fill type="tile" src="/ChatGPT%20Image%20Jul%202,%202026,%2001_10_10%20PM.png" color="#0a0a0c" />
                              <v:textbox inset="0,0,0,0">
                            <![endif]-->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                                <tr>
                                    <!-- A subtle dark gradient overlay at the bottom to ensure high text readability -->
                                    <td align="center" style="padding: 60px 40px 25px 40px; background: linear-gradient(180deg, rgba(10, 10, 12, 0) 0%, rgba(10, 10, 12, 0.95) 100%);">
                                        <p style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 16.5px; color: #f3ead9; text-align: center; margin: 0; line-height: 1.6; text-shadow: 0 2px 12px rgba(0, 0, 0, 1), 0 1px 4px rgba(0, 0, 0, 1); font-weight: 500;">
                                            "We craft experiences that touch hearts and create memories that last a lifetime."
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <!--[if gte mso 9]>
                              </v:textbox>
                            </v:rect>
                            <![endif]-->
                        </td>
                    </tr>`;

  if (html.includes(targetPattern)) {
    html = html.replace(targetPattern, replacement);
    console.log("Successfully replaced hero image and tagline with background overlay cell.");
  } else {
    // Attempt relaxed replacement if spacing is slightly different
    console.log("Strict pattern match failed, trying relaxed pattern search...");
    const regexPattern = /<!-- HERO IMAGE -->[\s\S]*?<!-- TAGLINE -->[\s\S]*?<\/tr>/;
    if (regexPattern.test(html)) {
      html = html.replace(regexPattern, replacement);
      console.log("Relaxed pattern search matched and replaced.");
    } else {
      console.error("Failed to find hero image and tagline blocks in HTML.");
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
}

main();
