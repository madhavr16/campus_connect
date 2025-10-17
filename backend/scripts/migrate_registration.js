require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_connect';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;
    const coll = db.collection('users');

    try {
        const indexes = await coll.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));
        const hasEmailIndex = indexes.some(i => i.name === 'email_1');
        if (hasEmailIndex) {
            console.log('Dropping old index: email_1');
            try { await coll.dropIndex('email_1'); console.log('Dropped email_1'); } catch (e) { console.warn('Failed to drop email_1:', e.message); }
        } else {
            console.log('No email_1 index found');
        }

        // Find users missing registrationNumber
        const cursor = coll.find({ registrationNumber: { $exists: false } });
        let updated = 0;
        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const reg = doc.email || (`legacy_${doc._id}`);
            // set registrationNumber
            await coll.updateOne({ _id: doc._id }, { $set: { registrationNumber: reg } });
            updated++;
        }
        console.log('Populated registrationNumber for', updated, 'documents');

        // Create unique index on registrationNumber
        try {
            console.log('Creating unique index on registrationNumber...');
            await coll.createIndex({ registrationNumber: 1 }, { unique: true });
            console.log('Created unique index on registrationNumber');
        } catch (e) {
            console.error('Failed to create unique index on registrationNumber:', e.message);
        }

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
