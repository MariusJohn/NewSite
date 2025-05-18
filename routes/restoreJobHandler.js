// restoreJobHandler.js
import { Job } from '../models/index.js';

const restoreJobHandler = async (req, res) => {
    console.log("➡️ Restore handler function executed for job ID:", req.params.id);
    const { id } = req.params;
    try {
        await Job.update({ status: 'pending' }, { where: { id: id } }); // Or 'live'
        res.redirect('/jobs/admin?filter=live');
    } catch (err) {
        console.error('❌ Error restoring job:', err);
        res.status(500).send('Server error while restoring job.');
    }
};

export default restoreJobHandler;