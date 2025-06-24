//controllers/exportQuotesToCSV.js
import { Job, Quote, Bodyshop } from '../models/index.js'; 
import { Parser } from 'json2csv'; 
import { Op } from 'sequelize';

export const exportQuotesToCSV = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [
        {
          model: Quote,
          as: 'quotes',
          include: [
            {
              model: Bodyshop,
              as: 'bodyshop' 
            }
          ]
        }
      ],
      where: {
        status: {
          [Op.in]: ['approved', 'paid', 'quoted', 'processed','pending_payment', 'waiting_customer_selection'] 
        }
      },
      order: [['createdAt', 'DESC']]
    });

    const rows = [];

    jobs.forEach(job => {
     
      job.quotes.forEach(quote => {
        rows.push({ 
          JobID: job.id,
          Customer: job.customerName,
          Email: job.customerEmail,
          Phone: job.customerPhone,
          Bodyshop: quote.bodyshop?.name || ' ', 
          QuotePrice: quote.price,
          QuoteNotes: quote.notes,
          QuoteDate: quote.createdAt?.toISOString()?.split('T')[0] || '',
          JobStatus: job.status
        });
      });
    });

  


    const fields = ['JobID', 'CustomerName', 'Email', 'Phone', 'Bodyshop', 'QuotePrice', 'QuoteNotes', 'QuoteDate', 'JobStatus'];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('quotes_export.csv');
    return res.send(csv);
  } catch (err) {
    console.error('❌ Error exporting CSV:', err);
    res.status(500).send('Error generating CSV');
  }
};