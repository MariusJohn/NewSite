// restoreJobHandler.js
import { Job } from '../models/index.js';

const ADMIN_BASE = process.env.ADMIN_BASE;


const restoreJobHandler = async (req, res) => {
    console.log("➡️ Restore handler function executed for job ID:", req.params.id);
    const { id } = req.params;
    try {
        await Job.update({ status: 'pending' }, { where: { id: id } }); // Or 'live'
        res.redirect(`/jobs${ADMIN_BASE}?filter=live`);

    } catch (err) {
        console.error('❌ Error restoring job:', err);
        res.status(500).send('Server error while restoring job.');
    }
};

export default restoreJobHandler;