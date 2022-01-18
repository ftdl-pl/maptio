/* eslint-disable @typescript-eslint/no-var-requires */

// Old imports
// TODO: Import as ES6 modules
const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const templating = require('lodash/template');
require('dotenv').config();


// New imports
import { Request, Response, NextFunction } from 'express'

import { getAuth0MangementClient } from '../auth/management-client';


const isDevelopment = process.env.NODE_ENV !== 'production';

// TODO: Dry just like the Auth0 code has been dried
const ses = new aws.SES({
  apiVersion: '2010-12-01',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.AWS_DEFAULT_ENDPOINT,
});


router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  let inviteData;
  let userData;
  let userEmail: string;
  let invitedBy: string;
  let teamName: string;

  // TODO: Error checking could be improved hear to avoid the try/catch tower of terror

  try {
    inviteData = req.body;
    userData = inviteData.userData;
    userEmail = userData.email;
    invitedBy = inviteData.invitedBy;
    teamName = inviteData.teamName;
  } catch(error) {
    error.message = 'Error parsing invite data: ' + error.message;
    return next(error);
  }

  let auth0ManagementClient;
  let createdUser;
  let createdUserId: string;

  try {
    auth0ManagementClient = getAuth0MangementClient();

    createdUser = await auth0ManagementClient
      .createUser(userData)
  } catch(error) {
    error.message = 'Error creating invited user in Auth0: ' + error.message;
    return next(error);
  }

  try {
    createdUserId = createdUser.user_id;
  } catch(error) {
    error.message = 'Error getting ID of created user: ' + error.message;
    return next(error);
  }

  let verifyEmailTicketResponse;

  try {
    verifyEmailTicketResponse = await auth0ManagementClient
      .tickets
      // TODO: Use password change instead
      .verifyEmail({
        user_id: createdUserId,
        // TODO: Add a real return URL
        result_url: 'http://localhost:4200',
      })
  } catch(error) {
    error.message = 'Error getting ticket from Auth0 for user invitation (password change)' + error.message;
    return next(error);
  }

  let verifyEmailTicket: string;

  try {
    verifyEmailTicket = verifyEmailTicketResponse.ticket;
  } catch(error) {
    error.message = 'Error processing password change ticket response from Auth0: ' + error.message;
    return next(error);
  }

  let sendInvitationEmailResponse;

  try {
    sendInvitationEmailResponse = await sendInvitationEmail(
      userEmail,
      invitedBy,
      teamName,
      verifyEmailTicket,
    )
  } catch(error) {
    error.message = 'Error sending invitation email: ' + error.message;
    return next(error);
  }

  // TODO: Inherited from FE code but might be worth digging into whether this is the best way to do this
  const sendInvitationEmailSuccess = sendInvitationEmailResponse.MessageId !== undefined;

  res.send(sendInvitationEmailSuccess);
});

function sendInvitationEmail(userEmail, invitedBy, team, url) {
  const from = process.env.SUPPORT_EMAIL;
  const to = isDevelopment ? process.env.DEVELOPMENT_EMAIL : userEmail;
  const subject = `${invitedBy} invited you to join organisation "${team}" on Maptio`;

  const template = templating(
    fs.readFileSync(
      path.join(__dirname, 'assets/templates/email-invitation.html')
    )
  );
  const htmlBody = template({ url, team });

  return ses.sendEmail({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Body: {
        Html: {
          Data: htmlBody,
        },
      },
      Subject: {
        Data: subject,
      },
    },
  }).promise();
}

module.exports = router;
