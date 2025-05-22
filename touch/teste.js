subject: `Update on Your Job #${job.id} - No Quotes Received Yet`,
text: `Hi ${job.customerName || ''},

We wanted to let you know that your job (#${job.id}) hasn’t received any quotes from local bodyshops yet.

Would you like to keep it active for another 24 hours to allow more time for responses?

Please reply YES to extend, or NO to cancel.  
You can also use the links below:

Extend: https://yourdomain.com/job/extend?id=${job.id}&response=yes  
Cancel: https://yourdomain.com/job/extend?id=${job.id}&response=no

Thanks for using MC Quote. We’re here to help you get the best repair quotes!`