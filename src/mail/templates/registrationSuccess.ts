export const registrationSuccess = (
    email: string,
    name: string,
    password: string
): string => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Registration Successful</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <a href="https://www.inbestnow.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo_blue.4b277909.webp&w=256&q=75" alt="InBestNow Logo"></a>
            <div class="message">Registration Successful</div>
            <div class="body">
                <p>Hey ${name},</p>
                <p>Welcome to our Lead Management System! Your account has been successfully created.</p>
                <p>Your login credentials are:</p>
                <p>Email: <span class="highlight">${email}</span></p>
                <p>Password: <span class="highlight">${password}</span></p>
                <p>Please keep this information secure and do not share it. If you did not request this registration, contact us immediately.</p>
            </div>
            <div class="support">
                If you have any questions or need assistance, reach out to us at
                <a href="mailto:marketing@inbestnow.com">marketing@inbestnow.com</a> or call us at +91 89812 14333.<br>
                <a href="https://www.inbestnow.com">InBestNow</a><br>
                6th Floor, Suite # 608 and 609, Ashoka House,<br>
                3A, Hare St, B.B.D. Bagh, Kolkata, West Bengal 700001
            </div>
        </div>
    </body>
    
    </html>`;
};
