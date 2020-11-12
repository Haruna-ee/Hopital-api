const { mailTransport, APP_NAME } = require("../config");
const new_line = "\n\xA0";
const ehopitalEmail = "harunamuazang1994@gmail.com";

// Sends a welcome email to the given user.
async function sendWelcomeEmail(email) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  const displayName = "ASwiftConnect User";

  // The user subscribed to the newsletter.
  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.text = `Hey ${
    displayName || ""
  }! Welcome to ${APP_NAME}. I hope you will enjoy our services.`;
  await mailTransport.sendMail(mailOptions);
  console.log("New welcome email sent to:", email);
  return null;
}

async function sendSubscriberWelcome(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: data.email,
  };
  mailOptions.subject = `Yaay you subscribed to ${APP_NAME} Mailing list!`;
  mailOptions.html = data.emailTemplate;
  await mailTransport.sendMail(mailOptions);
  return null;
}

async function sendUserWelcome(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: data.email,
  };
  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.html = data.emailTemplate;
  await mailTransport.sendMail(mailOptions);
  return null;
}

async function sendRequestStatus(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: data.email,
  };
  mailOptions.subject = `Request status at ${APP_NAME}!`;

  if (data.status) {
    mailOptions.html = data.approvedTemplate;
  } else {
    mailOptions.html = data.disapprovedTemplate;
  }
  await mailTransport.sendMail(mailOptions);
  return null;
}


async function sendProfileDeletionWarning(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: data.email,
  };

  mailOptions.subject = `Profile deletion set at ${APP_NAME}!`;
  mailOptions.html = data.emailTemplate;
  await mailTransport.sendMail(mailOptions);
  return null;
}


async function sendRequestComment(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: data.email,
  };
  mailOptions.subject = `Request status at ${APP_NAME}!`;

  mailOptions.html = data.template;
  await mailTransport.sendMail(mailOptions);
  return null;
}

async function sendUserFeedback(data) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: `${ehopitalEmail}`,
  };

  const displayName = "ASwiftConnect Admin";

  // The user subscribed to the newsletter.
  mailOptions.subject = `Feedback from ${APP_NAME} user!`;
  mailOptions.text = `Hi ${displayName} ,  ${new_line} 
  ${data.message || ""} ${new_line}
  >>>>You can reply to the user here : ${data.email} `;
  await mailTransport.sendMail(mailOptions);
  return null;
}

module.exports = {
  sendWelcomeEmail,
  sendSubscriberWelcome,
  sendUserWelcome,
  sendRequestStatus,
  sendRequestComment,
  sendUserFeedback,
  sendProfileDeletionWarning
};
