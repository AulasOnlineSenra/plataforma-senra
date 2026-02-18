/**
 * -----------------------------------------------------------------------------
 * GCF - SCHEDULED MESSAGES SENDER
 * -----------------------------------------------------------------------------
 *
 * This file contains the logic for a Google Cloud Function that would run on a
 * schedule (e.g., every minute) to check for and send due scheduled messages.
 *
 * In a real-world scenario, you would deploy this code as a Cloud Function
 * triggered by Cloud Scheduler.
 *
 * The key functions are:
 * - `sendDueScheduledMessages`: The main function to be triggered by the scheduler.
 * - `queryDueMessages`: Fetches messages from Firestore that are ready to be sent.
 * - `sendMessage`: Simulates sending the message (in a real app, this would use a
 *   messaging service like FCM or an email API).
 * - `updateOrDeleteSentMessage`: Updates the next send time for recurring messages
 *   or deletes one-time messages.
 *
 * This code is for demonstration and would require a proper backend setup
 * with the Firebase Admin SDK to work.
 */

import {
  getFirestore,
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
} from 'firebase-admin/firestore';
import { addDays, addWeeks, addMonths } from 'date-fns';

/**
 * The main Cloud Function entry point.
 * This function would be triggered by a Cloud Scheduler job.
 */
export async function sendDueScheduledMessages() {
  const db = getFirestore();
  const now = new Date();

  console.log(`[${now.toISOString()}] Running scheduled message sender job.`);

  try {
    const dueMessagesSnapshot = await queryDueMessages(db, now);

    if (dueMessagesSnapshot.empty) {
      console.log('No due messages to send.');
      return;
    }

    console.log(`Found ${dueMessagesSnapshot.size} messages to send.`);

    const batch = writeBatch(db);

    for (const messageDoc of dueMessagesSnapshot.docs) {
      const message = messageDoc.data();

      // 1. Send the message (e.g., create a chat message, send email/push)
      await sendMessage(db, message);

      // 2. Update or delete the scheduled message document
      updateOrDeleteSentMessage(batch, messageDoc.ref, message);
    }

    // 3. Commit all the batch operations
    await batch.commit();

    console.log('Successfully processed all due messages.');
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
    // In a production environment, you might add more robust error handling
    // or a retry mechanism here.
  }
}

/**
 * Queries Firestore for all scheduled messages that are due to be sent.
 * @param db The Firestore database instance.
 * @param now The current time.
 * @returns A QuerySnapshot of the due messages.
 */
async function queryDueMessages(db: any, now: Date) {
  const messagesRef = collectionGroup(db, 'scheduledMessages');
  const q = query(
    messagesRef,
    where('date', '<=', Timestamp.fromDate(now))
  );
  return await getDocs(q);
}

/**
 * Simulates the action of sending a message.
 * In a real application, this would involve creating a new document in a
 * 'chats' collection, sending a push notification via FCM, or sending an email.
 * @param db The Firestore database instance.
 * @param message The message data to be sent.
 */
async function sendMessage(db: any, message: any) {
  console.log(
    `Sending message from [${message.creatorId}] to [${message.contactId}]: "${message.content}"`
  );
  
  // Example: Create a new chat message document
  // const chatMessageRef = collection(db, 'chats', ...); // Define your chat structure
  // await addDoc(chatMessageRef, {
  //   senderId: message.creatorId,
  //   receiverId: message.contactId,
  //   content: message.content,
  //   timestamp: serverTimestamp(),
  // });

  // This is a placeholder for the actual sending logic.
  return Promise.resolve();
}

/**
 * Updates a recurring message for its next run time or deletes a one-time message.
 * @param batch The Firestore write batch to add the operation to.
 * @param messageRef The reference to the scheduled message document.
 * @param message The data of the message.
 */
function updateOrDeleteSentMessage(
  batch: any,
  messageRef: any,
  message: any
) {
  if (message.recurrence === 'none') {
    // It's a one-time message, so delete it.
    batch.delete(messageRef);
    console.log(`Deleting one-time message: ${messageRef.path}`);
  } else {
    // It's a recurring message, so update its next send date.
    let nextDate = (message.date as any).toDate();
    switch (message.recurrence) {
      case 'daily':
        nextDate = addDays(nextDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, 1);
        break;
    }
    batch.update(messageRef, { date: Timestamp.fromDate(nextDate) });
    console.log(
      `Updating recurring message ${messageRef.path} to next run at ${nextDate.toISOString()}`
    );
  }
}
